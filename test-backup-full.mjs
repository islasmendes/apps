import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v153&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(async () => {
  authUnlocked = true;
  lojaCode = "VCANT";
  state.storeName = "VCANT";
  stampPersistLoja(state, "VCANT");

  const markerId = uid();
  const markerSeller = uid();
  state.sellers.push({ id: markerSeller, name: "BackupMarker", active: true, matricula: "999" });
  const ind = state.indicators.find(i => i.name === "NPS") || state.indicators[0];
  const m = currentMonth;
  state.months[m] = state.months[m] || { daily: {}, system: {}, systemRate: {} };
  state.months[m].system[markerSeller] = { [ind.id]: 77 };
  state.months[m].daily[markerSeller] = {};
  state.months[m].daily[markerSeller][state.indicators.find(i => !i.pctOnly)?.id || ind.id] = {
    1: { plan: 3, real: 2 },
    2: { plan: 4, real: 4 },
  };
  if (ind.pctOnly) ind.target = 85;

  const LOJA_BACKUP_MAX_REF = 15;
  const created = [];
  for (let i = 0; i < LOJA_BACKUP_MAX_REF; i++) {
    const e = saveVersionedLojaBackup(state, "VCANT", "fill-" + i, { force: true });
    if (!e) return { err: "fill-failed-at-" + i, i, list: listLojaVersionedBackups("VCANT").length };
    created.push(e.id);
    if (i < LOJA_BACKUP_MAX_REF - 1) await new Promise(r => setTimeout(r, 2));
  }
  const fullCount = listLojaVersionedBackups("VCANT").length;

  const manual = saveVersionedLojaBackup(state, "VCANT", "manual", { force: true });
  if (!manual) return { err: "manual-failed", fullCount };

  const afterManual = listLojaVersionedBackups("VCANT");
  const loadedBefore = loadLojaVersionedBackup("VCANT", manual.id);
  const markerBefore = loadedBefore?.sellers?.find(s => s.id === markerSeller)?.name;
  const sysBefore = loadedBefore?.months?.[m]?.system?.[markerSeller]?.[ind.id];
  const dailyBefore = dailyCellsInState(loadedBefore);

  state.sellers = state.sellers.filter(s => s.id !== markerSeller);
  delete state.months[m].system[markerSeller];
  delete state.months[m].daily[markerSeller];

  const snap = loadLojaVersionedBackup("VCANT", manual.id);
  if (!snap || !snapMatchesLoja(snap, "VCANT")) return { err: "invalid-snap" };
  saveVersionedLojaBackup(state, "VCANT", "pre-restore", { force: true });
  state = migrate(JSON.parse(JSON.stringify(snap)));
  applyLojaIdentity("VCANT", state.storeName);
  persistLocalState(state, "VCANT");

  const markerAfter = state.sellers.find(s => s.id === markerSeller)?.name;
  const sysAfter = state.months[m]?.system?.[markerSeller]?.[ind.id];
  const dailyAfter = dailyCellsInState(state);
  const targetAfter = state.indicators.find(i => i.id === ind.id)?.target;

  return {
    fullCount,
    afterManualCount: afterManual.length,
    manualId: manual.id,
    manualReason: manual.reason,
    markerBefore,
    markerAfter,
    sysBefore,
    sysAfter,
    dailyBefore,
    dailyAfter,
    targetAfter,
    maxOk: afterManual.length <= LOJA_BACKUP_MAX_REF,
  };
});

console.log(JSON.stringify(result, null, 2));
const pass =
  !result.err &&
  result.fullCount === 15 &&
  result.afterManualCount === 15 &&
  result.maxOk &&
  result.markerBefore === "BackupMarker" &&
  result.markerAfter === "BackupMarker" &&
  result.sysBefore === 77 &&
  result.sysAfter === 77 &&
  result.dailyBefore >= 2 &&
  result.dailyAfter >= 2 &&
  result.targetAfter === 85;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
