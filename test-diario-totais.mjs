import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v115", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  const sid = state.sellers[0]?.id;
  const ind = state.indicators.find(i => !i.pctOnly);
  if (!ind || !sid) return { err: "setup" };

  const openCfg = {
    id: uid(), name: "Fez a confirmação de visitas pra hoje?", checkin: true, checkout: false,
    openQuestion: true, metaDay: 2, metaSat: 0, metaSun: 0, metaMonth: 0,
    diarioDays: [true, true, true, true, true, true, true]
  };
  ind.subs = ind.subs || [];
  ind.subs.push(openCfg);

  const days = weeksOf(currentMonth)[0] || [1, 2, 3, 4, 5, 6, 7];
  const d1 = days.find(d => weekday(currentMonth, d) >= 1 && weekday(currentMonth, d) <= 5) || days[0];
  const d2 = days.find(d => d !== d1 && weekday(currentMonth, d) >= 1 && weekday(currentMonth, d) <= 5) || days[1];

  setCell(sid, openCfg.id, d1, "planYes", true);
  setCell(sid, openCfg.id, d1, "plan", 2);
  setCell(sid, openCfg.id, d1, "planJustif", "Ligação feita com cliente");
  setCell(sid, openCfg.id, d2, "planYes", true);
  setCell(sid, openCfg.id, d2, "plan", 3);
  setCell(sid, openCfg.id, d2, "planJustif", "Outra justificativa longa");

  const weekSum = diarioWeekSum(sid, openCfg, days);
  const dayTot = diarioDayTotals([sid], d1);
  const totRow = diarioTotalsRowHtml(days.slice(0, 3));

  return {
    weekSum,
    dayTot,
    hasTotalsRow: totRow.includes("Total do dia") && totRow.includes("IN ") && totRow.includes("OUT "),
    openSumOk: weekSum === 5,
    dayInOk: dayTot.in === 2,
  };
});

console.log("diario totais test:", JSON.stringify(result, null, 2));
const pass = result.openSumOk && result.dayInOk && result.hasTotalsRow;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
