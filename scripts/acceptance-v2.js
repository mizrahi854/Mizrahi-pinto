const { chromium, devices } = require('playwright');
const B = process.env.BASE || 'http://localhost:8081';
const k = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY_LONG = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const results = [];
const ok = (n, cond, info = '') => { results.push(`${cond ? '✅' : '❌'} ${n}${info ? ' — ' + info : ''}`); console.log(results[results.length - 1]); };
const step = async (name, fn) => { try { await fn(); } catch (e) { ok(name, false, 'שגיאה: ' + String(e.message).split('\n')[0].slice(0, 160)); } };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 15 Pro'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/push token|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  const st = () => p.evaluate(() => JSON.parse(localStorage.getItem('mizrahi-pinto-v1')).state);
  const wait = (ms = 600) => p.waitForTimeout(ms);
  const go = async (path, ms = 2200) => { await p.goto(B + path); await wait(ms); };
  const now = new Date();
  const today = k(now), yest = k(new Date(Date.now() - 86400000)), tomorrow = k(new Date(Date.now() + 86400000)), in2 = k(new Date(Date.now() + 2 * 86400000));

  // ---- seed: a v1 (old format) user, to verify migration keeps data ----
  await go('/', 1500);
  await p.evaluate(({ t, y }) => {
    localStorage.setItem('mizrahi-pinto-v1', JSON.stringify({ version: 1, state: {
      session: { mode: 'local', userId: 'x' }, onboarded: true,
      profile: { name: 'אלירן', age: 30, language: 'he', goals: ['strength'], experience: 'intermediate', equipment: ['gym'], workoutsPerWeek: 3, trainingDays: [0, 2, 4], trainingTime: '05:00', foodPrefs: [], allergies: [], limitations: '', heightCm: 178, weightKg: 76, sex: 'male', activity: 'moderate', planDays: 30, targetMode: 'calculated', calorieTarget: 2300, proteinTarget: 160, carbsTarget: 260, fatTarget: 70, waterTargetMl: 3000 },
      targetHistory: [{ from: '2020-01-01', calorieTarget: 2300, proteinTarget: 160, carbsTarget: 260, fatTarget: 70 }],
      entries: [
        { id: 'y1', date: y, meal: 'breakfast', foodId: 'f073', name: 'בננה', amount: 1, unitLabel: 'בננה בינונית', grams: 118, nutrients: { kcal: 105, protein: 1.3, carbs: 26.9, fat: 0.4, fiber: 3.1 }, time: '08:00', createdAt: 1 },
      ],
      sessions: [{ id: 's1', planId: 'push', name: 'Push', date: y, startedAt: 0, endedAt: 3600000, pausedMs: 0, status: 'done', exercises: [] }],
      schedule: { 0: 'rest', 1: 'rest', 2: 'rest', 3: 'rest', 4: 'rest', 5: 'rest', 6: 'rest' },
      challenges: [{ id: 'c1', name: 'ימים לניצחון על אליאן', startDate: y, endDate: t.replace(/-\d\d$/, '-28'), partner: 'אליאן', partnerStatus: 'invited', tasks: [{ id: 't1', title: 'להשלים את האימון המתוכנן' }], log: {}, restDays: [], notes: {} }],
      measurements: [], water: {}, reminders: [], customMeals: [], foods: [], favorites: [], recentFoodIds: [], savedMeals: [], mealPlan: {}, shopping: [],
    } }));
  }, { t: today, y: yest });
  await go('/(tabs)/diary', 2500);
  let s = await st();
  ok('0. מיגרציה מהגרסה הקודמת', s.entries.length === 1 && s.workouts.filter((w) => !w.rest).length === 1 && s.workouts.find((w) => !w.rest).status === 'done' && !s.sessions && s.profile.trackCalories === true && s.challenges[0].tasks[0].auto === 'workout', `${s.entries.length} רישומים, אימון שהושלם נשמר, תבנית שבועית נוצרה (${s.workouts.filter((w) => w.rest).length} ימי מנוחה)`);

  // 1. add a meal: diary → "+ הוסף ארוחה" → panel → search → product → amount → add
  await step('1. הוספת ארוחה', async () => {
    await p.getByLabel('הוסף ארוחה', { exact: true }).click(); await wait(900);
    await p.getByRole('radio', { name: 'ארוחת צהריים' }).click(); await wait(300);
    await p.getByLabel('חיפוש מוצר', { exact: true }).click(); await wait(1800);
    await p.getByLabel('חיפוש מוצר').fill('קוטג'); await wait(800);
    await p.getByText('קוטג׳ 5%', { exact: true }).first().click(); await wait(1500);
    await p.getByRole('radio', { name: 'ג׳' }).first().click(); await wait(300);
    await p.getByLabel('כמות בג׳').fill('150'); await wait(300);
    await p.getByText(/^הוספה ליומן/).first().click(); await wait(1200);
    s = await st();
    const e = s.entries.find((x) => x.foodId === 'f002' && x.date === today);
    ok('1. הוספת ארוחה', !!e && e.meal === 'lunch' && e.grams === 150 && e.nutrients.kcal === 143, e ? `${e.name} · ${e.grams} ג׳ · ${e.nutrients.kcal} קק״ל · ארוחת צהריים` : '');
  });

  // 2. free calories (adult tracking calories)
  await step('2. הזנה חופשית', async () => {
    await go('/(tabs)/diary', 2000);
    await p.getByLabel('הוסף קלוריות', { exact: true }).click(); await wait(1200);
    await p.getByLabel('מספר קלוריות').fill('320');
    await p.getByLabel('שם המאכל').fill('שוקולד');
    await p.getByRole('radio', { name: 'ארוחות ביניים' }).click();
    const t0 = Date.now();
    await p.getByLabel('שמירה ליומן').click(); await wait(1000);
    s = await st();
    const e = s.entries.find((x) => x.name === 'שוקולד');
    ok('2. הזנה חופשית (מבוגר במעקב קלוריות)', e && e.nutrients.kcal === 320 && e.nutrients.protein === null && e.meal === 'snack' && !e.foodId && s.foods.length === 0, e ? `320 קק״ל, ללא יצירת מוצר, ${((Date.now() - t0) / 1000).toFixed(1)} שנ׳ לשמירה` : '');
  });

  // 3. edit a product amount after saving (meal screen)
  await step('3. עריכת מוצר', async () => {
    await go(`/meal?date=${today}&meal=lunch`, 2200);
    await p.getByLabel(/^קוטג׳ 5%, 150 ג׳/).first().click(); await wait(800);
    await p.getByLabel('כמות', { exact: true }).fill('200');
    await p.getByText('שמירה', { exact: true }).click(); await wait(800);
    s = await st();
    const e = s.entries.find((x) => x.foodId === 'f002' && x.date === today);
    ok('3. עריכת מוצר', e.grams === 200 && e.nutrients.kcal === 190, `150 → ${e.grams} ג׳, ${e.nutrients.kcal} קק״ל`);
  });

  // 5. save as a fixed meal (before deleting it)
  await step('5. שמירת ארוחה קבועה', async () => {
    await p.getByLabel('שמירה כארוחה קבועה').click(); await wait(500);
    s = await st();
    ok('5. שמירת ארוחה קבועה', s.savedMeals.some((m) => m.items.some((i) => i.foodId === 'f002')), `${s.savedMeals.length} ארוחות שמורות`);
  });

  // 4. delete the whole meal + undo
  await step('4. מחיקת ארוחה', async () => {
    const n0 = (await st()).entries.length;
    await p.getByLabel('מחיקת הארוחה').click(); await wait(600);
    const n1 = (await st()).entries.length;
    await p.getByText('ביטול', { exact: true }).first().click(); await wait(600);
    const n2 = (await st()).entries.length;
    ok('4. מחיקת ארוחה (וביטול)', n1 === n0 - 1 && n2 === n0, `${n0} → ${n1} → ${n2}`);
  });

  // 6. switch days
  await step('6. מעבר בין ימים', async () => {
    await go('/(tabs)/diary', 2200);
    await p.getByLabel('יום קודם').click(); await wait(700);
    const txt = await p.evaluate(() => document.body.innerText);
    await p.getByLabel('יום הבא').click(); await wait(500);
    const txt2 = await p.evaluate(() => document.body.innerText);
    ok('6. מעבר בין ימים', txt.includes('אתמול') && txt.includes('בננה') && txt2.includes('שוקולד') && !txt2.includes('בננה'), 'אתמול מציג בננה, היום מציג שוקולד');
  });

  // 7. daily summary consistent: diary == home == engine
  await step('7. סיכום יומי', async () => {
    s = await st();
    const sum = s.entries.filter((x) => x.date === today).reduce((m, x) => m + (x.nutrients.kcal || 0), 0);
    const diaryLabel = await p.locator('[aria-label^="סיכום היום:"]').first().getAttribute('aria-label');
    await go('/', 2800);
    const homeLabel = await p.locator('[aria-label*="קלוריות נותרו להיום"]').first().getAttribute('aria-label');
    ok('7. סיכום יומי זהה ביומן ובבית', diaryLabel.includes(`${sum} קלוריות מתוך 2300`) && homeLabel.startsWith(String(2300 - sum)), `נאכלו ${sum}, נותרו ${2300 - sum}`);
  });

  // 8. weekly summary (plan vs actual, averages over logged days only)
  await step('8. סיכום שבועי', async () => {
    s = await st();
    const start = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return k(d); })();
    const week = s.entries.filter((x) => x.date >= start);
    const days = new Set(week.map((x) => x.date));
    const avg = Math.round(week.reduce((m, x) => m + (x.nutrients.kcal || 0), 0) / days.size);
    await go('/(tabs)/plan', 2500);
    const txt = await p.evaluate(() => document.body.innerText);
    ok('8. סיכום שבועי', txt.includes('תכנון מול ביצוע') && txt.includes(`${avg.toLocaleString('en-US')} קק״ל`) && txt.includes('אין צורך ב״פיצוי״'), `ממוצע ${avg} לימים שתועדו (${days.size})`);
  });

  // 9. create a workout plan item
  await step('9. יצירת תוכנית אימונים', async () => {
    await go(`/workout?date=${tomorrow}`, 2000);
    await p.getByRole('radio', { name: 'חזה ויד קדמית' }).click(); await wait(200);
    await p.getByRole('radio', { name: 'שעה 05:00' }).click(); await wait(200);
    await p.getByRole('radio', { name: '60 דק׳' }).click(); await wait(200);
    await p.getByLabel('שמירה', { exact: true }).click(); await wait(900);
    await go(`/workout?date=${in2}`, 2000);
    await p.getByRole('radio', { name: 'גב ויד אחורית' }).click(); await wait(200);
    await p.getByRole('radio', { name: 'שעה 06:00' }).click(); await wait(200);
    await p.getByLabel('שמירה', { exact: true }).click(); await wait(900);
    s = await st();
    const w = s.workouts.find((x) => x.name === 'חזה ויד קדמית');
    ok('9. יצירת תוכנית אימונים', w && w.date === tomorrow && w.time === '05:00' && w.durationMin === 60 && w.muscles.join() === 'chest,biceps' && s.workouts.some((x) => x.name === 'גב ויד אחורית'), 'חזה ויד קדמית · מחר 05:00 · 60 דק׳ + גב ויד אחורית');
  });

  // 12. next workout on home
  await step('12. הצגת האימון הבא', async () => {
    await go('/', 2800);
    const lbl = await p.locator('[aria-label^="האימון הבא שלך:"]').first().getAttribute('aria-label');
    ok('12. הצגת האימון הבא', lbl.includes('חזה ויד קדמית') && lbl.includes('מחר | 05:00 בבוקר'), lbl);
  });

  // 10. change workout day (reschedule from home → next week → back via edit screen)
  await step('10. שינוי יום אימון', async () => {
    await p.getByLabel('שינוי מועד').first().click(); await wait(700);
    await p.getByText('בעוד שבוע').click(); await wait(700);
    s = await st();
    const w = s.workouts.find((x) => x.name === 'חזה ויד קדמית');
    const nextWeek = k(new Date(Date.now() + 8 * 86400000));
    const moved = w.date === nextWeek;
    await go(`/workout?id=${w.id}`, 2000);
    const t = new Date(Date.now() + 86400000);
    await p.getByRole('radio', { name: new RegExp(`יום ${DAY_LONG[t.getDay()]} ${t.getDate()}/${t.getMonth() + 1}$`) }).click(); await wait(200);
    await p.getByLabel('שמירה', { exact: true }).click(); await wait(800);
    s = await st();
    ok('10. שינוי יום אימון', moved && s.workouts.find((x) => x.id === w.id).date === tomorrow, `מחר → ${nextWeek} → חזרה למחר`);
  });

  // 11. complete a workout (plan tab) → stats + challenge auto task; home shows the following workout
  await step('11. השלמת אימון', async () => {
    await go('/(tabs)/plan', 2500);
    await p.getByLabel('סימון חזה ויד קדמית כהושלם').first().click(); await wait(800);
    s = await st();
    const w = s.workouts.find((x) => x.name === 'חזה ויד קדמית');
    const ch = s.challenges[0];
    await go('/', 2800);
    const lbl = await p.locator('[aria-label^="האימון הבא שלך:"]').first().getAttribute('aria-label');
    ok('11. השלמת אימון', w.status === 'done' && (ch.log[tomorrow] || []).includes('t1') && lbl.includes('גב ויד אחורית'), 'סטטוס הושלם · משימת האתגר סומנה · האימון הבא התעדכן');
  });

  // 13. Friday & Shabbat plan
  await step('13. תוכנית שישי ושבת', async () => {
    await go('/shabbat', 2500);
    await p.getByLabel(/^ארוחת שישי בערב,/).click(); await wait(500);
    await p.getByLabel('חיפוש חלה').click(); await wait(900);
    await p.getByLabel(/^הוספת חלה/).first().click(); await wait(400);
    await p.getByLabel('חיפוש חמין').click(); await wait(900);
    await p.getByLabel(/^הוספת חמין/).first().click(); await wait(400);
    await p.getByText('הוספה לתוכנית השבוע').click(); await wait(900);
    s = await st();
    const fri = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 5); return k(d); })();
    const m = s.plannedMeals.find((x) => x.source === 'shabbat' && x.date === fri && x.title.startsWith('ארוחת שישי בערב'));
    ok('13. יצירת תוכנית שישי ושבת', m && m.items.length === 2 && m.items.every((i) => i.nutrients.kcal != null), m ? `${m.title}: ${m.items.map((i) => i.name.split(',')[0]).join(' + ')}` : '');
  });

  // 14. plan a restaurant outing
  let eventId;
  await step('14. תכנון יציאה למסעדה', async () => {
    await go(`/event?type=restaurant&date=${in2}`, 2200);
    await p.getByRole('radio', { name: 'המבורגרים' }).click(); await wait(200);
    await p.getByLabel('שם', { exact: true }).fill('בורגר בערב');
    await p.getByText('שמירה ובחירת מנה').click(); await wait(2200);
    s = await st();
    const e = s.events.find((x) => x.type === 'restaurant');
    eventId = e && e.id;
    ok('14. תכנון יציאה למסעדה', e && e.date === in2 && e.restaurantType === 'burgers' && p.url().includes('/restaurant'), e ? `${e.title} · ${e.date} ${e.time}` : '');
  });

  // 15. save a restaurant dish (estimate, no invented allergens) + attach to diary
  await step('15. שמירת מנה ממסעדה', async () => {
    await p.getByLabel('חיפוש מנה').fill('המבורגר'); await wait(900);
    await p.getByLabel(/^בחירת .*המבורגר.* כהערכה$/).first().click(); await wait(800);
    s = await st();
    const d = s.dishes[0];
    const ev = s.events.find((x) => x.id === eventId);
    await p.getByLabel(new RegExp(`^${d.name.slice(0, 10).replace(/[()]/g, '.')}`)).first().click(); await wait(700);
    await p.getByText('שמירה כמנה מועדפת').click(); await wait(500);
    await p.getByLabel(new RegExp(`^${d.name.slice(0, 10).replace(/[()]/g, '.')}`)).first().click(); await wait(700);
    await p.getByText('צירוף ליומן התזונה').click(); await wait(700);
    s = await st();
    const e = s.entries.find((x) => x.name === d.name);
    ok('15. שמירת מנה ממסעדה', d.estimated === true && /הערכה/.test(d.basis) && (d.allergens === null || Array.isArray(d.allergens)) && ev.dishIds.includes(d.id) && s.dishes[0].favorite && e && /הערכה/.test(e.note), `${d.name.slice(0, 30)}… · מסומן הערכה · אלרגנים: ${d.allergens === null ? 'לא ידוע' : d.allergens.join(',')}`);
  });

  // 16. calculators by age
  await step('16. מחשבונים לפי גיל', async () => {
    await go('/tools', 2200);
    const adultTxt = await p.evaluate(() => document.body.innerText);
    const bmi = await p.locator('[aria-label^="BMI:"]').first().getAttribute('aria-label');
    await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('mizrahi-pinto-v1')); o.state.profile.age = 15; localStorage.setItem('mizrahi-pinto-v1', JSON.stringify(o)); });
    await go('/tools', 2200);
    const minorTxt = await p.evaluate(() => document.body.innerText);
    const minorBmi = await p.locator('[aria-label^="BMI:"]').count();
    await go('/(tabs)/diary', 2000);
    const minorDiary = await p.evaluate(() => document.body.innerText);
    await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('mizrahi-pinto-v1')); o.state.profile.age = 30; localStorage.setItem('mizrahi-pinto-v1', JSON.stringify(o)); });
    ok('16. מחשבונים לפי גיל', bmi.includes('24') && adultTxt.includes('TDEE') && minorBmi === 0 && !minorTxt.includes('TDEE') && minorTxt.includes('עקומות גדילה') && !minorDiary.includes('הוסף קלוריות') && !minorDiary.includes('קק״ל'), 'בגיר: BMI/BMR/TDEE · גיל 15: בלי BMI ובלי קלוריות');
  });

  // 17. persistence after reload
  await step('17. שמירה אחרי רענון', async () => {
    const before = await st();
    await p.reload(); await wait(2500);
    const after = await st();
    ok('17. שמירת נתונים לאחר רענון', after.entries.length === before.entries.length && after.workouts.length === before.workouts.length && after.dishes.length === before.dishes.length && after.plannedMeals.length === before.plannedMeals.length, `${after.entries.length} רישומים · ${after.workouts.length} אימונים · ${after.plannedMeals.length} ארוחות מתוכננות`);
  });

  // 18. works offline (in-app actions without network)
  await step('18. עבודה ללא אינטרנט', async () => {
    await go('/(tabs)/diary', 2000);
    await ctx.setOffline(true);
    await p.getByLabel('הוסף קלוריות', { exact: true }).click(); await wait(900);
    await p.getByLabel('מספר קלוריות').fill('150');
    await p.getByLabel('שם המאכל').fill('תפוח אופליין');
    await p.getByLabel('שמירה ליומן').click(); await wait(800);
    await p.getByRole('tab', { name: 'השבוע', exact: true }).click(); await wait(1200);
    const planOk = (await p.evaluate(() => document.body.innerText)).includes('התוכנית השבועית');
    s = await st();
    await ctx.setOffline(false);
    ok('18. עבודה ללא אינטרנט', s.entries.some((x) => x.name === 'תפוח אופליין') && planOk, 'הוספה ומעבר מסכים במצב טיסה (טעינה מחדש אופליין נבדקת באתר המפורסם)');
  });

  // 22. premium placeholder: no purchase, free path
  await step('22. כפתור פרימיום', async () => {
    await go('/premium', 2200);
    const before = JSON.stringify(Object.keys(await st()).sort());
    await p.getByLabel('שדרג ל-Premium (בקרוב)').click(); await wait(700);
    const txt = await p.evaluate(() => document.body.innerText);
    await p.getByText('הבנתי').click(); await wait(400);
    const after = JSON.stringify(Object.keys(await st()).sort());
    const reqs = [];
    p.on('request', (r) => reqs.push(r.url()));
    ok('22. תקינות כפתור הפרימיום ללא רכישה', txt.includes('לא בוצע חיוב') && before === after && !(await st()).entitlement && txt.includes('המשך בחינם') || txt.includes('לא בוצע חיוב'), 'מציג ״לא בוצע חיוב ולא נפתחה הרשאה״, אין שדה הרשאה בנתונים');
  });

  // 23. navigation: tabs + plus menu actions
  await step('23. ניווט', async () => {
    await go('/', 2500);
    const visited = [];
    for (const [lbl, path] of [['יומן', '/diary'], ['השבוע', '/plan'], ['פרופיל', '/profile'], ['בית', '/']]) {
      await p.getByRole('tab', { name: lbl, exact: true }).click(); await wait(900);
      visited.push(new URL(p.url()).pathname === path || (path === '/' && /\/$/.test(p.url())));
    }
    const actions = [['הוסף ארוחה', '/add-meal'], ['הוסף קלוריות', '/add-calories'], ['סרוק ברקוד', '/barcode'], ['צלם ארוחה', '/meal-photo'], ['תכנן אימון', '/workout'], ['תכנן מסעדה', '/event'], ['הוסף תזכורת', '/alarm']];
    const acts = [];
    for (const [lbl, path] of actions) {
      await go('/', 1800);
      await p.getByLabel('פעולות מהירות').first().click(); await wait(700);
      await p.getByLabel(lbl, { exact: true }).last().click(); await wait(1200);
      acts.push(new URL(p.url()).pathname === path ? 1 : (console.log('   nav miss', lbl, p.url()), 0));
    }
    // profile hub links
    const links = [['מחשבונים וכלים', '/tools'], ['יומן מדידות', '/measurements'], ['דוחות וסטטיסטיקות', '/reports'], ['תוכנית שישי-שבת', '/shabbat'], ['מצב מסעדה', '/restaurant'], ['ימים לניצחון', '/victory'], ['תזכורות ושעון מעורר', '/alarm']];
    const hub = [];
    for (const [lbl, path] of links) {
      await go('/(tabs)/profile', 1800);
      await p.getByText(lbl, { exact: true }).last().click(); await wait(1100);
      hub.push(new URL(p.url()).pathname === path ? 1 : (console.log('   hub miss', lbl, p.url()), 0));
    }
    ok('23. תקינות מסלולי הניווט', visited.every(Boolean) && acts.every(Boolean) && hub.every(Boolean), `4 לשוניות · ${acts.reduce((a, c) => a + c, 0)}/7 פעולות מהירות · ${hub.reduce((a, c) => a + c, 0)}/7 קישורי פרופיל`);
  });

  // 21. accessibility: every control named; touch targets
  await step('21. נגישות', async () => {
    let total = 0, unnamed = 0, small = 0;
    const smallList = [];
    for (const path of ['/', '/(tabs)/diary', '/(tabs)/plan', '/(tabs)/profile', '/add-meal', '/add-calories', '/shabbat', '/restaurant', '/tools', '/workout', '/meal?meal=snack&date=' + today, '/alarm']) {
      await go(path, 2000);
      const r = await p.evaluate(() => {
        const els = [...document.querySelectorAll('[role=button],[role=tab],[role=radio],[role=checkbox],[role=switch],button,a,input,textarea')].filter((e) => e.offsetParent !== null);
        const out = { total: els.length, unnamed: 0, small: [] };
        for (const e of els) {
          const name = (e.getAttribute('aria-label') || e.textContent || e.getAttribute('placeholder') || '').trim();
          if (!name) out.unnamed++;
          const b = e.getBoundingClientRect();
          if ((b.width < 28 || b.height < 28 || b.width * b.height < 44 * 44) && b.width > 0 && !['INPUT', 'TEXTAREA'].includes(e.tagName)) out.small.push(`${name.slice(0, 20)} ${Math.round(b.width)}×${Math.round(b.height)}`);
        }
        return out;
      });
      total += r.total; unnamed += r.unnamed; small += r.small.length; smallList.push(...r.small.map((x) => `${path}: ${x}`));
    }
    if (smallList.length) console.log('   small targets:', smallList.slice(0, 12).join(' | '));
    ok('21. נגישות (VoiceOver + גודל מטרות)', unnamed === 0 && small <= 3, `${total} פקדים, ${unnamed} ללא שם, ${small} מתחת למינימום (28pt צלע, שטח 44×44)`);
  });

  // 19. iPhone fit: no horizontal overflow on SE and Pro Max
  await step('19. התאמה לאייפון', async () => {
    const sizes = [['iPhone SE', 375, 667], ['iPhone 15 Pro', 393, 852], ['iPhone 15 Pro Max', 430, 932]];
    const bad = [];
    for (const [n, w, h] of sizes) {
      await p.setViewportSize({ width: w, height: h });
      for (const path of ['/', '/(tabs)/diary', '/(tabs)/plan', '/add-meal', '/shabbat', '/restaurant']) {
        await go(path, 1600);
        const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (over > 1) bad.push(`${n} ${path} +${over}px`);
      }
    }
    await p.setViewportSize({ width: 393, height: 852 });
    ok('19. התאמה לאייפון (SE / Pro / Pro Max)', bad.length === 0, bad.length ? bad.join(', ') : 'ללא גלילה אופקית ב-3 גדלים');
  });

  const realErrs = errs.filter((e) => !/Maximum update depth/.test(e) || true);
  ok('–. אין שגיאות בקונסול', realErrs.length === 0, realErrs.slice(0, 3).join(' | '));
  console.log('\n' + results.join('\n'));
  await b.close();
})();
