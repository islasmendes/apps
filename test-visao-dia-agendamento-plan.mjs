import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v157&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  currentMonth = "2026-06";
  const M = "2026-06";
  const agto = state.indicators.find(i => /agend/.test(normKpiName(i.name)));
  if (!agto) return { ok: false, reason: "no agto ind" };

  const ensureSub = (name, props) => {
    agto.subs = agto.subs || [];
    let s = agto.subs.find(x => x.name === name);
    if (!s) {
      s = { id: uid(), name, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0, ...props };
      agto.subs.push(s);
    } else Object.assign(s, props);
    normalizeDiarioDays(s);
    return s;
  };

  const prox = ensureSub("Agendamentos p/ próx Dia", {
    checkin: false, checkout: true,
    diarioDays: [false, true, true, true, true, true, false]
  });
  const domSab = ensureSub("Quantos Agendamentos p/ amanhã? (Dom)", {
    checkin: false, checkout: true,
    diarioDays: [false, false, false, false, false, false, true]
  });
  const domWeek = ensureSub("Agendamentos p/ domingo", {
    checkin: false, checkout: true,
    diarioDays: [false, true, true, true, true, true, false]
  });
  ensureSub("Agendamentos de HOJE?", {
    checkin: false, checkout: true,
    diarioDays: [true, true, true, true, true, true, true]
  });

  const card = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });

  const sched = (sid, days) => {
    const sc = ensureSched(sid);
    for (let d = 1; d <= 30; d++) sc[d] = days.includes(d) ? 1 : 0;
  };

  const s1 = state.sellers[0]?.id || uid();
  const s2 = state.sellers[1]?.id || uid();
  if (!state.sellers[0]) state.sellers.push({ id: s1, name: "Islas" });
  if (!state.sellers[1]) state.sellers.push({ id: s2, name: "Ana" });

  // Jun/2026: 13=sáb, 14=dom, 15=seg, 16=ter
  const SAT = 13, SUN = 14, MON = 15, TUE = 16;

  // 1) Domingo: checkout sábado (Dom) = 10
  sched(s1, [SAT, SUN]);
  setCell(s1, domSab.id, SAT, "real", 10);
  const sunPlanSat = visaoDiaAgendamentoTeamToday(card, SUN).plan;

  // 2) Domingo fallback: folga sáb, Σ seg–sex p/ domingo = 2
  const sDomFb = uid();
  state.sellers.push({ id: sDomFb, name: "FolgaSab" });
  sched(sDomFb, [8, 10, SUN]);
  setCell(sDomFb, domWeek.id, 8, "real", 1);
  setCell(sDomFb, domWeek.id, 10, "real", 1);
  const sunPlanFb = visaoDiaAgendamentoPlanForSeller(sDomFb, SUN, card, M);

  // 3) Terça: próx Dia de segunda = 6
  sched(s1, [MON, TUE]);
  setCell(s1, prox.id, MON, "real", 6);
  const tuePlan = visaoDiaAgendamentoTeamToday(card, TUE).plan;

  // 4) Terça: folga ter — próx de seg aponta qua, não entra no plano de ter
  sched(s2, [MON, TUE + 1]); // seg + qua
  setCell(s2, prox.id, MON, "real", 99);
  const tuePlanExclude = visaoDiaAgendamentoTeamToday(card, TUE).plan;

  // Diário: sub (Dom) só sáb + trabalha domingo
  const sDomDiario = uid();
  state.sellers.push({ id: sDomDiario, name: "DomDiario" });
  sched(sDomDiario, [SAT, SUN]);
  sched(s2, [SAT]);
  const domSabSatOk = diarioFieldNeeds(sDomDiario, domSab, SAT, M);
  const domSabSunHide = diarioFieldNeeds(sDomDiario, domSab, SUN, M);
  const domSabNoSun = diarioFieldNeeds(s2, domSab, SAT, M);

  // 5) Segunda: não trabalhou dom + próx sáb → seg (folga dom)
  const sMonA = uid();
  state.sellers.push({ id: sMonA, name: "SegA" });
  sched(sMonA, [FRI = 12, SAT, MON]);
  setCell(sMonA, prox.id, SAT, "real", 3);
  const monPlanA = visaoDiaAgendamentoPlanForSeller(sMonA, MON, card, M);

  // 6) Segunda: trabalhou dom, próx dom → seg
  const sMonB = uid();
  state.sellers.push({ id: sMonB, name: "SegB" });
  sched(sMonB, [SUN, MON]);
  setCell(sMonB, prox.id, SUN, "real", 4);
  const monPlanB = visaoDiaAgendamentoPlanForSeller(sMonB, MON, card, M);

  // 7) Segunda: trabalhou dom, folga seg — próx dom → ter (não conta na seg)
  const sMonC = uid();
  state.sellers.push({ id: sMonC, name: "SegC" });
  sched(sMonC, [SUN, TUE]);
  setCell(sMonC, prox.id, SUN, "real", 50);
  const monPlanIslasOff = visaoDiaAgendamentoPlanForSeller(sMonC, MON, card, M);

  return {
    cardIds: { prox: card.proxId, domSab: card.domSabId, domWeek: card.domingoWeekId },
    sunPlanSat,
    sunPlanFb,
    tuePlan,
    tuePlanExclude,
    monPlanA,
    monPlanB,
    monPlanIslasOff,
    domSabSatOk,
    domSabSunHide,
    domSabNoSun,
    nextWorked: nextWorkedDay(s1, SUN, M),
    ok:
      card.domSabId && card.domingoWeekId
      && sunPlanSat === 10
      && sunPlanFb === 2
      && tuePlan === 6
      && tuePlanExclude === 6
      && monPlanA === 3
      && monPlanB === 4
      && monPlanIslasOff == null
      && domSabSatOk.checkout === true
      && domSabSunHide.checkout === false
      && domSabNoSun.checkout === false
      && nextWorkedDay(sMonC, SUN, M) === TUE
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
