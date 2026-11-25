import type { Exercise, Muscle, WorkoutPlan } from './types';

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: 'חזה', shoulders: 'כתפיים', triceps: 'יד אחורית', biceps: 'יד קדמית', back: 'גב', lats: 'גב רחב',
  abs: 'בטן', quads: 'ארבע ראשי', hamstrings: 'מיתר הברך', glutes: 'ישבן', calves: 'שוקיים', forearms: 'אמות',
  traps: 'טרפזים', core: 'ליבה', cardio: 'סיבולת לב-ריאה',
};

export const EQUIPMENT_LABELS: Record<Exercise['equipment'], string> = {
  barbell: 'מוט', dumbbell: 'משקולות יד', machine: 'מכונה', cable: 'כבלים', bodyweight: 'משקל גוף', band: 'גומייה', kettlebell: 'קטלבל', none: 'ללא ציוד',
};

const ex = (
  id: string, name: string, nameEn: string, primary: Muscle[], secondary: Muscle[], equipment: Exercise['equipment'],
  difficulty: 1 | 2 | 3, instructions: string[], mistakes: string[], alternatives: string[], kind: Exercise['kind'] = 'strength',
): Exercise => ({ id, name, nameEn, primary, secondary, equipment, difficulty, instructions, mistakes, alternatives, kind });

