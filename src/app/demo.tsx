import React from 'react';
import { useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Screen, T } from '@/components/ui';
import { DemoPlayer } from '@/components/DemoPlayer';
import { space } from '@/theme/tokens';

/** 52 Demo player (9:16). Storyboard until the final edited trailer file is added to assets/media. */
export default function Demo() {
  const { height } = useWindowDimensions();
  return (
    <Screen title="סרטון הדגמה">
      <DemoPlayer height={Math.min(640, height * 0.72)} onSkip={() => router.back()} />
      <T.Caption style={{ marginTop: space.md, textAlign: 'center' }}>רצף: בית ומספר נקודות → מוצרים → תכנון שבועי → אימון פעיל → גרפים → Premium. הסרטון הערוך הסופי ייווצר בנפרד.</T.Caption>
    </Screen>
  );
}
