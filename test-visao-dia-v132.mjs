import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v134", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  unlockAuth();
  authUnlocked = true;
  const day = diarioTodayDay();
  const sid = state.sellers[0]?.id;
  const sid2 = state.sellers[1]?.id || sid;
  const sid3 = state.sellers[2]?.id;
  if (day == null || !sid) return { ok: false, reason: "no day" };

  const sc1 = ensureSched(sid);
  sc1[day] = 1;
  const sc2 = ensureSched(sid2);
  sc2[day] = 0;

  // CV sem registro explícito na escala: sellerWorks usa padrão do dia (inclui no pool)
  if (sid3) {
    const md = monthData();
    if (md.sched?.[sid3]) delete md.sched[sid3];
  }

  const pool = visaoDiaSellersToday();
  const st = visaoDiaTeamStats();
  const activeOk = pool.some(s => s.id === sid) && st.active === pool.length && st.active >= 1;
  const folgaExcluded = !pool.some(s => s.id === sid2);
  const defaultSchedIncluded = sid3 ? pool.some(s => s.id === sid3) && sellerWorks(sid3, day) : true;

  writeFech(day, "aR", 60);
  const sys = visaoDiaCardSistemaValue({ label: "Agendamentos" });

  renderVisaoDiaTeamBar();
  renderVisaoDiaCards();
  const bar = document.getElementById("visaoDiaTeamBar")?.textContent || "";
  const card = document.querySelector(".visao-dia-card .vd-pr")?.textContent || "";
  const hasChecksCompleto = /Check's completo/i.test(bar);
  const hasTrio = card.includes("/") && document.querySelector(".vd-sys");

  return {
    activeOk,
    folgaExcluded,
    defaultSchedIncluded,
    sys,
    hasChecksCompleto,
    hasTrio,
    bothTip: st.tips.both,
    ok: activeOk && folgaExcluded && defaultSchedIncluded && sys === 60 && hasChecksCompleto && hasTrio
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
