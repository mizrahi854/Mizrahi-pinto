type ImageSourcePropType = number;

/**
 * Freely-licensed media (see assets/credits.json + Help → קרדיט תמונות).
 * Exercise line art: Everkinetic via Wikimedia Commons (CC BY-SA 3.0).
 * Food photos: Wikimedia Commons (CC0 / Public domain / CC BY / CC BY-SA).
 * No branded packshots are used: GO / PRO / protein-drink products show a category icon instead.
 */
export const EXERCISE_ART: Record<string, ImageSourcePropType> = {
  bench: require('../../assets/exercises/bench-press.png'),
  incline: require('../../assets/exercises/incline-bench-press.png'),
  db_bench: require('../../assets/exercises/dumbbell-bench-press.png'),
  ohp: require('../../assets/exercises/dumbbell-shoulder-press.png'),
  curl: require('../../assets/exercises/biceps-curl.png'),
  hammer: require('../../assets/exercises/biceps-curl.png'),
  squat: require('../../assets/exercises/squats.png'),
  goblet: require('../../assets/exercises/squats.png'),
  bw_squat: require('../../assets/exercises/squats.png'),
  rdl: require('../../assets/exercises/romanian-deadlift.png'),
  deadlift: require('../../assets/exercises/romanian-deadlift.png'),
  lunge: require('../../assets/exercises/walking-lunges.png'),
  calf: require('../../assets/exercises/calf-raises.png'),
  row: require('../../assets/exercises/reverse-grip-bent-over-rows.png'),
  cable_fly: require('../../assets/exercises/cable-crossover.png'),
};

/** Same drawings as light lines on transparency, for dark cards. */
export const EXERCISE_ART_ON_DARK: Record<string, ImageSourcePropType> = {
  bench: require('../../assets/exercises/bench-press-light.png'),
  ohp: require('../../assets/exercises/dumbbell-shoulder-press-light.png'),
  squat: require('../../assets/exercises/squats-light.png'),
  rdl: require('../../assets/exercises/romanian-deadlift-light.png'),
  row: require('../../assets/exercises/reverse-grip-bent-over-rows-light.png'),
  db_bench: require('../../assets/exercises/dumbbell-bench-press-light.png'),
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
