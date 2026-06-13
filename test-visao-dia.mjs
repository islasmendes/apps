import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v106", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  document.body.classList.remove("auth-locked");
  document.getElementById("authGate").classList.remove("show");
  state.ui.visaoDiaDismissed = null;
  activeView = "matriz";

  const agto = state.indicators.find(i => /agend/.test(normKpiName(i.name)));
  const comp = state.indicators.find(i => /compar/.test(normKpiName(i.name)));
  const fich = state.indicators.find(i => i.role === "fichas" || /fich|financ/.test(normKpiName(i.name)));
  const troca = state.indicators.find(i => /troca/.test(normKpiName(i.name)));
  const sid = state.sellers[0].id;
  const day = diarioTodayDay();

  if (agto) {
    agto.subs = agto.subs || [];
    if (!agto.subs.some(s => matchVisaoDiaAgendamento(normKpiName(s.name)))) {
      const subId = uid();
      agto.subs.push({ id: subId, name: "Agendamentos de HOJE?", checkin: true, checkout: true, metaDay: 4, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
  }
  if (comp) {
    comp.subs = comp.subs || [];
    if (!comp.subs.some(s => matchVisaoDiaConfirmacao(normKpiName(s.name)))) {
      comp.subs.push({ id: uid(), name: "Fez a confirmação de visitas pra hoje?", checkin: true, checkout: false, metaDay: 2, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
    if (!comp.subs.some(s => matchVisaoDiaComparecimentoReal(normKpiName(s.name)))) {
      comp.subs.push({ id: uid(), name: "Comparecimento de HOJE?", checkin: false, checkout: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
  }
  if (fich) {
    fich.subs = fich.subs || [];
    if (!fich.subs.some(s => matchVisaoDiaFichaPlan(normKpiName(s.name)))) {
      fich.subs.push({ id: uid(), name: "Fichas De Financiamento p/ HOJE!", checkin: true, checkout: false, metaDay: 1, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
    if (!fich.subs.some(s => matchVisaoDiaFichaReal(normKpiName(s.name)))) {
      fich.subs.push({ id: uid(), name: "Fichas De Financiamento de HOJE!", checkin: false, checkout: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
  }
  if (troca) {
    troca.subs = troca.subs || [];
    if (!troca.subs.some(s => matchVisaoDiaTrocaPlan(normKpiName(s.name)))) {
      troca.subs.push({ id: uid(), name: "Carros de Troca p/ HOJE!", checkin: true, checkout: false, metaDay: 1, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
    if (!troca.subs.some(s => matchVisaoDiaTrocaReal(normKpiName(s.name)))) {
      troca.subs.push({ id: uid(), name: "Carros de Troca de HOJE!", checkin: false, checkout: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
  }

  const agSub = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamento);
  const planId = agSub?.cfg.id;
  if (planId && day != null) setCell(sid, planId, day, "plan", 4);

  updateVisaoDiaOverlay();

  const cardsHtml = document.getElementById("visaoDiaCards")?.innerHTML || "";
  const refs = VISAO_DIA_CARDS.map(spec => {
    const c = resolveVisaoDiaCard(spec);
    return c ? { label: c.label, refPlan: c.refPlan, refReal: c.refReal } : null;
  }).filter(Boolean);

  const compCard = refs.find(r => r.label === "Comparecimento");
  const compOk = compCard?.refPlan?.includes("confirma") && compCard?.refReal?.includes("Comparecimento");

  return {
    refs,
    compOk,
    planText: document.querySelector(".vd-plan")?.textContent,
    hasProj: cardsHtml.includes("vd-proj"),
    hasCards: cardsHtml.includes("vd-plan"),
    teamBar: document.getElementById("visaoDiaTeamBar")?.textContent,
    hidden: document.getElementById("matrizVisaoDia")?.hidden,
  };
});

console.log("visao dia test:", JSON.stringify(result, null, 2));
const ok = result.hasCards && result.planText === "4" && result.refs.length === 4 && result.compOk && !result.hidden;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
