import type { Recipe } from './types';

/** Original recipes composed from the starter food list (ids from foods.ts). */
export const RECIPES: Recipe[] = [
  {
    id: 'r_oats', name: 'קערת שיבולת שועל, בננה וחמאת בוטנים', minutes: 7, servings: 1, meal: 'breakfast', tags: ['מהיר', 'צמחוני'],
    ingredients: [{ foodId: 'f057', grams: 50 }, { foodId: 'f023', grams: 200, note: 'חלב 3%' }, { foodId: 'f073', grams: 100 }, { foodId: 'f089', grams: 15 }],
    steps: ['מחממים את שיבולת השועל עם החלב 3–4 דקות תוך ערבוב.', 'פורסים בננה מעל.', 'מוסיפים כף חמאת בוטנים ומגישים.'],
    allergens: ['גלוטן', 'חלב', 'בוטנים'],
  },
  {
    id: 'r_shakshuka', name: 'שקשוקה ביתית', minutes: 20, servings: 2, meal: 'breakfast', tags: ['צמחוני', 'ללא גלוטן'],
    ingredients: [{ foodId: 'f082', grams: 480 }, { foodId: 'f037', grams: 200, note: '4 ביצים' }, { foodId: 'f088', grams: 13.5 }],
    steps: ['מחממים שמן זית במחבת ומוסיפים עגבניות קצוצות.', 'מבשלים 10 דקות עד שמתקבל רוטב סמיך ומתבלים.', 'יוצרים גומות, שוברים ביצים ומכסים עד שהחלבון מתקשה.'],
    allergens: ['ביצים'],
  },
  {
    id: 'r_bowl', name: 'קערת עוף, אורז וברוקולי', minutes: 25, servings: 1, meal: 'lunch', tags: ['עתיר חלבון', 'הכנה מראש'],
    ingredients: [{ foodId: 'f026', grams: 150 }, { foodId: 'f050', grams: 180 }, { foodId: 'f084', grams: 100 }, { foodId: 'f088', grams: 5 }],
    steps: ['צולים חזה עוף מתובל עד שהוא מוכן לגמרי.', 'מאדים ברוקולי 5 דקות.', 'מסדרים בקערה עם אורז ומזלפים מעט שמן זית.'],
    allergens: [],
  },
  {
    id: 'r_tuna', name: 'סלט טונה וחומוס גרגרים', minutes: 10, servings: 1, meal: 'lunch', tags: ['מהיר', 'ללא בישול'],
    ingredients: [{ foodId: 'f032', grams: 120 }, { foodId: 'f043', grams: 100 }, { foodId: 'f081', grams: 100 }, { foodId: 'f082', grams: 120 }, { foodId: 'f088', grams: 5 }],
    steps: ['קוצצים מלפפון ועגבנייה.', 'מערבבים עם טונה מסוננת וגרגרי חומוס.', 'מתבלים בלימון ושמן זית.'],
    allergens: ['דגים'],
  },
  {
    id: 'r_salmon', name: 'סלמון בתנור עם בטטה', minutes: 30, servings: 1, meal: 'dinner', tags: ['ללא גלוטן'],
    ingredients: [{ foodId: 'f034', grams: 150 }, { foodId: 'f059', grams: 200 }, { foodId: 'f084', grams: 100 }],
    steps: ['מחממים תנור ל-200 מעלות.', 'אופים בטטה פרוסה 15 דקות.', 'מוסיפים סלמון וברוקולי ואופים עוד 12–15 דקות.'],
    allergens: ['דגים'],
  },
  {
    id: 'r_yogurt', name: 'יוגורט יווני עם תותים ושקדים', minutes: 3, servings: 1, meal: 'snack', tags: ['מהיר', 'צמחוני'],
    ingredients: [{ foodId: 'f012', grams: 150 }, { foodId: 'f077', grams: 100 }, { foodId: 'f090', grams: 15 }],
    steps: ['שמים יוגורט בקערה.', 'מוסיפים תותים חתוכים ושקדים.'],
    allergens: ['חלב', 'אגוזים'],
  },
  {
    id: 'r_lentil', name: 'תבשיל עדשים ואורז מלא', minutes: 35, servings: 3, meal: 'dinner', tags: ['טבעוני', 'הכנה מראש'],
    ingredients: [{ foodId: 'f042', grams: 450 }, { foodId: 'f051', grams: 360 }, { foodId: 'f083', grams: 120 }, { foodId: 'f088', grams: 13.5 }],
    steps: ['מטגנים גזר קצוץ בשמן זית.', 'מוסיפים עדשים מבושלות ותבלינים ומבשלים 10 דקות.', 'מגישים עם אורז מלא.'],
    allergens: [],
  },
];

export const recipeById = (id: string) => RECIPES.find((r) => r.id === id);
