export type Nutrients = {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber?: number | null;
};

export type FoodCategory =
  | 'dairy' | 'protein' | 'meat' | 'eggs' | 'carbs' | 'bread' | 'produce' | 'fats' | 'meals' | 'drinks' | 'snacks' | 'custom';

export type Portion = { label: string; grams: number };

export type Food = {
  id: string;
  name: string;
  nameEn?: string;
  aliases?: string[];
  brand?: string;
  category: FoodCategory;
  /** values are per 100 of this unit */
  basis: 'g' | 'ml';
  per100: Nutrients | null; // null = no verified values yet
  portions: Portion[];
  allergens?: string[];
  source: string;
  verified: boolean;
  barcode?: string;
  imageUrl?: string;
  state?: 'raw' | 'cooked' | 'prepared';
  isPrivate?: boolean;
  /** total package size in the food's basis unit (g/ml), when known */
  packageSize?: number;
  servingLabel?: string;
};

export type MealKey = string; // 'breakfast' | 'lunch' | 'dinner' | 'snack' | custom id

export type FoodEntry = {
  id: string;
  date: string; // YYYY-MM-DD in user local time
  meal: MealKey;
  foodId?: string;
  name: string;
  amount: number;
  unitLabel: string;
  grams: number | null; // null when entered without amount
  nutrients: Nutrients; // snapshot at time of logging
  time: string; // HH:MM
  photoUri?: string;
  note?: string;
  /** breakdown when several products were logged as one meal */
  items?: { foodId?: string; name: string; amount: number; unitLabel: string; grams: number | null; nutrients: Nutrients }[];
  createdAt: number;
};

export type BasketItem = { key: string; foodId?: string; name: string; brand?: string; amount: number; unitLabel: string; unitGrams: number | null; grams: number | null; nutrients: Nutrients; imageUrl?: string };
export type SavedMeal = { id: string; name: string; items: Omit<FoodEntry, 'id' | 'date' | 'meal' | 'time' | 'createdAt'>[] };

export type Recipe = {
  id: string;
  name: string;
  minutes: number;
  servings: number;
  tags: string[];
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: { foodId: string; grams: number; note?: string }[];
  steps: string[];
  allergens: string[];
};

export type Muscle =
  | 'chest' | 'shoulders' | 'triceps' | 'biceps' | 'back' | 'lats' | 'abs' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'forearms' | 'traps' | 'core' | 'cardio';

export type Exercise = {
  id: string;
  name: string;
  nameEn: string;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'band' | 'kettlebell' | 'none';
  difficulty: 1 | 2 | 3;
  kind: 'strength' | 'cardio' | 'mobility';
  instructions: string[];
  mistakes: string[];
  alternatives: string[]; // exercise ids
};

export type PlanExercise = { exerciseId: string; sets: number; repsMin: number; repsMax: number; weight?: number; restSec: number; seconds?: number };

export type WorkoutPlan = {
  id: string;
  name: string;
  nameEn: string;
  focus: string;
  location: 'gym' | 'home' | 'any';
  level: 'beginner' | 'intermediate' | 'advanced';
  premium?: boolean;
  exercises: PlanExercise[];
  custom?: boolean;
};

export type SetLog = { reps: number; weight: number | null; done: boolean; seconds?: number };
export type SessionExercise = { exerciseId: string; target: PlanExercise; sets: SetLog[]; skipped?: boolean };

export type WorkoutSession = {
  id: string;
  planId: string;
  name: string;
  date: string;
  startedAt: number;
  endedAt?: number;
  pausedAt?: number;
  pausedMs: number;
  status: 'active' | 'paused' | 'done';
  current: number;
  exercises: SessionExercise[];
  notes?: string;
  restUntil?: number;
};

export type ReminderType = 'alarm' | 'workout' | 'meal' | 'water' | 'sleep' | 'recovery';
export type Reminder = {
  id: string;
  type: ReminderType;
  title: string;
  time: string; // HH:MM
  days: number[]; // 0=Sunday..6
  enabled: boolean;
  sound: string;
  notificationIds?: string[];
};

export type Challenge = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  partner?: string; // e.g. "אלירן" – invite-only, consent based
  partnerStatus?: 'none' | 'invited' | 'accepted';
  tasks: { id: string; title: string }[];
  log: Record<string, string[]>; // date -> completed task ids
  restDays: string[];
  notes: Record<string, string>;
  finished?: boolean;
};

export type Profile = {
  name: string;
  age: number | null;
  language: 'he' | 'en';
  goals: string[];
  experience: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  workoutsPerWeek: number;
  trainingDays: number[];
  trainingTime: string;
  foodPrefs: string[];
  allergies: string[];
  limitations: string;
  heightCm: number | null;
  weightKg: number | null;
  sex: 'male' | 'female' | null;
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very';
  planDays: 30 | 60 | 90;
  targetMode: 'calculated' | 'professional' | 'none';
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;
  waterTargetMl: number;
  targetsSince?: string;
};

export type TargetHistory = { from: string; calorieTarget: number | null; proteinTarget: number | null; carbsTarget: number | null; fatTarget: number | null }[];
