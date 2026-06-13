import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v108", { waitUntil: "networkidle", timeout: 60000 });

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
  const venda = state.indicators.find(i => i.role === "venda" || /vend/.test(normKpiName(i.name)));
  const sid = state.sellers[0].id;
  const day = diarioTodayDay();

  if (agto) {
    agto.subs = agto.subs || [];
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoPlan(normKpiName(s.name)))) {
      agto.subs.push({ id: uid(), name: "Agendamentos de HOJE?", checkin: true, checkout: true, openQuestion: true, metaDay: 4, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoReal(normKpiName(s.name)))) {
      agto.subs.push({ id: uid(), name: "Agendamentos de HOJE!", checkin: false, checkout: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0 });
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
  if (venda) {
    venda.subs = venda.subs || [];
    if (!venda.subs.some(s => matchVisaoDiaVendaPlan(normKpiName(s.name)))) {
      venda.subs.push({ id: uid(), name: "Vendas p/ HOJE?", checkin: true, checkout: false, metaDay: 1, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
    if (!venda.subs.some(s => matchVisaoDiaVendaReal(normKpiName(s.name)))) {
      venda.subs.push({ id: uid(), name: "Vendas de HOJE!", checkin: false, checkout: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
  }

  const agPlan = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoPlan);
  const agReal = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoReal);
  if (agPlan && day != null) {
    const md = monthData();
    md.daily[sid] = md.daily[sid] || {};
    md.daily[sid][agPlan.cfg.id] = md.daily[sid][agPlan.cfg.id] || {};
    md.daily[sid][agPlan.cfg.id][String(day)] = { planYes: true, plan: 4, planBy: "consultor", planAt: Date.now() };
  }
  if (agReal && day != null) setCell(sid, agReal.cfg.id, day, "real", 3);

  const vendReal = findVisaoDiaDiarioCfg(matchVisaoDiaVendaReal);
  if (vendReal && day != null) setCell(sid, vendReal.cfg.id, day, "real", 1);

  updateVisaoDiaOverlay();

  const refs = VISAO_DIA_CARDS.map(spec => {
    const c = resolveVisaoDiaCard(spec);
    return c ? { label: c.label, refPlan: c.refPlan, refReal: c.refReal } : null;
  }).filter(Boolean);

  const agCard = refs.find(r => r.label === "Agendamentos");
  const vendCard = refs.find(r => r.label === "Vendas");
  const cards = [...document.querySelectorAll(".visao-dia-card")];
  const agNums = cards.find(c => c.textContent.includes("Agendamentos"))?.querySelector(".vd-pr")?.textContent;

  return {
    refs,
    cardCount: refs.length,
    agCard,
    vendCard,
    agNums,
    hasVendas: !!vendCard,
    hidden: document.getElementById("matrizVisaoDia")?.hidden,
  };
});

console.log("visao dia test:", JSON.stringify(result, null, 2));
const ok = result.cardCount === 5
  && result.agCard?.refPlan?.includes("HOJE")
  && result.agCard?.refReal?.includes("HOJE")
  && result.vendCard?.refPlan?.includes("Vendas p/")
  && result.vendCard?.refReal?.includes("Vendas de")
  && result.agNums?.includes("4")
  && !result.hidden;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
