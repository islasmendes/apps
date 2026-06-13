import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v132", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  unlockAuth();
  authUnlocked = true;
  lojaCode = "VCBRO";

  const agto = state.indicators.find(i => /agend/.test(normKpiName(i.name)));
  if (agto) {
    agto.subs = agto.subs || [];
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoReal(normKpiName(s.name)))) {
      agto.subs.push({
        id: uid(), name: "Agendamentos de HOJE?", checkin: false, checkout: true,
        metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0,
        diarioDays: [true, true, true, true, true, true, true]
      });
    }
  }
  const realCfg = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoReal)?.cfg;
  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  const sid = state.sellers[0]?.id;
  const day = diarioTodayDay();
  const fid = realCfg?.id;
  if (!fid || !sid || day == null) return { ok: false, reason: "setup" };

  const scSid = ensureSched(sid);
  scSid[day] = 1;

  const md = monthData();
  md.daily[sid] = md.daily[sid] || {};
  md.daily[sid][fid] = md.daily[sid][fid] || {};
  md.daily[sid][fid][String(day)] = { real: 9, realBy: "gestor", realAt: Date.now() - 5000 };
  gestorMergeGuard.clear();
  gestorPushInFlight.clear();

  // === simula ABA MATRIZ (Tab B) com valor gestor stale ===
  activeView = "matriz";
  renderVisaoDiaCards();
  const before = visaoDiaAgendamentoTeamToday(agCard).real;

  // === simula ABA DIÁRIO (Tab A) gestor apaga e push remove dia na nuvem ===
  const remoteAfterClear = {
    [currentMonth]: {
      daily: {
        [sid]: {
          [fid]: {}
        }
      }
    }
  };
  const merged = mergeDailyFromRemote(remoteAfterClear);
  refreshLiveDailyViews({ fieldId: fid });
  const afterFirebaseClear = visaoDiaAgendamentoTeamToday(agCard).real;
  const cellAfterFirebase = getCell(sid, fid, day).real;

  // === simula ABA DIÁRIO gestor adiciona +8 e broadcast p/ Tab B ===
  applyGestorDailyCellFromPeer(sid, fid, day, "real", 8, currentMonth, Date.now());
  refreshLiveDailyViews({ fieldId: fid });
  const afterPeerAdd = visaoDiaAgendamentoTeamToday(agCard).real;

  // === simula ABA DIÁRIO gestor apaga via peer ===
  applyGestorDailyCellFromPeer(sid, fid, day, "real", "", currentMonth, Date.now());
  refreshLiveDailyViews({ fieldId: fid });
  const afterPeerClear = visaoDiaAgendamentoTeamToday(agCard).real;

  return {
    before,
    merged,
    afterFirebaseClear,
    cellAfterFirebase,
    afterPeerAdd,
    afterPeerClear,
    ok:
      before === 9 &&
      merged === true &&
      afterFirebaseClear == null &&
      cellAfterFirebase == null &&
      afterPeerAdd === 8 &&
      afterPeerClear == null
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
