import React, { useRef, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Screen, Button, Field, T, Card, toast, Empty } from '@/components/ui';
import { lookupBarcode } from '@/lib/openFoodFacts';
import { useApp, allFoods } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 20 Barcode scan (camera) + manual barcode entry */
export default function Barcode() {
  const [perm, requestPerm] = useCameraPermissions();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const handled = useRef(false);
  const upsertFood = useApp((s) => s.upsertFood);
  const userFoods = useApp((s) => s.foods);

  const resolve = async (raw: string) => {
    const c = raw.replace(/\D/g, '');
    if (c.length < 6) return toast('ברקוד לא תקין');
    setBusy(true);
    setNotFound(null);
    try {
      const local = allFoods(userFoods).find((f) => f.barcode === c);
      const food = local ?? (await lookupBarcode(c));
      if (!food) {
        setNotFound(c);
        haptic.warn();
      } else {
        haptic.success();
        upsertFood(food);
        router.replace(`/food/${food.id}`);
      }
    } catch (e) {
      toast(e instanceof Error && e.message === 'ברקוד לא תקין' ? e.message : 'אין חיבור למאגר. אפשר להזין את התווית ידנית.');
    } finally {
      setBusy(false);
      setTimeout(() => (handled.current = false), 1500);
    }
  };

  const canCamera = Platform.OS !== 'web';

  return (
    <Screen title="סריקת ברקוד">
      {canCamera && perm?.granted ? (
        <View style={styles.cam}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={busy || notFound ? undefined : ({ data }) => { if (handled.current) return; handled.current = true; resolve(data); }}
          />
          <View style={styles.frame} pointerEvents="none" />
          {busy && <View style={styles.busy}><ActivityIndicator color={colors.accent} size="large" /></View>}
        </View>
      ) : canCamera ? (
        <Card style={{ gap: 10, alignItems: 'center' }}>
          <T.H>נדרשת הרשאת מצלמה</T.H>
          <T.Muted style={{ textAlign: 'center' }}>המצלמה משמשת רק לסריקת ברקוד. אפשר גם להקליד את המספר.</T.Muted>
          {perm?.canAskAgain !== false ? <Button title="אישור מצלמה" onPress={requestPerm} /> : <T.Muted>ההרשאה נדחתה. ניתן לאשר בהגדרות האייפון.</T.Muted>}
        </Card>
      ) : (
        <Card><T.Muted>סריקה במצלמה זמינה באפליקציה באייפון. כאן אפשר להקליד ברקוד.</T.Muted></Card>
      )}

      <View style={{ marginTop: space.xl }}>
        <Field label="הקלדת ברקוד" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="7290000000000" onSubmitEditing={() => resolve(code)} />
        <Button title="חיפוש" icon="search" onPress={() => resolve(code)} loading={busy} />
      </View>

      {notFound && (
        <Empty icon="barcode" title="המוצר לא נמצא במאגר" text={`ברקוד ${notFound}. אפשר להוסיף אותו ידנית מהתווית – הוא יישמר כמוצר פרטי.`} action="הזנת תווית ידנית" onAction={() => router.replace({ pathname: '/food-new', params: { barcode: notFound } })} />
      )}
      <T.Caption style={{ textAlign: 'center', marginTop: space.lg }}>החיפוש מתבצע ב-Open Food Facts. ערכים מהמאגר מסומנים כלא מאומתים.</T.Caption>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cam: { height: 360, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: colors.border },
  frame: { position: 'absolute', top: '30%', left: '12%', right: '12%', height: '36%', borderWidth: 2, borderColor: colors.accent, borderRadius: 18 },
  busy: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' } as any,
});
