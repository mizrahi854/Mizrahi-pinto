export const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date key (device time zone). Changes exactly at local midnight. */
export const dateKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
};

export const addDays = (k: string, n: number) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

export const diffDays = (a: string, b: string) => Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86400000);

export const nowTime = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const DAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
export const DAY_LONG = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export const prettyDate = (k: string) => {
  const d = parseKey(k);
  const today = dateKey();
  if (k === today) return 'היום';
  if (k === addDays(today, -1)) return 'אתמול';
  if (k === addDays(today, 1)) return 'מחר';
  return `יום ${DAY_LONG[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]}`;
};

/** Sunday-based week containing k */
export const weekOf = (k: string) => {
  const d = parseKey(k);
  const start = addDays(k, -d.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
};

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const fmtDuration = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};
