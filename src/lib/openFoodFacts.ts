import type { Food, Nutrients } from '@/data/types';

/**
 * Open Food Facts lookup (open data, ODbL; images CC BY-SA – attribution shown in UI).
 * Values come only from the product record; missing nutrients stay null.
 */
const BASE = 'https://world.openfoodfacts.org';
const UA = 'MizrahiPinto/1.0 (fitness app; contact via app store listing)';

type OFFProduct = {
  code?: string;
  product_name?: string;
  product_name_he?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  allergens_tags?: string[];
  nutriments?: Record<string, number | string | undefined>;
  nutrition_data_per?: string;
  serving_quantity?: number | string;
  product_quantity?: number | string;
};

const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && isFinite(Number(v)) ? Number(v) : null);

export function mapOFF(p: OFFProduct): Food | null {
  if (!p.code) return null;
  const m = p.nutriments ?? {};
  const kcal = num(m['energy-kcal_100g']) ?? (num(m['energy_100g']) != null ? Math.round(num(m['energy_100g'])! / 4.184) : null);
  const per100: Nutrients = {
    kcal,
    protein: num(m['proteins_100g']),
    carbs: num(m['carbohydrates_100g']),
    fat: num(m['fat_100g']),
    fiber: num(m['fiber_100g']),
  };
  const hasAny = Object.values(per100).some((v) => v != null);
  const liquid = /ml|ליטר|l\b/i.test(p.quantity ?? '') && !/g\b/i.test(p.quantity ?? '');
  return {
    id: `off_${p.code}`,
    name: p.product_name_he || p.product_name || `מוצר ${p.code}`,
    brand: p.brands?.split(',')[0]?.trim(),
    category: 'custom',
    basis: liquid ? 'ml' : 'g',
    per100: hasAny ? per100 : null,
    portions: num(p.serving_quantity) && num(p.serving_quantity)! < 2000 ? [{ label: 'מנה לפי היצרן', grams: num(p.serving_quantity)! }] : [],
    packageSize: num(p.product_quantity) && num(p.product_quantity)! < 10000 ? num(p.product_quantity)! : undefined,
    barcode: p.code,
    imageUrl: p.image_front_url,
    allergens: (p.allergens_tags ?? []).map((a) => a.replace(/^..:/, '')),
    source: 'Open Food Facts – נתוני תווית שהוזנו על ידי הקהילה (ODbL, תמונות CC BY-SA)',
    verified: false,
  };
}

async function get(path: string, signal?: AbortSignal) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function lookupBarcode(code: string): Promise<Food | null> {
  const clean = code.replace(/\D/g, '');
  if (clean.length < 6) throw new Error('ברקוד לא תקין');
  const data = await get(`/api/v2/product/${clean}.json?fields=code,product_name,product_name_he,brands,quantity,serving_quantity,product_quantity,image_front_url,allergens_tags,nutriments`);
  if (data?.status !== 1 || !data.product) return null;
  return mapOFF({ ...data.product, code: clean });
}

export async function searchOFF(q: string, page = 1, signal?: AbortSignal): Promise<Food[]> {
  if (q.trim().length < 2) return [];
  const data = await get(
    `/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=20&page=${page}&countries_tags_en=israel&fields=code,product_name,product_name_he,brands,quantity,serving_quantity,product_quantity,image_front_url,allergens_tags,nutriments`,
    signal,
  );
  return ((data?.products ?? []) as OFFProduct[]).map(mapOFF).filter((f): f is Food => !!f);
}
