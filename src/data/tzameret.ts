import type { Food, FoodCategory } from './types';
import raw from './tzameret.json';

/**
 * Israeli national food-composition database "Tzameret" (Ministry of Health, data.gov.il, open licence –
 * attribution required). Values per 100 g and official portion weights (e.g. "יחידה בינונית", "מנה בינונית").
 * Covers basic foods, Israeli home cooking (חמין, קובה, קוסקוס, מפרום…), Shabbat dishes and some chain dishes.
 */
type Row = [number, string, string, FoodCategory, number | null, number | null, number | null, number | null, number | null, [string, number][]];

export const TZAMERET_SOURCE = (raw as { source: string }).source;

const SHABBAT = /חלה|חמין|קובה|קוסקוס|גפילטע|מפרום|קוגל|דג |דג,|סלמון|מושט|דניס|לברק|קרפיון|עוף ממולא|צלי|שניצל|תפוחי אדמה|אורז|סלט|כבד קצוץ|חציל|מטבוחה|חומוס|טחינה|עוגת|עוגה|עוגיות|רוגלך|בבקה|ג.חנון|מלוואח|קידוש|יין/;

export const TZAMERET_FOODS: Food[] = (raw as unknown as { items: Row[] }).items.map(([code, name, en, category, kcal, protein, carbs, fat, fiber, portions]) => ({
  id: `tz_${code}`,
  name,
  nameEn: en || undefined,
  aliases: SHABBAT.test(name) ? ['שבת', 'שישי'] : undefined,
  category,
  basis: 'g',
  per100: { kcal, protein, carbs, fat, fiber },
  portions: portions.map(([label, grams]) => ({ label, grams })),
  source: 'מאגר צמרת – משרד הבריאות (ערך ממוצע למוצר/מתכון כללי)',
  verified: true,
}));
