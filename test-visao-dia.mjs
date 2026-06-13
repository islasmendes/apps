import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v111", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  document.body.classList.remove("auth-locked");
  document.getElementById("authGate").classList.remove("show");
  state.ui.visaoDiaDismissed = null;
  activeView = "matriz";

  const agto = state.indicators.find(i => /agend/.test(normKpiName(i.name)));
  const sid = state.sellers[0].id;
  const day = diarioTodayDay();

  if (agto) {
    agto.subs = agto.subs || [];
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoProxDia(normKpiName(s.name)))) {
      agto.subs.push({ id: uid(), name: "Agendamentos p/ próx Dia", checkin: true, checkout: true, metaDay: 4, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoReal(normKpiName(s.name)))) {
      agto.subs.push({ id: uid(), name: "Agendamentos p/ HOJE?", checkin: false, checkout: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0 });
    }
  }

  const prox = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoProxDia);
  const real = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoReal);
  const prev = prevWorkedDay(sid, day);
  if (prox && prev != null) setCell(sid, prox.cfg.id, prev, "real", 5);
  if (real && day != null) setCell(sid, real.cfg.id, day, "real", 2);

  updateVisaoDiaOverlay();

  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  const vals = visaoDiaAgendamentoTeamToday(agCard);
  const agNums = document.querySelector(".visao-dia-card .vd-pr")?.textContent;

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
  };
});

console.log("visao dia test:", JSON.stringify(result, null, 2));
const ok = result.cardCount === 5
  && result.vals.plan === 5
  && result.vals.real === 2
  && result.agCard?.refPlan?.includes("próx")
  && result.agCard?.refReal?.includes("HOJE")
  && result.satActiveFri === false;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
