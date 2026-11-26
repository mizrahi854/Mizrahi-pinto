import type { Food } from '../data/types';
import { CATEGORY_LABELS } from '../data/foods';

const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

/** Normalise for matching: lowercase, drop niqqud/punctuation/geresh, unify Hebrew final letters. */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c] ?? c)
    .replace(/[׳'"״`\-()%.,/+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Bounded Levenshtein distance (early exit above max). */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

const fuzzyTokenMatch = (q: string, word: string) => {
  if (q.length < 3) return false;
  const allowed = q.length >= 6 ? 2 : 1;
  // compare against the same-length prefix too, so "קוטגג" still finds "קוטג׳"
  return editDistance(q, word, allowed) <= allowed || editDistance(q, word.slice(0, q.length), allowed) <= allowed;
};

type Idx = { name: string; en: string; brand: string; extra: string[]; words: string[] };
const cache = new WeakMap<Food, Idx>();
function indexOf(f: Food): Idx {
  let i = cache.get(f);
  if (!i) {
    const name = norm(f.name);
    const en = norm(f.nameEn ?? '');
    const brand = norm(f.brand ?? '');
    const extra = [...(f.aliases ?? []).map(norm), norm(CATEGORY_LABELS[f.category])];
    i = { name, en, brand, extra, words: [name, en, brand, ...extra].join(' ').split(' ').filter(Boolean) };
    cache.set(f, i);
  }
  return i;
}

/** Ranked search over name (he/en), aliases, brand, barcode and category. Typo tolerant; normalised index is cached. */
export function searchLocal(foods: Food[], q: string, limit = 200) {
  const n = norm(q);
  if (!n) return foods.slice(0, limit);
  const digits = q.replace(/\D/g, '');
  const qTokens = n.split(' ');
  const scored: { f: Food; score: number }[] = [];
  const fuzzy: Food[] = [];
  for (const f of foods) {
    const { name, en, brand, extra, words } = indexOf(f);
    let score = 0;
    if (digits.length >= 4 && f.barcode?.startsWith(digits)) score = 120;
    else if (name === n) score = 110;
    else if (name.startsWith(n) || en.startsWith(n)) score = 100;
    else if (brand && (brand.startsWith(n) || n.startsWith(brand))) score = 85;
    else if (qTokens.every((t) => words.some((w) => w.startsWith(t)))) score = 80;
    else if (name.includes(n) || en.includes(n) || brand.includes(n) || extra.some((h) => h.includes(n))) score = 60;
    else fuzzy.push(f);
    if (score) {
      if (f.per100?.kcal != null) score += 3; // prefer items that have values
      score -= Math.min(10, name.length / 12); // shorter, more generic names first
      scored.push({ f, score });
    }
  }
  // typo tolerance only when exact matching found little (keeps typing fast on 5k+ items)
  if (scored.length < 8) {
    for (const f of fuzzy) {
      const { words } = indexOf(f);
      if (qTokens.every((t) => words.some((w) => w.startsWith(t) || fuzzyTokenMatch(t, w)))) scored.push({ f, score: 40 - Math.min(10, f.name.length / 12) });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.f);
}

export const defaultMeal = () => {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack';
};
