import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v148", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  isAdmin = true;
  fbReady = true;
  lojaCode = "VCANT";
  currentMonth = "2026-06";

  const ind = state.indicators.find(i => /agend/i.test(i.name)) || state.indicators[0];
  const oldId = ind.id;
  const seller = state.sellers[0]?.id || uid();
  if (!state.sellers.length) state.sellers.push({ id: seller, name: "Teste" });
  const md = monthData(currentMonth);
  md.daily[seller] = md.daily[seller] || {};
  md.daily[seller][oldId] = { "5": { plan: 3, real: 2, planBy: "gestor", realBy: "consultor", planAt: 1, realAt: 2 } };

  mergeKpiIdHistory(state);
  const newId = uid();
  state.ui.kpiIdHistory[oldId] = ind.name;
  ind.id = newId;
  if (state.order?.indicators) {
    const oi = state.order.indicators.indexOf(oldId);
    if (oi >= 0) state.order.indicators[oi] = newId;
  }

  const remapped = remapOrphanKpiDataAggressive(state, { onlyEmpty: false });
  const cell = md.daily[seller]?.[newId]?.["5"];
  const updates = buildDailyMonthsPushUpdates("VCANT", state);
  const hasDailyPush = Object.keys(updates).some(k => /\/daily$/.test(k));
  const orphanLeft = scanOrphanedKpiData(state).filter(o => o.fieldId === oldId).length;

  const snap = JSON.parse(JSON.stringify(state));
  const dailyInSnap = dailyCellsInState(snap);
  snap.indicators[0].id = uid();
  const restored = remapOrphanKpiDataAggressive(snap, { onlyEmpty: false });

  const cellOk = !!(cell && cell.real === 2 && cell.plan === 3);
  return {
    remapped,
    cellOk,
    hasDailyPush,
    orphanLeft,
    dailyInSnap,
    restored,
    ok: remapped > 0 && cellOk && hasDailyPush && orphanLeft === 0 && dailyInSnap > 0
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
