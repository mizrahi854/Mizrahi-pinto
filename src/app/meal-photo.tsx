import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Screen, Button, T, Card, Badge, Row } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { colors, radius, space } from '@/theme/tokens';

/** 23 Photo / upload a meal. AI recognition is a Premium feature that is not connected yet. */
export default function MealPhoto() {
  const [uri, setUri] = useState<string | null>(null);
  const pick = async (camera: boolean) => {
    if (camera) {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) return;
    }
    const r = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]) setUri(r.assets[0].uri);
  };
  return (
    <Screen title="צילום ארוחה">
      <View style={{ height: 300, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
        {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel="תמונת הארוחה" /> : <Icon name="camera" size={56} />}
      </View>
      <Row style={{ marginTop: space.md }}>
        {Platform.OS !== 'web' && <Button title="צילום" icon="camera" style={{ flex: 1 }} onPress={() => pick(true)} />}
        <Button title="מהגלריה" icon="image" variant={Platform.OS === 'web' ? 'primary' : 'ghost'} style={{ flex: 1 }} onPress={() => pick(false)} />
      </Row>
      {uri && (
        <Card style={{ marginTop: space.lg, gap: 8 }}>
          <Row><Badge text="זיהוי AI – Premium, בקרוב" /></Row>
          <T.Muted>זיהוי אוטומטי עדיין לא מחובר, ולכן לא תוצג הערכה. אפשר לבחור את המרכיבים בעצמך – התמונה תצורף לרישום.</T.Muted>
          <Button title="בחירת מרכיבים ואישור" onPress={() => router.push({ pathname: '/meal-confirm', params: { photo: uri } })} />
        </Card>
      )}
    </Screen>
  );
}
