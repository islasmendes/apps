import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v148", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  isAdmin = true;
  fbReady = true;
  fbDb = { ref: () => ({ update: () => Promise.resolve(), once: () => Promise.resolve({ val: () => null }), on: () => {}, set: () => Promise.resolve() }) };
  lojaCode = "VCANT";
  configPushBlocked = false;
  lastPushedConfigHash = "";
  pendingKpiAdminPush = false;

  const testId = uid();
  state.indicators.push({
    id: testId, name: "KPI Admin Teste", abbr: "KAT", color: "#2244aa", checkin: true, checkout: true,
    pctOnly: true, lowerBetter: false, showInMatriz: true, subs: [], rates: [
      { id: uid(), name: "Taxa Teste", numId: "", denId: "", manual: true, absolute: false, showInMatriz: false }
    ]
  });
  state.order.indicators = state.order.indicators || state.indicators.map(i => i.id);
  if (!state.order.indicators.includes(testId)) state.order.indicators.push(testId);

  const tplAfterAdd = extractOperationalConfig(state);
  const hasTestInTpl = tplAfterAdd.indicators.some(i => i.name === "KPI Admin Teste");

  state.indicators = state.indicators.filter(i => i.id !== testId);
  state.order.indicators = state.order.indicators.filter(x => x !== testId);
  afterKpiStructureChange({ silent: true });
  const reorgAt = state.ui.kpiReorgAt;
  const tplAfterDel = extractOperationalConfig(state);
  const testGoneFromTpl = !tplAfterDel.indicators.some(i => i.name === "KPI Admin Teste");

  const target = {
    indicators: JSON.parse(JSON.stringify(state.indicators)),
    order: { indicators: state.order.indicators.slice() },
    ui: { kpiReorgAt: reorgAt },
    sellers: state.sellers
  };
  const staleBackup = {
    indicators: [...target.indicators, { id: testId, name: "KPI Admin Teste", subs: [], rates: [] }],
    order: { indicators: [...target.order.indicators, testId] },
    ui: { kpiReorgAt: 0 },
    sellers: state.sellers
  };
  mergeLojaPrefsFromSnapshot(target, staleBackup, "VCANT");
  const guardDidNotRestore = !target.indicators.some(i => i.name === "KPI Admin Teste");

  const cloudAfterDelete = JSON.parse(JSON.stringify(target));
  const pullWinner = preferKpiAuthoritativeState(cloudAfterDelete, staleBackup);
  const pullPicksCloud = pullWinner === cloudAfterDelete;

  const healed = (() => {
    const tpl = { v: 1, indicators: staleBackup.indicators.map(i => ({ name: i.name, subs: [], rates: [] })), orderNames: staleBackup.indicators.map(i => i.name), updatedAt: 1 };
    return maybeHealOperationalTemplateFromState(tpl);
  })();

  const best = bestLocalSnapForLoja("VCANT", cloudAfterDelete, staleBackup);
  const bestIsAuthoritative = !best?.indicators?.some(i => i.name === "KPI Admin Teste") && localKpiReorgAt(best) >= reorgAt;

  return {
    hasTestInTpl,
    testGoneFromTpl,
    reorgAt,
    guardDidNotRestore,
    pullPicksCloud,
    healed,
    bestIsAuthoritative,
    ok: hasTestInTpl && testGoneFromTpl && reorgAt > 0 && guardDidNotRestore && pullPicksCloud && healed && bestIsAuthoritative
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
