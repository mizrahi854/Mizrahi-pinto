import type { Food } from './types';
import raw from './il_products.json';

/**
 * Israeli packaged products imported from Open Food Facts (barcode, brand, label values per 100 g/ml,
 * serving size, package size, front image). Community-entered label data → shown as
 * "מתווית היצרן · קהילת Open Food Facts", never as verified. Licence: ODbL (data), CC BY-SA (images).
 */
export const IL_PRODUCTS: Food[] = (raw as Food[]).map((f) => ({ ...f, portions: f.portions ?? [], verified: false }));
