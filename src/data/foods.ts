import type { Food, FoodCategory, Nutrients, Portion } from './types';

/**
 * Starter list of 108 foods (PRD §7.11).
 *
 * IMPORTANT – data honesty:
 *  - Generic foods carry *reference* values per 100 g/ml taken from public generic
 *    references (USDA FoodData Central style generic entries). They are flagged
 *    `verified: false` and shown in the UI as "ערך ייחוס – לא מאומת מול יצרן".
 *  - Branded / highly variable items (protein shakes, GO/PRO yogurts, bars, prepared dishes …)
 *    have `per100: null`. The user completes them by barcode lookup (Open Food Facts)
 *    or by typing the label. We never invent values, barcodes or product photos.
 */
const REF = 'ערכי ייחוס כלליים (USDA FoodData Central, פריט גנרי) – טעון אימות מול תווית';
const NEEDS_LABEL = 'חסר מידע מאומת – יש לסרוק ברקוד או להזין מהתווית';

const n = (kcal: number, protein: number, carbs: number, fat: number, fiber?: number): Nutrients => ({ kcal, protein, carbs, fat, fiber: fiber ?? null });

type Row = [name: string, nameEn: string, per100: Nutrients | null, portions?: Portion[], extra?: Partial<Food>];

const U = (label: string, grams: number): Portion => ({ label, grams });
const CUP = U('כוס', 200);
const TBSP = U('כף', 15);

