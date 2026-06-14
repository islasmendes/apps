import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v146", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  isAdmin = true;
  fbReady = true;
  fbDb = { ref: () => ({ update: () => Promise.resolve(), once: () => Promise.resolve({ val: () => null }), on: () => {}, set: () => Promise.resolve() }) };
  lojaCode = "VCANT";
  configPushBlocked = false;
  lastPushedConfigHash = "";

  const npsId = uid();
  state.indicators.push({
    id: npsId, name: "KPI Admin Teste", abbr: "KAT", color: "#2244aa", checkin: true, checkout: true,
    pctOnly: true, lowerBetter: false, showInMatriz: true, subs: [], rates: [
      { id: uid(), name: "Taxa Teste", numId: "", denId: "", manual: true, absolute: false, showInMatriz: false }
    ]
  });
  state.order.indicators = state.order.indicators || state.indicators.map(i => i.id);
  if (!state.order.indicators.includes(npsId)) state.order.indicators.push(npsId);

  const beforeCount = state.indicators.length;
  const tplAfterAdd = extractOperationalConfig(state);
  const hasTestInTpl = tplAfterAdd.indicators.some(i => i.name === "KPI Admin Teste");

  state.indicators = state.indicators.filter(i => i.id !== npsId);
  state.order.indicators = state.order.indicators.filter(x => x !== npsId);
  afterKpiStructureChange({ silent: true });
  const reorgAt = state.ui.kpiReorgAt;
  const tplAfterDel = extractOperationalConfig(state);
  const testGoneFromTpl = !tplAfterDel.indicators.some(i => i.name === "KPI Admin Teste");

  const target = { indicators: JSON.parse(JSON.stringify(state.indicators)), order: { indicators: state.order.indicators.slice() }, ui: { kpiReorgAt: reorgAt }, sellers: state.sellers };
  const oldGuard = {
    indicators: [...target.indicators, { id: npsId, name: "KPI Admin Teste", subs: [], rates: [] }],
    order: { indicators: [...target.order.indicators, npsId] },
    ui: { kpiReorgAt: 0 },
    sellers: state.sellers
  };
  mergeLojaConfigFromSnapshot(target, oldGuard, "VCANT");
  const guardDidNotRestore = !target.indicators.some(i => i.name === "KPI Admin Teste");

  const skipMerge = shouldSkipKpiMergeFrom(oldGuard);

  return {
    beforeCount,
    afterCount: state.indicators.length,
    hasTestInTpl,
    testGoneFromTpl,
    reorgAt,
    guardDidNotRestore,
    skipMerge,
    ok: hasTestInTpl && testGoneFromTpl && reorgAt > 0 && guardDidNotRestore && skipMerge
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
