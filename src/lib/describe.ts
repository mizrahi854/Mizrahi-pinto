/**
 * "Describe your meal" – a LOCAL parser (not AI). It splits free Hebrew text into items, reads quantities and
 * units, and matches each item against the food database. Nothing is guessed: an unmatched item stays
 * unmatched and the user picks it manually. Every result is shown for confirmation before saving.
 */
import type { Food } from '../data/types';
import { searchLocal, norm } from './search';

export type ParsedItem = { text: string; food: Food | null; amount: number; unitLabel: string; grams: number | null; alternatives: Food[] };

const NUM_WORDS: Record<string, number> = {
  אחד: 1, אחת: 1, שתיים: 2, שתי: 2, שניים: 2, שני: 2, שלוש: 3, שלושה: 3, ארבע: 4, ארבעה: 4, חמש: 5, חמישה: 5,
  שש: 6, שישה: 6, חצי: 0.5, רבע: 0.25, וחצי: 0.5,
};
const UNIT_WORDS: Record<string, string> = {
  כוס: 'כוס', כוסות: 'כוס', כף: 'כף', כפות: 'כף', כפית: 'כפית', כפיות: 'כפית', פרוסה: 'פרוסה', פרוסות: 'פרוסה',
  יחידה: 'יחידה', יחידות: 'יחידה', מנה: 'מנה', מנות: 'מנה', צלחת: 'צלחת', קערה: 'קערית', קערית: 'קערית', גביע: 'גביע', גביעים: 'גביע',
  פיתה: 'פיתה', לחמניה: 'לחמניה', בקבוק: 'בקבוק', פחית: 'פחית', חטיף: 'חטיף', אריזה: 'אריזה', חופן: 'חופן', משולש: 'משולש',
};
const GRAM_WORDS = new Set(['גרם', 'גר', 'ג', 'גרמים', 'מל', 'מ״ל', 'מ"ל', 'מיליליטר']);

const isQtyStart = (t: string) => /^\d/.test(t) || t in NUM_WORDS || t in UNIT_WORDS || GRAM_WORDS.has(t);

/** Does the text start a known food? (used to split "חמין וקובה" into two items) */
function startsFood(word: string, foods: Food[]) {
  const n = norm(word);
  if (n.length < 2) return false;
  return singularCandidates(word).some((c) => {
    const nc = norm(c);
    return searchLocal(foods, c, 3).some((f) => norm(f.name).startsWith(nc));
  });
}

/** Split on commas/newlines/"+", on "ו" (and) that starts a new item, and on "עם" when no combined dish exists. */
export function splitItems(text: string, foods: Food[] = []): string[] {
  const out: string[] = [];
  const clean = text.replace(/\sו-/g, ', ').replace(/\s-\s/g, ', ');
  for (const chunk of clean.split(/[,،\n;+]| וגם /)) {
    const words = chunk.trim().split(/\s+/).filter(Boolean);
    let cur: string[] = [];
    for (const w of words) {
      const rest = w.slice(1);
      if (cur.length && w.startsWith('ו') && rest.length >= 2 && (isQtyStart(rest) || startsFood(rest, foods))) {
        out.push(cur.join(' '));
        cur = [rest];
      } else cur.push(w);
    }
    if (cur.length) out.push(cur.join(' '));
  }
  // "לחם עם קוטג׳" → two items, unless the database has that combined dish ("חומוס עם טחינה")
  const final: string[] = [];
  for (const seg of out) {
    const parts = seg.split(/\sעם\s/);
    if (parts.length > 1 && foods.length) {
      const combined = searchLocal(foods, seg, 3).some((f) => parts.every((p) => norm(f.name).includes(norm(p).split(' ')[0]!)));
      if (!combined) { final.push(...parts); continue; }
    }
    final.push(seg);
  }
  return final.map((s) => s.trim()).filter((s) => s.length >= 2);
}

