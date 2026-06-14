import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v157&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  document.body.classList.remove("auth-locked");
  document.getElementById("authGate").classList.remove("show");
  state.ui.visaoDiaDismissed = null;
  activeView = "matriz";

  currentMonth = "2026-06";
  const day = 16;
  const agto = state.indicators.find(i => /agend/.test(normKpiName(i.name)));
  const sid = state.sellers[0].id;

  if (agto) {
    agto.subs = agto.subs || [];
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoProxDia(normKpiName(s.name)))) {
      agto.subs.push({ id: uid(), name: "Agendamentos p/ próx Dia", checkin: true, checkout: true, metaDay: 4, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoReal(normKpiName(s.name)))) {
      agto.subs.push({ id: uid(), name: "Agendamentos de HOJE?", checkin: false, checkout: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
  }

  const prox = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoProxDia);
  const real = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoReal);
  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  const scSid = ensureSched(sid);
  scSid[day] = 1;
  scSid[day - 1] = 1;
  if (prox) setCell(sid, prox.cfg.id, day - 1, "real", 5);
  let clearSubtractOk = true;
  if (real) {
    setCell(sid, real.cfg.id, day, "real", 2);
    const afterAdd = visaoDiaAgendamentoTeamToday(agCard, day).real;
    setCell(sid, real.cfg.id, day, "real", "");
    const afterClear = visaoDiaAgendamentoTeamToday(agCard, day).real;
    clearSubtractOk = afterAdd === 2 && afterClear == null;
    setCell(sid, real.cfg.id, day, "real", 2);
  }

  // Folga hoje: plano deve vir do checkout prox dia do último dia trabalhado
  const folgaSid = state.sellers[1]?.id || sid;
  const sc = ensureSched(folgaSid);
  sc[day] = 0;
  sc[day - 1] = 1;
  const folgaProxVal = 7;
  if (prox) setCell(folgaSid, prox.cfg.id, day - 1, "real", folgaProxVal);

  updateVisaoDiaOverlay();

  const vals = visaoDiaAgendamentoTeamToday(agCard, day);
  const agNums = document.querySelector(".visao-dia-card .vd-trio")?.textContent;
  const folgaOnScaleToday = sellerWorks(folgaSid, day);
  const folgaInPlanPool = visaoDiaAgendamentoPlanSellers(day).some(s => s.id === folgaSid);
  const folgaPlanToday = visaoDiaAgendamentoPlanForSeller(folgaSid, day, agCard);

  // Realizado: checkout no sub "de HOJE!" quando realId aponta para o pai
  let parentRealTest = null;
  if (agto && real) {
    const coSub = agto.subs?.find(s => /de hoje/i.test(s.name) && s.name.includes("!"));
    if (coSub) {
      setCell(sid, coSub.id, day, "real", 9);
      parentRealTest = visaoDiaDayRealValue(sid, agto.id, day);
    }
  }

  const satSub = { id: uid(), name: "Agendamento p/ sábado", checkin: true, checkout: false, diarioDays: [false, false, false, false, false, false, true] };
  normalizeDiarioDays(satSub);
  const fri = day > 1 ? day - 1 : null;
  const friWd = fri ? weekday(currentMonth, fri) : null;
  const satActiveFri = fri != null ? cfgActiveOnWeekday(satSub, fri) : null;

  return {
    agCard,
    vals,
    agNums,
    proxName: prox?.cfg.name,
    realName: real?.cfg.name,
    satActiveFri,
    friWd,
    cardCount: VISAO_DIA_CARDS.length,
    folgaOnScaleToday,
    folgaInPlanPool,
    folgaPlanToday,
    expectedPlan: 5,
    parentRealTest,
    clearSubtractOk,
  };
});

console.log("visao dia test:", JSON.stringify(result, null, 2));
const ok = result.cardCount === 5
  && result.vals.plan === result.expectedPlan
  && result.vals.real === 2
  && (result.parentRealTest == null || result.parentRealTest === 9)
  && result.agCard?.refPlan?.includes("Programação")
  && result.agCard?.refReal?.includes("HOJE")
  && result.satActiveFri === false
  && result.folgaOnScaleToday === false
  && result.folgaPlanToday == null
  && result.clearSubtractOk === true;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
