import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MealBuilder } from '@/components/MealBuilder';

/** 24 Confirm photographed meal – user picks ingredients & amounts (no fake AI estimate) */
export default function MealConfirm() {
  const { photo } = useLocalSearchParams<{ photo?: string }>();
  return <MealBuilder title="אישור ארוחה" photo={photo} />;
}
