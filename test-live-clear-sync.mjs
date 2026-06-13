import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v130", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  unlockAuth();
  authUnlocked = true;
  lojaCode = "VCBRO";
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
  md.daily[sid] = md.daily[sid] || {};
  md.daily[sid][fid] = md.daily[sid][fid] || {};
  md.daily[sid][fid][String(day)] = {
    real: 3,
    realBy: "consultor",
    realAt: Date.now() - 3000
  };
  const afterAdd = visaoDiaAgendamentoTeamToday(agCard).real;

  const remoteMonths = {
    [currentMonth]: {
      daily: {
        [sid]: {
          [fid]: {}
        }
      }
    }
  };
  const merged = mergeDailyFromRemote(remoteMonths);
  const afterRemoteClear = visaoDiaAgendamentoTeamToday(agCard).real;
  const cellGone = getCell(sid, fid, day).real == null || getCell(sid, fid, day).real === "";

  setCell(sid, fid, day, "real", 2);
  const afterGestorAdd = visaoDiaAgendamentoTeamToday(agCard).real;
  setCell(sid, fid, day, "real", "");
  const afterGestorClear = visaoDiaAgendamentoTeamToday(agCard).real;

  return {
    afterAdd,
    afterRemoteClear,
    afterGestorAdd,
    afterGestorClear,
    merged,
    cellGone,
    ok: afterAdd === 3 && afterRemoteClear == null && afterGestorAdd === 2 && afterGestorClear == null && merged && cellGone
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
