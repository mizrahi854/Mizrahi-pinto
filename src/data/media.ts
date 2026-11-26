type ImageSourcePropType = number;

/**
 * Freely-licensed media (see assets/credits.json + Help → קרדיט תמונות).
 * Muscle-group line art: Everkinetic via Wikimedia Commons (CC BY-SA 3.0).
 * Food photos: Wikimedia Commons (CC0 / Public domain / CC BY / CC BY-SA).
 * No branded packshots are used: GO / PRO / protein-drink products show a category icon instead.
 */
/** Muscle group → representative line drawing (light lines, for dark cards). */
export const MUSCLE_ART: Partial<Record<import('./types').MuscleGroup, ImageSourcePropType>> = {
  chest: require('../../assets/exercises/bench-press-light.png'),
  back: require('../../assets/exercises/reverse-grip-bent-over-rows-light.png'),
  shoulders: require('../../assets/exercises/dumbbell-shoulder-press-light.png'),
  legs: require('../../assets/exercises/squats-light.png'),
  biceps: require('../../assets/exercises/biceps-curl-light.png'),
  triceps: require('../../assets/exercises/cable-crossover-light.png'),
  glutes: require('../../assets/exercises/romanian-deadlift-light.png'),
  full: require('../../assets/exercises/squats-light.png'),
  cardio: require('../../assets/exercises/walking-lunges-light.png'),
};

/** Food id → photo (starter list ids from foods.ts). */
export const FOOD_PHOTO: Record<string, ImageSourcePropType> = {
  f001: require('../../assets/photos/cottage.jpg'),
  f002: require('../../assets/photos/cottage.jpg'),
  f003: require('../../assets/photos/cottage.jpg'),
  f049: require('../../assets/photos/rice.jpg'),
  f050: require('../../assets/photos/rice.jpg'),
  f051: require('../../assets/photos/rice.jpg'),
  f032: require('../../assets/photos/tuna.jpg'),
  f033: require('../../assets/photos/tuna.jpg'),
  f034: require('../../assets/photos/salmon.jpg'),
  f085: require('../../assets/photos/avocado.jpg'),
  f012: require('../../assets/photos/yogurt_berries.jpg'),
  f022: require('../../assets/photos/protein_shake.jpg'),
};

export const MEAL_PHOTO: Record<string, ImageSourcePropType> = {
  breakfast: require('../../assets/photos/yogurt_berries.jpg'),
  lunch: require('../../assets/photos/rice.jpg'),
  dinner: require('../../assets/photos/salmon.jpg'),
  snack: require('../../assets/photos/avocado.jpg'),
};
