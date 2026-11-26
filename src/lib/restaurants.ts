import type { RestaurantType } from '../data/types';
import type { IconName } from '../components/Icon';

export const RESTAURANT_TYPES: { key: RestaurantType; label: string; icon: IconName; q: string[] }[] = [
  { key: 'burgers', label: 'המבורגרים', icon: 'food', q: ['המבורגר', 'צ׳יפס', 'טבעות בצל'] },
  { key: 'pizza', label: 'פיצות', icon: 'food', q: ['פיצה'] },
  { key: 'italian', label: 'איטלקי', icon: 'bowl', q: ['פסטה', 'לזניה', 'ריזוטו', 'ניוקי', 'פוקצ׳ה'] },
  { key: 'asian', label: 'אסייתי', icon: 'bowl', q: ['אטריות', 'אורז מטוגן', 'עוף אסייתי', 'מוקפץ'] },
  { key: 'sushi', label: 'סושי', icon: 'bowl', q: ['סושי', 'אורז'] },
  { key: 'grill', label: 'בשרים', icon: 'flame', q: ['סטייק', 'קבב', 'שישליק', 'פרגית', 'אנטריקוט'] },
  { key: 'shawarma', label: 'שווארמה', icon: 'flame', q: ['שווארמה', 'פלאפל', 'פיתה', 'לאפה', 'חומוס'] },
  { key: 'cafe', label: 'בתי קפה', icon: 'drop', q: ['קפה', 'כריך', 'סלט', 'מאפה', 'עוגה'] },
  { key: 'fastfood', label: 'אוכל מהיר', icon: 'food', q: ['מקדונלדס', 'נאגטס', 'צ׳יפס', 'שניצל'] },
  { key: 'dairy', label: 'מסעדות חלביות', icon: 'bowl', q: ['שקשוקה', 'פסטה ברוטב', 'סלט', 'בורקס', 'טוסט'] },
];

export const restaurantLabel = (t?: RestaurantType) => RESTAURANT_TYPES.find((r) => r.key === t)?.label ?? 'מסעדה';

/** Major allergens (Israeli labelling list). Only what the user or the restaurant states – never inferred. */
export const ALLERGENS = ['גלוטן', 'חלב', 'ביצים', 'בוטנים', 'אגוזים', 'שומשום', 'סויה', 'דגים', 'רכיכות', 'סלרי', 'חרדל'];
