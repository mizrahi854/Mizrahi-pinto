import type { Recipe } from '../data/types';
import { STARTER_FOODS } from '../data/foods';
import { nutrientsFor, sumNutrients } from './nutrition';

export const foodById = (id: string) => STARTER_FOODS.find((f) => f.id === id);

/** Whole-recipe totals (divide by servings for per-serving). Missing values stay partial. */
export function recipeNutrients(r: Recipe) {
  return sumNutrients(r.ingredients.map((i) => {
    const f = foodById(i.foodId);
    return f ? nutrientsFor(f, i.grams) : { kcal: null, protein: null, carbs: null, fat: null };
  }));
}

export function shoppingItemsFor(r: Recipe) {
  return r.ingredients.map((i) => ({ name: foodById(i.foodId)?.name ?? i.foodId, qty: `${i.grams} ${foodById(i.foodId)?.basis === 'ml' ? 'מ״ל' : 'ג׳'}`, recipeId: r.id }));
}
