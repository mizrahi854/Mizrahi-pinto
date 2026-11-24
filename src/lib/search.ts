import type { Food } from '../data/types';
import { CATEGORY_LABELS } from '../data/foods';

export const norm = (s: string) => s.toLowerCase().replace(/[׳'"״\-()%]/g, '').replace(/\s+/g, ' ').trim();

export function searchLocal(foods: Food[], q: string) {
  const n = norm(q);
  if (!n) return foods;
  return foods
    .map((f) => {
      const hay = [f.name, f.nameEn ?? '', f.brand ?? '', ...(f.aliases ?? []), f.barcode ?? '', CATEGORY_LABELS[f.category]].map(norm);
      const score = hay[0]!.startsWith(n) ? 3 : hay.some((h) => h.startsWith(n)) ? 2 : hay.some((h) => h.includes(n)) ? 1 : 0;
      return { f, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f);
}


export const defaultMeal = () => {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack';
};