export const EXERCISES: Exercise[] = [
  ex('bench', 'לחיצת חזה', 'Bench Press', ['chest'], ['triceps', 'shoulders'], 'barbell', 2,
    ['שכב על הספסל, עיניים מתחת למוט, כפות רגליים יציבות ברצפה.', 'אחוז מעט רחב מרוחב הכתפיים, הצמד שכמות לאחור ולמטה.', 'הורד את המוט בשליטה לאמצע החזה.', 'דחוף למעלה בקו ישר תוך שמירה על שכמות צמודות.'],
    ['הקפצת המוט מהחזה', 'הרמת הישבן מהספסל', 'מרפקים פתוחים ב-90 מעלות'], ['db_bench', 'pushup', 'incline']),
  ex('incline', 'לחיצת חזה בשיפוע', 'Incline Bench Press', ['chest'], ['shoulders', 'triceps'], 'barbell', 2,
    ['כוון ספסל לשיפוע של 30–45 מעלות.', 'הורד את המוט לחלק העליון של החזה.', 'דחוף למעלה בשליטה.'],
    ['שיפוע גבוה מדי שהופך את התרגיל לכתפיים', 'קשת גב מוגזמת'], ['db_bench', 'bench']),
  ex('db_bench', 'לחיצת חזה במשקולות', 'Dumbbell Bench Press', ['chest'], ['triceps', 'shoulders'], 'dumbbell', 1,
    ['שכב עם משקולת בכל יד בגובה החזה.', 'דחוף למעלה עד יישור כמעט מלא.', 'הורד לאט עד מתיחה נוחה בחזה.'],
    ['הורדה מהירה מדי', 'התנגשות משקולות למעלה'], ['bench', 'pushup']),
  ex('pushup', 'שכיבות סמיכה', 'Push-up', ['chest'], ['triceps', 'shoulders', 'core'], 'bodyweight', 1,
    ['כפות ידיים מעט רחבות מהכתפיים, גוף בקו ישר.', 'הורד את החזה לכיוון הרצפה.', 'דחוף חזרה תוך שמירה על ליבה מכווצת.'],
    ['אגן שוקע', 'ראש נשמט קדימה'], ['db_bench', 'bench']),
  ex('cable_fly', 'פולי חזה', 'Cable Crossover', ['chest'], ['shoulders'], 'cable', 1,
    ['עמוד בין שני כבלים עליונים, צעד קדימה.', 'קרב את הידיים בקשת רחבה מול החזה.', 'חזור לאט עד מתיחה נוחה.'],
    ['כיפוף מרפקים מוגזם', 'משקל כבד מדי'], ['db_bench', 'bench']),
  ex('ohp', 'לחיצת כתפיים', 'Shoulder Press', ['shoulders'], ['triceps'], 'dumbbell', 2,
    ['שב זקוף, משקולות בגובה הכתפיים.', 'דחוף מעל הראש עד יישור כמעט מלא.', 'הורד בשליטה לגובה האוזניים.'],
    ['קשת גב תחתון', 'נעילת מרפקים בכוח'], ['lateral', 'pushup']),
  ex('lateral', 'הרחקת כתפיים לצדדים', 'Lateral Raise', ['shoulders'], ['traps'], 'dumbbell', 1,
    ['עמוד עם משקולות קלות לצד הגוף.', 'הרם לצדדים עד גובה הכתפיים, מרפקים מעט כפופים.', 'הורד לאט.'],
    ['תנופה מהגב', 'הרמת כתפיים לאוזניים'], ['ohp']),
  ex('pushdown', 'פשיטת יד אחורית בכבל', 'Triceps Pushdown', ['triceps'], [], 'cable', 1,
    ['עמוד מול הכבל, מרפקים צמודים לגוף.', 'פשוט את המרפקים עד יישור.', 'חזור לאט עד 90 מעלות.'],
    ['תזוזת מרפקים קדימה', 'הטיית גוף מעל הידית'], ['dips']),
  ex('dips', 'מקבילים', 'Dips', ['triceps', 'chest'], ['shoulders'], 'bodyweight', 3,
    ['אחוז במקבילים בידיים ישרות.', 'רד בשליטה עד זווית נוחה במרפקים.', 'דחוף חזרה למעלה.'],
    ['ירידה עמוקה מדי עם כאב בכתף'], ['pushdown', 'pushup']),
  ex('pullup', 'מתח', 'Pull-up', ['lats'], ['biceps', 'back'], 'bodyweight', 3,
    ['אחוז במוט מעט רחב מהכתפיים.', 'משוך את החזה לכיוון המוט תוך הורדת שכמות.', 'רד בשליטה עד יישור.'],
    ['תנופות', 'חצי טווח תנועה'], ['latpull', 'row']),
  ex('latpull', 'פולי עליון', 'Lat Pulldown', ['lats'], ['biceps'], 'machine', 1,
    ['שב עם ברכיים מקובעות, אחוז במוט רחב.', 'משוך לחזה העליון.', 'החזר לאט למעלה.'],
    ['משיכה מאחורי הראש', 'הטיה מוגזמת לאחור'], ['pullup', 'row']),
  ex('row', 'חתירה במוט', 'Barbell Row', ['back'], ['lats', 'biceps'], 'barbell', 2,
    ['התכופף מהירכיים עם גב ניטרלי.', 'משוך את המוט לבטן התחתונה.', 'הורד בשליטה.'],
    ['גב מעוגל', 'משיכה בתנופה'], ['db_row', 'latpull']),
  ex('db_row', 'חתירה במשקולת', 'Dumbbell Row', ['back'], ['lats', 'biceps'], 'dumbbell', 1,
    ['השען יד וברך על ספסל.', 'משוך משקולת לכיוון המותן.', 'הורד עד מתיחה מלאה.'],
    ['סיבוב גו', 'משיכה עם הזרוע במקום הגב'], ['row']),
  ex('curl', 'כפיפת מרפקים', 'Biceps Curl', ['biceps'], ['forearms'], 'dumbbell', 1,
    ['עמוד זקוף, משקולות לצד הגוף.', 'כופף מרפקים והרם לכתפיים.', 'הורד לאט.'],
    ['נדנוד הגוף', 'מרפקים זזים קדימה'], ['hammer']),
  ex('hammer', 'כפיפת פטישים', 'Hammer Curl', ['biceps', 'forearms'], [], 'dumbbell', 1,
    ['אחיזה ניטרלית, כפות ידיים פונות זו לזו.', 'כופף והרם בשליטה.', 'הורד לאט.'], ['תנופה'], ['curl']),
  ex('facepull', 'משיכת פנים', 'Face Pull', ['shoulders', 'traps'], ['back'], 'cable', 1,
    ['כוון כבל לגובה הפנים עם חבל.', 'משוך לכיוון הפנים תוך פתיחת מרפקים.', 'החזר לאט.'], ['משקל כבד מדי'], ['lateral']),
  ex('squat', 'סקוואט', 'Back Squat', ['quads', 'glutes'], ['hamstrings', 'core'], 'barbell', 3,
    ['מוט על הגב העליון, רגליים ברוחב כתפיים.', 'רד כאילו מתיישב, ברכיים בכיוון האצבעות.', 'עלה דרך כל כף הרגל.'],
    ['ברכיים קורסות פנימה', 'עקבים מתרוממים', 'גב מעוגל'], ['goblet', 'legpress']),
  ex('goblet', 'סקוואט גביע', 'Goblet Squat', ['quads', 'glutes'], ['core'], 'dumbbell', 1,
    ['החזק משקולת צמודה לחזה.', 'רד לסקוואט עם חזה זקוף.', 'עלה בשליטה.'], ['חזה נופל קדימה'], ['squat', 'bw_squat']),
  ex('bw_squat', 'סקוואט משקל גוף', 'Bodyweight Squat', ['quads', 'glutes'], [], 'bodyweight', 1,
    ['רגליים ברוחב כתפיים, ידיים קדימה.', 'רד לעומק נוח.', 'עלה ולחץ ישבן למעלה.'], ['ירידה חלקית מדי'], ['goblet']),
  ex('legpress', 'לחיצת רגליים', 'Leg Press', ['quads', 'glutes'], ['hamstrings'], 'machine', 1,
    ['שב עם גב צמוד למושב, רגליים על המשטח.', 'הורד עד 90 מעלות בברך.', 'דחוף בלי לנעול ברכיים.'], ['נעילת ברכיים', 'הרמת אגן'], ['squat']),
  ex('rdl', 'דדליפט רומני', 'Romanian Deadlift', ['hamstrings', 'glutes'], ['back'], 'barbell', 2,
    ['עמוד עם מוט, ברכיים מעט כפופות.', 'דחוף אגן לאחור והורד את המוט לאורך הרגליים.', 'חזור למעלה בכיווץ ישבן.'],
    ['גב מעוגל', 'כפיפת ברכיים מוגזמת'], ['deadlift', 'bridge']),
  ex('deadlift', 'דדליפט', 'Deadlift', ['back', 'glutes', 'hamstrings'], ['quads', 'traps'], 'barbell', 3,
    ['מוט מעל אמצע כף הרגל.', 'אחוז, יישר גב, מתח את הגוף.', 'הרם על ידי דחיפת הרצפה עד עמידה.'], ['משיכה עם גב מעוגל'], ['rdl']),
  ex('lunge', 'מכרעים', 'Walking Lunge', ['quads', 'glutes'], ['hamstrings'], 'dumbbell', 2,
    ['צעד קדימה והורד ברך אחורית לכיוון הרצפה.', 'דחוף וצעד עם הרגל השנייה.'], ['ברך קדמית קורסת פנימה'], ['bw_squat']),
  ex('bridge', 'גשר ישבן', 'Glute Bridge', ['glutes'], ['hamstrings'], 'bodyweight', 1,
    ['שכב על הגב, ברכיים כפופות.', 'הרם אגן עד קו ישר.', 'החזק שנייה והורד.'], ['קשת גב תחתון'], ['rdl']),
  ex('calf', 'הרמות עקבים', 'Calf Raise', ['calves'], [], 'bodyweight', 1,
    ['עמוד על קצה מדרגה.', 'עלה על קצות האצבעות.', 'רד לאט למתיחה.'], ['קפיצות'], []),
  ex('plank', 'פלאנק', 'Plank', ['core', 'abs'], ['shoulders'], 'bodyweight', 1,
    ['השען על אמות, גוף בקו ישר.', 'כווץ בטן וישבן.', 'נשום באופן קבוע.'], ['אגן גבוה מדי או שוקע'], ['deadbug']),
  ex('deadbug', 'דד באג', 'Dead Bug', ['core', 'abs'], [], 'bodyweight', 1,
    ['שכב על הגב, ידיים ורגליים למעלה.', 'הורד יד ורגל נגדיות בשליטה.', 'החלף צד.'], ['גב תחתון מתרומם'], ['plank']),
  ex('run', 'ריצה קלה', 'Easy Run', ['cardio'], ['calves', 'quads'], 'none', 1,
    ['קצב שמאפשר לדבר.', 'נחיתה רכה וצעדים קצרים.'], ['פתיחה מהירה מדי'], ['jumprope', 'bike'], 'cardio'),
  ex('bike', 'אופני כושר', 'Stationary Bike', ['cardio'], ['quads'], 'machine', 1,
    ['כוון גובה מושב.', 'שמור על קצב קבוע.'], ['מושב נמוך מדי'], ['run'], 'cardio'),
  ex('jumprope', 'דילוגי חבל', 'Jump Rope', ['cardio'], ['calves'], 'none', 2,
    ['קפיצות נמוכות על קצות האצבעות.', 'סובב מפרקי ידיים, לא כתפיים.'], ['קפיצות גבוהות מדי'], ['run'], 'cardio'),
  ex('hipflexor', 'מתיחת כופפי ירך', 'Hip Flexor Stretch', ['quads'], ['core'], 'none', 1,
    ['כרע על ברך אחת.', 'דחוף אגן קדימה בעדינות.', 'החזק 30 שניות לכל צד.'], ['קשת גב'], ['catcow'], 'mobility'),
  ex('catcow', 'חתול-פרה', 'Cat-Cow', ['back', 'core'], [], 'none', 1,
    ['עמידת שש.', 'עגל גב בנשיפה, קשת בשאיפה.', 'תנועה איטית ונשימה.'], ['תנועה מהירה'], ['hipflexor'], 'mobility'),
];

