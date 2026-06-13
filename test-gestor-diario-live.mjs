import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v129", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  lojaCode = "VCBRO";
  activeView = "diario";
  const agto = state.indicators.find(i => /agend/.test(normKpiName(i.name)));
  const sid = state.sellers[0].id;
  const day = diarioTodayDay();
  if (agto) {
    agto.subs = agto.subs || [];
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoReal(normKpiName(s.name)))) {
      agto.subs.push({ id: uid(), name: "Agendamentos de HOJE?", checkin: false, checkout: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
  }
  const real = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoReal);
  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  const fid = real?.cfg?.id;
  if (!fid || day == null) return { ok: false, reason: "no field" };

  const md = monthData();
  if (md.daily[sid]?.[fid]) delete md.daily[sid][fid];
  diarioPendingOverlay.clear();
  gestorMergeGuard.clear();

  let threwOnClear = false;
  try {
    setCell(sid, fid, day, "real", 4);
  } catch (e) {
    return { ok: false, reason: "set add threw: " + e.message };
  }
  const afterGestorAdd = visaoDiaAgendamentoTeamToday(agCard).real;

  try {
    setCell(sid, fid, day, "real", "");
  } catch (e) {
    threwOnClear = true;
  }
  const afterGestorClear = visaoDiaAgendamentoTeamToday(agCard).real;
  const cellGone = !hasCellValue(getCell(sid, fid, day), "real");
  const dayPurged = !getCell(sid, fid, day).real && !md.daily[sid]?.[fid]?.[String(day)];

  return {
    afterGestorAdd,
    afterGestorClear,
    cellGone,
    dayPurged,
    threwOnClear,
    hasPruneFn: typeof pruneEmptyDailyDay === "function",
    ok: !threwOnClear && afterGestorAdd === 4 && afterGestorClear == null && cellGone && typeof pruneEmptyDailyDay === "function"
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