const groups: Record<Exclude<FoodCategory, 'custom' | 'drinks' | 'snacks'>, Row[]> = {
  dairy: [
    ['קוטג׳ 3%', 'Cottage cheese 3%', n(78, 11.5, 1.5, 3), [U('גביע (250 ג׳)', 250), TBSP], { allergens: ['חלב'] }],
    ['קוטג׳ 5%', 'Cottage cheese 5%', n(95, 11, 1.5, 5), [U('גביע (250 ג׳)', 250), TBSP], { allergens: ['חלב'] }],
    ['קוטג׳ 9%', 'Cottage cheese 9%', n(133, 10, 1.5, 9), [U('גביע (250 ג׳)', 250), TBSP], { allergens: ['חלב'] }],
    ['גבינה לבנה 3%', 'Quark 3%', n(75, 9.5, 3.5, 3), [U('גביע (250 ג׳)', 250), TBSP], { allergens: ['חלב'] }],
    ['גבינה לבנה 5%', 'Quark 5%', n(92, 9, 3.5, 5), [U('גביע (250 ג׳)', 250), TBSP], { allergens: ['חלב'] }],
    ['גבינה לבנה 9%', 'Quark 9%', n(125, 8.5, 3.5, 9), [U('גביע (250 ג׳)', 250), TBSP], { allergens: ['חלב'] }],
    ['גבינה צהובה', 'Yellow cheese', n(350, 25, 1, 28), [U('פרוסה', 20)], { allergens: ['חלב'] }],
    ['גבינה בולגרית', 'Bulgarian cheese', n(270, 17, 1, 22), [U('קובייה', 30)], { allergens: ['חלב'] }],
    ['מוצרלה', 'Mozzarella', n(300, 22.2, 2.2, 22.4), [U('כדור קטן', 30)], { allergens: ['חלב'] }],
    ['ריקוטה', 'Ricotta', n(174, 11.3, 3, 13), [TBSP], { allergens: ['חלב'] }],
    ['יוגורט טבעי', 'Plain yogurt', n(61, 3.5, 4.7, 3.3), [U('גביע (200 ג׳)', 200)], { allergens: ['חלב'] }],
    ['יוגורט יווני', 'Greek yogurt', n(73, 9.95, 3.9, 1.9), [U('גביע (150 ג׳)', 150)], { allergens: ['חלב'] }],
  ],
  protein: [
    ['שייק חלבון וניל', 'Protein shake vanilla', null, [U('בקבוק', 330)], { basis: 'ml', allergens: ['חלב'] }],
    ['שייק חלבון שוקולד', 'Protein shake chocolate', null, [U('בקבוק', 330)], { basis: 'ml', allergens: ['חלב'] }],
    ['שייק חלבון תות', 'Protein shake strawberry', null, [U('בקבוק', 330)], { basis: 'ml', allergens: ['חלב'] }],
    ['קפה חלבון', 'Protein coffee', null, [U('בקבוק', 250)], { basis: 'ml', allergens: ['חלב'] }],
    ['אייס קפה חלבון', 'Iced protein coffee', null, [U('בקבוק', 250)], { basis: 'ml', allergens: ['חלב'] }],
    ['יוגורט GO', 'GO yogurt', null, [U('גביע', 200)], { allergens: ['חלב'] }],
    ['יוגורט PRO', 'PRO yogurt', null, [U('גביע', 200)], { allergens: ['חלב'] }],
    ['מעדן חלבון', 'Protein pudding', null, [U('גביע', 150)], { allergens: ['חלב'] }],
    ['חטיף חלבון', 'Protein bar', null, [U('חטיף', 60)] ],
    ['אבקת מי גבינה', 'Whey protein powder', null, [U('סקופ', 30)], { allergens: ['חלב'] }],
    ['חלב 3%', 'Milk 3%', n(60, 3.3, 4.7, 3), [CUP], { basis: 'ml', allergens: ['חלב'] }],
    ['משקה סויה (ללא סוכר)', 'Soy drink unsweetened', n(33, 2.9, 1.7, 1.6), [CUP], { basis: 'ml', allergens: ['סויה'] }],
  ],
  meat: [
    ['חזה עוף נא', 'Chicken breast raw', n(120, 22.5, 0, 2.6), [U('חזה בינוני', 170)], { state: 'raw' }],
    ['חזה עוף מבושל', 'Chicken breast cooked', n(165, 31, 0, 3.6), [U('מנה', 120)], { state: 'cooked' }],
    ['פרגית (נא, ללא עור)', 'Chicken thigh raw', n(121, 19.7, 0, 4.1), [U('יחידה', 110)], { state: 'raw' }],
    ['שוק עוף (צלוי, ללא עור)', 'Drumstick roasted', n(172, 28.3, 0, 5.7), [U('שוק', 75)], { state: 'cooked' }],
    ['הודו – חזה (נא)', 'Turkey breast raw', n(114, 23.7, 0.1, 1.5), [U('מנה', 120)], { state: 'raw' }],
    ['בשר בקר טחון 15% (נא)', 'Ground beef 15% raw', n(215, 18.6, 0, 15), [U('מנה', 120)], { state: 'raw' }],
    ['סטייק (צלוי)', 'Steak grilled', n(206, 29, 0, 9), [U('סטייק', 200)], { state: 'cooked' }],
    ['טונה במים (מסוננת)', 'Tuna in water drained', n(116, 25.5, 0, 0.8), [U('קופסה מסוננת', 120)], { allergens: ['דגים'] }],
    ['טונה בשמן (מסוננת)', 'Tuna in oil drained', n(198, 29, 0, 8.2), [U('קופסה מסוננת', 120)], { allergens: ['דגים'] }],
    ['סלמון (נא)', 'Salmon raw', n(208, 20.4, 0, 13.4), [U('נתח', 150)], { state: 'raw', allergens: ['דגים'] }],
    ['דג אמנון (נא)', 'Tilapia raw', n(96, 20.1, 0, 1.7), [U('פילה', 120)], { state: 'raw', allergens: ['דגים'] }],
    ['קציצות ביתיות', 'Homemade meatballs', null, [U('קציצה', 50)], { state: 'prepared' }],
  ],
  eggs: [
    ['ביצה קשה', 'Hard-boiled egg', n(155, 12.6, 1.1, 10.6), [U('ביצה (L)', 50)], { allergens: ['ביצים'], state: 'cooked' }],
    ['חביתה', 'Omelet', n(154, 10.6, 0.6, 11.7), [U('חביתה מ-2 ביצים', 120)], { allergens: ['ביצים'], state: 'prepared' }],
    ['ביצת עין', 'Fried egg', n(196, 13.6, 0.8, 14.8), [U('ביצה', 46)], { allergens: ['ביצים'], state: 'prepared' }],
    ['חלבון ביצה', 'Egg white', n(52, 10.9, 0.7, 0.2), [U('חלבון מביצה אחת', 33)], { allergens: ['ביצים'] }],
    ['חלמון', 'Egg yolk', n(322, 15.9, 3.6, 26.5), [U('חלמון', 17)], { allergens: ['ביצים'] }],
    ['עדשים (מבושלות)', 'Lentils cooked', n(116, 9, 20.1, 0.4, 7.9), [CUP], { state: 'cooked' }],
    ['חומוס גרגרים (מבושל)', 'Chickpeas cooked', n(164, 8.9, 27.4, 2.6, 7.6), [CUP], { state: 'cooked' }],
    ['שעועית לבנה (מבושלת)', 'White beans cooked', n(139, 9.7, 25.1, 0.4, 6.3), [CUP], { state: 'cooked' }],
    ['שעועית אדומה (מבושלת)', 'Kidney beans cooked', n(127, 8.7, 22.8, 0.5, 6.4), [CUP], { state: 'cooked' }],
    ['טופו קשה', 'Firm tofu', n(144, 17.3, 2.8, 8.7), [U('קובייה', 100)], { allergens: ['סויה'] }],
    ['אדממה', 'Edamame', n(121, 11.9, 8.9, 5.2, 5.2), [CUP], { allergens: ['סויה'] }],
    ['אפונה (מבושלת)', 'Green peas boiled', n(84, 5.4, 15.6, 0.2, 5.5), [CUP], { state: 'cooked' }],
  ],
  carbs: [
    ['אורז לבן (נא)', 'White rice raw', n(365, 7.1, 80, 0.7, 1.3), [U('כוס יבשה', 185)], { state: 'raw' }],
    ['אורז לבן (מבושל)', 'White rice cooked', n(130, 2.7, 28.2, 0.3, 0.4), [CUP], { state: 'cooked' }],
    ['אורז מלא (מבושל)', 'Brown rice cooked', n(123, 2.7, 25.6, 1, 1.6), [CUP], { state: 'cooked' }],
    ['פסטה יבשה', 'Dry pasta', n(371, 13, 74.7, 1.5, 3.2), [U('מנה יבשה', 80)], { state: 'raw', allergens: ['גלוטן'] }],
    ['פסטה (מבושלת)', 'Pasta cooked', n(158, 5.8, 30.9, 0.9, 1.8), [CUP], { state: 'cooked', allergens: ['גלוטן'] }],
    ['קוסקוס (מבושל)', 'Couscous cooked', n(112, 3.8, 23.2, 0.2, 1.4), [CUP], { state: 'cooked', allergens: ['גלוטן'] }],
    ['בורגול (מבושל)', 'Bulgur cooked', n(83, 3.1, 18.6, 0.2, 4.5), [CUP], { state: 'cooked', allergens: ['גלוטן'] }],
    ['קינואה (מבושלת)', 'Quinoa cooked', n(120, 4.4, 21.3, 1.9, 2.8), [CUP], { state: 'cooked' }],
    ['שיבולת שועל', 'Rolled oats', n(389, 16.9, 66.3, 6.9, 10.6), [U('חצי כוס', 40)], { allergens: ['גלוטן'] }],
    ['תפוח אדמה (מבושל)', 'Potato boiled', n(87, 1.9, 20.1, 0.1, 1.8), [U('בינוני', 170)], { state: 'cooked' }],
    ['בטטה (אפויה)', 'Sweet potato baked', n(90, 2, 20.7, 0.2, 3.3), [U('בינונית', 150)], { state: 'cooked' }],
    ['פתיתים', 'Ptitim', null, [CUP], { allergens: ['גלוטן'] }],
  ],
  bread: [
    ['לחם לבן', 'White bread', n(266, 7.6, 50.6, 3.3, 2.4), [U('פרוסה', 30)], { allergens: ['גלוטן'] }],
    ['לחם מלא', 'Whole wheat bread', n(252, 12.4, 42.7, 3.5, 6), [U('פרוסה', 30)], { allergens: ['גלוטן'] }],
    ['לחם כוסמין', 'Spelt bread', null, [U('פרוסה', 30)], { allergens: ['גלוטן'] }],
    ['פיתה', 'Pita', n(275, 9.1, 55.7, 1.2, 2.2), [U('פיתה', 90)], { allergens: ['גלוטן'] }],
    ['לחמנייה', 'Bread roll', null, [U('לחמנייה', 70)], { allergens: ['גלוטן'] }],
    ['טורטייה', 'Tortilla', null, [U('טורטייה', 45)], { allergens: ['גלוטן'] }],
    ['פריכיות אורז', 'Rice cakes', n(387, 8.2, 81.5, 2.8, 4.2), [U('פריכייה', 9)]],
    ['קרקרים', 'Crackers', null, [U('קרקר', 6)], { allergens: ['גלוטן'] }],
    ['קורנפלקס', 'Corn flakes', n(357, 7.5, 84.1, 0.4, 3.3), [U('כוס', 30)]],
    ['גרנולה', 'Granola', null, [U('חצי כוס', 50)], { allergens: ['גלוטן'] }],
    ['בייגלה', 'Pretzels', n(380, 10.3, 79.8, 2.6, 2.8), [U('חופן', 30)], { allergens: ['גלוטן'] }],
    ['מצה', 'Matzah', n(395, 10, 83.7, 1.4, 3), [U('מצה', 30)], { allergens: ['גלוטן'] }],
  ],
  produce: [
    ['בננה', 'Banana', n(89, 1.1, 22.8, 0.3, 2.6), [U('בננה בינונית', 118)]],
    ['תפוח', 'Apple', n(52, 0.3, 13.8, 0.2, 2.4), [U('תפוח בינוני', 182)]],
    ['תפוז', 'Orange', n(47, 0.9, 11.8, 0.1, 2.4), [U('תפוז', 130)]],
    ['אגס', 'Pear', n(57, 0.4, 15.2, 0.1, 3.1), [U('אגס', 178)]],
    ['תות', 'Strawberries', n(32, 0.7, 7.7, 0.3, 2), [CUP]],
    ['ענבים', 'Grapes', n(69, 0.7, 18.1, 0.2, 0.9), [CUP]],
    ['אבטיח', 'Watermelon', n(30, 0.6, 7.6, 0.2, 0.4), [U('פלח', 280)]],
    ['תמר מג׳הול', 'Medjool date', n(277, 1.8, 75, 0.2, 6.7), [U('תמר', 24)]],
    ['מלפפון', 'Cucumber', n(15, 0.7, 3.6, 0.1, 0.5), [U('מלפפון', 100)]],
    ['עגבנייה', 'Tomato', n(18, 0.9, 3.9, 0.2, 1.2), [U('עגבנייה', 120)]],
    ['גזר', 'Carrot', n(41, 0.9, 9.6, 0.2, 2.8), [U('גזר', 60)]],
    ['ברוקולי', 'Broccoli', n(34, 2.8, 6.6, 0.4, 2.6), [CUP]],
  ],
  fats: [
    ['אבוקדו', 'Avocado', n(160, 2, 8.5, 14.7, 6.7), [U('חצי אבוקדו', 75)]],
    ['טחינה גולמית', 'Raw tahini', n(595, 17, 21.2, 53.8, 9.3), [TBSP], { allergens: ['שומשום'] }],
    ['טחינה מוכנה', 'Prepared tahini', null, [TBSP], { allergens: ['שומשום'], state: 'prepared' }],
    ['שמן זית', 'Olive oil', n(884, 0, 0, 100), [U('כף', 13.5), U('כפית', 4.5)]],
    ['חמאת בוטנים', 'Peanut butter', n(588, 25, 20, 50, 6), [TBSP], { allergens: ['בוטנים'] }],
    ['שקדים', 'Almonds', n(579, 21.2, 21.6, 49.9, 12.5), [U('חופן', 28)], { allergens: ['אגוזים'] }],
    ['אגוזי מלך', 'Walnuts', n(654, 15.2, 13.7, 65.2, 6.7), [U('חופן', 28)], { allergens: ['אגוזים'] }],
    ['קשיו', 'Cashews', n(553, 18.2, 30.2, 43.9, 3.3), [U('חופן', 28)], { allergens: ['אגוזים'] }],
    ['חומוס ממרח', 'Hummus spread', n(166, 7.9, 14.3, 9.6, 6), [TBSP], { allergens: ['שומשום'] }],
    ['זיתים ירוקים', 'Green olives', n(145, 1, 3.8, 15.3, 3.3), [U('10 זיתים', 40)]],
    ['חמאה', 'Butter', n(717, 0.9, 0.1, 81.1), [U('כפית', 5)], { allergens: ['חלב'] }],
    ['מיונז', 'Mayonnaise', n(680, 1, 0.6, 75), [TBSP], { allergens: ['ביצים'] }],
  ],
  meals: [
    ['סלט ירקות', 'Vegetable salad', null, [U('קערה', 200)], { state: 'prepared' }],
    ['סלט טונה', 'Tuna salad', null, [U('מנה', 150)], { state: 'prepared', allergens: ['דגים', 'ביצים'] }],
    ['כריך ביצה', 'Egg sandwich', null, [U('כריך', 180)], { state: 'prepared', allergens: ['ביצים', 'גלוטן'] }],
    ['כריך גבינה', 'Cheese sandwich', null, [U('כריך', 150)], { state: 'prepared', allergens: ['חלב', 'גלוטן'] }],
    ['פיצה', 'Pizza', null, [U('משולש', 110)], { state: 'prepared', allergens: ['חלב', 'גלוטן'] }],
    ['פלאפל', 'Falafel', null, [U('כדור', 17)], { state: 'prepared' }],
    ['שווארמה', 'Shawarma', null, [U('מנה', 200)], { state: 'prepared' }],
    ['שניצל', 'Schnitzel', null, [U('שניצל', 130)], { state: 'prepared', allergens: ['ביצים', 'גלוטן'] }],
    ['מרק ירקות', 'Vegetable soup', null, [U('קערה', 300)], { state: 'prepared', basis: 'ml' }],
    ['קפה שחור', 'Black coffee', n(2, 0.1, 0, 0), [U('ספל', 240)], { basis: 'ml' }],
    ['קפה עם חלב', 'Coffee with milk', null, [U('ספל', 240)], { basis: 'ml', allergens: ['חלב'] }],
    ['מיץ תפוזים', 'Orange juice', n(45, 0.7, 10.4, 0.2, 0.2), [CUP], { basis: 'ml' }],
  ],
};

