import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AddSheet } from '@/components/AddSheet';

/** "+ הוסף ארוחה" – logs to the chosen meal & date (from the diary or a meal card). */
export default function AddMeal() {
  const p = useLocalSearchParams<{ meal?: string; date?: string }>();
  return <AddSheet pMeal={p.meal} pDate={p.date} />;
}