function singularCandidates(name: string) {
  const c = [name];
  const words = name.split(' ');
  const last = words[0]!;
  if (last.endsWith('ים')) c.push([last.slice(0, -2) + 'ה', ...words.slice(1)].join(' '), [last.slice(0, -2), ...words.slice(1)].join(' '));
  if (last.endsWith('ות')) c.push([last.slice(0, -2) + 'ה', ...words.slice(1)].join(' '), [last.slice(0, -2), ...words.slice(1)].join(' '));
  return c;
}

export function parseOne(text: string, foods: Food[]): ParsedItem {
  const tokens = text.replace(/[׳']/g, '').split(/\s+/).filter(Boolean);
  let amount = 1;
  let explicitAmount = false;
  let grams: number | null = null;
  let unit: string | null = null;
  const nameParts: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const n = t.replace(',', '.');
    if (/^\d+(\.\d+)?$/.test(n) || /^\d+\/\d+$/.test(n)) {
      const v = n.includes('/') ? Number(n.split('/')[0]) / Number(n.split('/')[1]) : Number(n);
      const next = tokens[i + 1];
      if (next && GRAM_WORDS.has(next.replace(/["״]/g, ''))) { grams = v; i++; continue; }
      amount = v; explicitAmount = true; continue;
    }
    const gm = /^(\d+(?:\.\d+)?)(גרם|גר|ג|מל)$/.exec(n);
    if (gm) { grams = Number(gm[1]); continue; }
    if (t in NUM_WORDS && !nameParts.length) { amount = (t === 'וחצי' ? amount + 0.5 : NUM_WORDS[t]!); explicitAmount = true; continue; }
    if (t === 'וחצי') { amount += 0.5; continue; }
    if (t in UNIT_WORDS && !nameParts.length && tokens.length > i + 1) { unit = UNIT_WORDS[t]!; continue; }
    if (GRAM_WORDS.has(t)) continue;
    if (t === 'של') continue;
    nameParts.push(t);
  }
  let name = nameParts.join(' ');
  // "2 פיתות" → the unit is the food itself
  if (!name && unit) name = unit;
  let matches: Food[] = [];
  for (const cand of singularCandidates(name)) {
    matches = searchLocal(foods, cand, 5);
    if (matches.length) break;
  }
  // keep only real matches: the first word of the query must appear in the food name
  const first = norm(name).split(' ')[0] ?? '';
  matches = matches.filter((f) => first.length >= 2 && norm(f.name).split(' ').some((w) => w.startsWith(first.slice(0, Math.max(2, first.length - 2)))));
  const food = matches[0] ?? null;
  let unitLabel = food?.basis === 'ml' ? 'מ״ל' : 'ג׳';
  if (grams != null) return { text, food, amount: grams, unitLabel, grams, alternatives: matches.slice(1) };
  if (food) {
    const portions = food.portions;
    const pick =
      (unit && portions.find((p) => p.label.startsWith(unit))) ??
      portions.find((p) => p.label === 'יחידה בינונית') ??
      portions.find((p) => p.label === 'מנה בינונית') ??
      portions.find((p) => p.label.includes('בינונית')) ??
      portions.find((p) => /^(יחידה|מנה|פרוסה|פיתה|גביע|כוס)/.test(p.label)) ??
      // the food's own natural unit ("ביצה (L)", "שניצל")
      (portions.length <= 2 ? portions[0] : undefined);
    if (pick) return { text, food, amount: explicitAmount ? amount : 1, unitLabel: pick.label, grams: Math.round(pick.grams * (explicitAmount ? amount : 1) * 10) / 10, alternatives: matches.slice(1) };
    unitLabel = food.basis === 'ml' ? 'מ״ל' : 'ג׳';
  }
  return { text, food, amount: food ? 100 : amount, unitLabel: food ? unitLabel : 'מנה', grams: food ? 100 : null, alternatives: matches.slice(1) };
}

export function parseMealText(text: string, foods: Food[]): ParsedItem[] {
  return splitItems(text, foods).map((t) => parseOne(t, foods));
}