let counter = 0;
export const STARTER_FOODS: Food[] = (Object.keys(groups) as (keyof typeof groups)[]).flatMap((cat) =>
  groups[cat].map(([name, nameEn, per100, portions, extra]) => {
    counter += 1;
    return {
      id: `f${String(counter).padStart(3, '0')}`,
      name,
      nameEn,
      category: cat,
      basis: 'g',
      per100,
      portions: portions ?? [],
      source: per100 ? REF : NEEDS_LABEL,
      verified: false,
      ...extra,
    } satisfies Food as Food;
  }),
);

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  dairy: 'מוצרי חלב',
  protein: 'חלבון ומשקאות',
  meat: 'בשר ודגים',
  eggs: 'ביצים וקטניות',
  carbs: 'פחמימות',
  bread: 'לחמים ודגנים',
  produce: 'פירות וירקות',
  fats: 'שומנים ותוספות',
  meals: 'ארוחות ומשקאות',
  drinks: 'משקאות',
  snacks: 'חטיפים',
  custom: 'המוצרים שלי',
};

export const CATEGORY_ICON: Record<FoodCategory, import('@/components/Icon').IconName> = {
  dairy: 'drop', protein: 'protein', meat: 'flame', eggs: 'bowl', carbs: 'wheat', bread: 'wheat', produce: 'sparkle',
  fats: 'fat', meals: 'food', drinks: 'drop', snacks: 'star', custom: 'edit',
};
