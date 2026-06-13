import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));

await page.goto("http://127.0.0.1:8765/index.html?v=v130", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(async () => {
  const log = [];
  unlockAuth();
  authUnlocked = true;
  lojaCode = "VCBRO";
  fbReady = false; // offline — só fluxo local gestor

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

  if (!fid || !sid || day == null) return { ok: false, reason: "missing setup", fid, sid, day };

  // limpa dados do dia
  const md = monthData();
  if (md.daily[sid]?.[fid]) delete md.daily[sid][fid];
  diarioPendingOverlay.clear();
  gestorMergeGuard.clear();

  diarioSeller = sid;
  activeView = "diario";
  showView("diario");
  renderDiario();

  const sel = `#diarioTable input.checkout-cell[data-field="${fid}"][data-day="${day}"]`;
  const inp = document.querySelector(sel);
  if (!inp) return { ok: false, reason: "no checkout input", sel, day, fid };

  function visaoRealDom() {
    const cards = document.querySelectorAll("#visaoDiaCards .visao-dia-card");
    for (const card of cards) {
      if (/agendamento/i.test(card.querySelector(".vd-label")?.textContent || "")) {
        return card.querySelector(".vd-real")?.textContent?.trim() ?? null;
      }
    }
    return null;
  }

  function visaoRealCalc() {
    return visaoDiaAgendamentoTeamToday(agCard).real;
  }

  function weekSumDom() {
    const cell = document.querySelector(`#diarioTable [data-sum-loja="${fid}"]`);
    return cell?.textContent?.replace(/\s+/g, " ").trim() ?? null;
  }

  function weekSumCalc() {
    const days = weeksOf(currentMonth)[diarioWeekIdx] || [];
    return diarioLojaWeek(realCfg, days).real;
  }

  // --- simula digitação gestor: add ---
  inp.focus();
  inp.value = "5";
  inp.dispatchEvent(new Event("input", { bubbles: true }));
  const afterAddCalc = visaoRealCalc();
  const afterAddDom = visaoRealDom();
  const afterAddWeek = weekSumCalc();
  const afterAddWeekDom = weekSumDom();
  log.push({ step: "add", calc: afterAddCalc, dom: afterAddDom, week: afterAddWeek, weekDom: afterAddWeekDom });

  // --- simula apagar gestor ---
  inp.value = "";
  inp.dispatchEvent(new Event("input", { bubbles: true }));
  const afterClearCalc = visaoRealCalc();
  const afterClearDom = visaoRealDom();
  const afterClearWeek = weekSumCalc();
  const afterClearWeekDom = weekSumDom();
  const cellVal = getCell(sid, fid, day).real;
  log.push({ step: "clear", calc: afterClearCalc, dom: afterClearDom, week: afterClearWeek, weekDom: afterClearWeekDom, cellVal });

  // --- simula merge remoto com valor antigo (como se Firebase atrasasse) ---
  const staleRemote = {
    [currentMonth]: {
      daily: {
        [sid]: {
          [fid]: {
            [String(day)]: { real: 5, realBy: "gestor", realAt: Date.now() - 5000 }
          }
        }
      }
    }
  };
  mergeDailyFromRemote(staleRemote);
  const afterStaleMergeCalc = visaoRealCalc();
  const afterStaleMergeDom = visaoRealDom();
  log.push({ step: "staleMerge", calc: afterStaleMergeCalc, dom: afterStaleMergeDom, guarded: isGestorMergeGuarded(sid, fid, day) });

  // --- matriz semana ---
  matrizPeriodo = "semana";
  renderMatriz();
  const matrizText = document.getElementById("matrizTable")?.textContent || "";

  const ok =
    afterAddCalc === 5 && afterAddDom === "5" &&
    afterClearCalc == null && (afterClearDom === "0" || afterClearDom === null) &&
    cellVal == null &&
    afterStaleMergeCalc == null && // guard deve bloquear ressuscitar
    !matrizText.includes("undefined");

  return { ok, log, inpReadonly: inp.readOnly, errors: [] };
});

result.pageErrors = errors;
console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
