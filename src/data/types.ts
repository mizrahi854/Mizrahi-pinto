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

/** Simple weekly training (the user already knows how to train – no sets/reps/timers). */
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'legs' | 'biceps' | 'triceps' | 'abs' | 'cardio' | 'full' | 'glutes' | 'mobility';
export type WorkoutStatus = 'planned' | 'done' | 'skipped';
export type PlannedWorkout = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  name: string;
  muscles: MuscleGroup[];
  rest?: boolean; // a planned rest day
  durationMin?: number | null;
  notes?: string;
  status: WorkoutStatus;
  doneAt?: number;
  reminder?: boolean;
  fromTemplate?: boolean;
};
/** Recurring weekly template (weekday 0=Sunday) used to fill future weeks automatically. */
export type WorkoutTemplate = { day: number; name: string; muscles: MuscleGroup[]; time: string | null; durationMin?: number | null; rest?: boolean };

export type RestaurantType = 'burgers' | 'pizza' | 'italian' | 'asian' | 'sushi' | 'grill' | 'shawarma' | 'cafe' | 'fastfood' | 'dairy';
export type Restaurant = { id: string; name: string; type: RestaurantType; favorite: boolean };
export type RestaurantDish = {
  id: string;
  name: string;
  type: RestaurantType;
  restaurantId?: string;
  nutrients: Nutrients;
  /** true unless the values come from the restaurant's official published info */
  estimated: boolean;
  basis?: string; // where the estimate came from
  ingredients?: string;
  allergens?: string[] | null; // null = unknown (never invented)
  photoUri?: string;
  favorite: boolean;
  createdAt: number;
};

export type PlanEventType = 'family' | 'restaurant' | 'special';
export type PlanEvent = {
  id: string;
  date: string;
  time?: string | null;
  type: PlanEventType;
  title: string;
  note?: string;
  meal?: MealKey;
  restaurantType?: RestaurantType;
  restaurantId?: string;
  dishIds?: string[];
  reminder?: boolean;
};

export type MealItem = { foodId?: string; name: string; amount: number; unitLabel: string; grams: number | null; nutrients: Nutrients };
/** A meal planned ahead (future or today). Becomes diary entries only when the user marks it eaten. */
export type PlannedMeal = { id: string; date: string; meal: MealKey; title: string; items: MealItem[]; note?: string; source?: 'manual' | 'saved' | 'shabbat' | 'restaurant'; eatenAt?: number };

export type ShabbatMealKey = 'fri_dinner' | 'sat_breakfast' | 'sat_lunch' | 'sat_third';
export type ShabbatPlan = {
  meals: { key: ShabbatMealKey; enabled: boolean; family: boolean; note?: string; dishes: MealItem[] }[];
  friWorkout: WorkoutTemplate | null;
  satWorkout: WorkoutTemplate | null;
  shopping: string[];
  autoRepeat: boolean; // add the plan to every week automatically
  muteDuringShabbat: boolean;
  remindAfterShabbat: boolean;
  appliedWeeks: string[]; // week-start keys already filled
};

export type ReminderType = 'alarm' | 'workout' | 'did_train' | 'daily' | 'plan_week' | 'shabbat_prep' | 'restaurant' | 'meal' | 'water' | 'sleep' | 'recovery';
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
  partner?: string; // e.g. "אליאן" – invite-only, consent based
  partnerStatus?: 'none' | 'invited' | 'accepted';
  tasks: { id: string; title: string; auto?: 'workout' | 'meals' }[];
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
  /** adults choose whether to count calories at all (minors never get calorie targets) */
  trackCalories?: boolean;
  /** optional flexible daily targets by weekday (e.g. a higher Shabbat target); weekly summary = their sum */
  dayTargets?: Partial<Record<number, number>>;
  muscleGroups?: MuscleGroup[];
  eatingHabits?: string[];
  wakeTime?: string;
  workStart?: string;
  workEnd?: string;
  weekendRoutine?: string[];
  shabbatMeals?: ShabbatMealKey[];
  restaurantFreq?: 'rare' | 'monthly' | 'weekly' | 'often';
  notifPrefs?: string[];
};

export type TargetHistory = { from: string; calorieTarget: number | null; proteinTarget: number | null; carbsTarget: number | null; fatTarget: number | null }[];
