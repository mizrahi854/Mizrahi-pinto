import React, { useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LightScreen, LCard, ls } from '@/components/light';
import { Tap, toast, Badge } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { Note } from '@/components/forms';
import { useApp } from '@/store/useApp';
import { useLogTarget, useMeals } from '@/store/selectors';
import { aiConnected, recognizeMeal } from '@/lib/ai';
import { prettyDate } from '@/lib/dates';
import { light, fonts, radius, space } from '@/theme/tokens';

/**
 * Photograph a meal. The photo is attached to the meal in the diary. AI recognition runs only when the
 * service is connected; otherwise nothing is "recognised" and the user continues with description/search.
 */
export default function MealPhoto() {
  const target = useLogTarget();
  const meals = useMeals();
  const setMealMeta = useApp((s) => s.setMealMeta);
  const setDraft = useApp((s) => s.setDraft);
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mealLabel = meals.find((m) => m.key === target.meal)?.label ?? '';

  const pick = async (camera: boolean) => {
    if (camera) {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) return toast('אין הרשאה למצלמה – אפשר לאשר בהגדרות, או לבחור מהגלריה');
    }
    const r = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (r.canceled || !r.assets[0]) return;
    const u = r.assets[0].uri;
    setUri(u);
    setMealMeta(target.date, target.meal, { photo: u });
    toast(`התמונה צורפה ל${mealLabel}`);
    if (aiConnected) {
      setBusy(true);
      try {
        const items = await recognizeMeal({ imageUri: u });
        // AI suggestions go through the same confirmation screen as free text – nothing is saved automatically
        setDraft('describe', items.map((i) => (i.grams ? `${i.grams} גרם ${i.name}` : i.name)).join(', '));
        router.replace('/describe');
      } catch {
        toast('הזיהוי נכשל – אפשר להמשיך בתיאור או בחיפוש');
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <LightScreen title="צילום ארוחה" subtitle={`${mealLabel} · ${prettyDate(target.date)}`}>
      <View style={styles.frame}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="תמונת הארוחה" /> : <Icon name="camera" size={56} color={light.accent} />}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: space.md }}>
        {Platform.OS !== 'web' && <Big icon="camera" label="צילום" onPress={() => pick(true)} primary />}
        <Big icon="image" label={Platform.OS === 'web' ? 'צילום או בחירת תמונה' : 'מהגלריה'} onPress={() => pick(false)} primary={Platform.OS === 'web'} />
      </View>
      <LCard style={{ marginTop: space.lg, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={ls.bodyStrong}>זיהוי מזון מתמונה</Text>
          <Badge text={aiConnected ? (busy ? 'מזהה…' : 'מחובר') : 'ממתין לחיבור'} tone={aiConnected ? 'accent' : 'muted'} />
        </View>
        <Text style={ls.muted}>{aiConnected ? 'ההצעות יוצגו לאישור ולתיקון לפני שמירה.' : 'שירות הזיהוי עדיין לא מחובר, ולכן לא תוצג הערכה. התמונה נשמרת עם הארוחה, ואת התוכן מוסיפים בתיאור קצר או בחיפוש.'}</Text>
      </LCard>
      {uri && !aiConnected && (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: space.md }}>
          <Big icon="edit" label="תיאור במילים" onPress={() => router.replace('/describe')} />
          <Big icon="search" label="חיפוש מוצרים" onPress={() => router.replace('/foods?focus=1')} />
        </View>
      )}
      <View style={{ marginTop: space.md }}><Note text="התמונה נשמרת רק במכשיר שלך." /></View>
    </LightScreen>
  );
}

function Big({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Tap onPress={onPress} label={label} style={{ flex: 1 }}>
      <View style={[styles.big, primary && { backgroundColor: light.accentText, borderColor: light.accentText }]}>
        <Icon name={icon} size={22} color={primary ? '#fff' : light.accentText} />
        <Text style={[styles.bigText, primary && { color: '#fff' }]}>{label}</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  frame: { height: 260, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: light.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(242,107,29,0.35)', alignItems: 'center', justifyContent: 'center' },
  big: { minHeight: 58, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(194,65,12,0.35)', backgroundColor: light.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8 },
  bigText: { fontFamily: fonts.bold, fontSize: 16, color: light.accentText, textAlign: 'center' },
});