export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id);

const pe = (exerciseId: string, sets: number, repsMin: number, repsMax: number, restSec = 90, weight?: number, seconds?: number) => ({ exerciseId, sets, repsMin, repsMax, restSec, weight, seconds });

export const PLANS: WorkoutPlan[] = [
  { id: 'push', name: 'Push Day', nameEn: 'Push Day', focus: 'חזה • כתפיים • יד אחורית', location: 'gym', level: 'intermediate',
    exercises: [pe('bench', 4, 8, 10, 120), pe('incline', 3, 8, 12), pe('ohp', 3, 8, 12), pe('lateral', 3, 12, 15, 60), pe('pushdown', 3, 10, 12, 60)] },
  { id: 'pull', name: 'Pull Day', nameEn: 'Pull Day', focus: 'גב • יד קדמית', location: 'gym', level: 'intermediate',
    exercises: [pe('pullup', 4, 6, 10, 120), pe('row', 3, 8, 10), pe('latpull', 3, 10, 12), pe('facepull', 3, 12, 15, 60), pe('curl', 3, 10, 12, 60)] },
  { id: 'legs', name: 'Leg Day', nameEn: 'Leg Day', focus: 'רגליים • ישבן', location: 'gym', level: 'intermediate',
    exercises: [pe('squat', 4, 6, 8, 150), pe('rdl', 3, 8, 10, 120), pe('legpress', 3, 10, 12), pe('lunge', 3, 10, 12), pe('calf', 3, 12, 15, 60)] },
  { id: 'full', name: 'Full Body', nameEn: 'Full Body', focus: 'כל הגוף', location: 'gym', level: 'beginner',
    exercises: [pe('goblet', 3, 10, 12), pe('db_bench', 3, 10, 12), pe('db_row', 3, 10, 12), pe('ohp', 2, 10, 12), pe('plank', 3, 1, 1, 45, undefined, 40)] },
  { id: 'home', name: 'Home Workout', nameEn: 'Home Workout', focus: 'בית • ללא ציוד', location: 'home', level: 'beginner',
    exercises: [pe('bw_squat', 3, 12, 15, 60), pe('pushup', 3, 8, 12, 60), pe('bridge', 3, 12, 15, 45), pe('deadbug', 3, 8, 10, 45), pe('plank', 3, 1, 1, 45, undefined, 30)] },
  { id: 'cardio', name: 'Cardio', nameEn: 'Cardio', focus: 'אירובי', location: 'any', level: 'beginner',
    exercises: [pe('bike', 1, 1, 1, 60, undefined, 600), pe('jumprope', 5, 1, 1, 60, undefined, 60), pe('run', 1, 1, 1, 0, undefined, 900)] },
  { id: 'mobility', name: 'Mobility', nameEn: 'Mobility', focus: 'גמישות וניידות', location: 'any', level: 'beginner',
    exercises: [pe('catcow', 2, 8, 10, 20), pe('hipflexor', 2, 1, 1, 20, undefined, 30), pe('bridge', 2, 10, 12, 30)] },
  { id: 'beginner', name: 'Beginner Start', nameEn: 'Beginner Start', focus: 'מתחילים', location: 'any', level: 'beginner',
    exercises: [pe('bw_squat', 2, 10, 12, 60), pe('pushup', 2, 6, 10, 60), pe('bridge', 2, 10, 12, 45), pe('plank', 2, 1, 1, 45, undefined, 20)] },
  { id: 'ppl_adv', name: 'PPL מתקדם', nameEn: 'Advanced PPL', focus: 'תוכנית 6 ימים', location: 'gym', level: 'advanced', premium: true,
    exercises: [pe('bench', 5, 5, 5, 180), pe('deadlift', 3, 5, 5, 180), pe('squat', 5, 5, 5, 180)] },
];

export const planById = (id: string, custom: WorkoutPlan[] = []) => [...PLANS, ...custom].find((p) => p.id === id);

export const estimateMinutes = (plan: WorkoutPlan) =>
  Math.round(
    plan.exercises.reduce((m, e) => m + e.sets * ((e.seconds ?? 45) + e.restSec), 0) / 60,
  );
