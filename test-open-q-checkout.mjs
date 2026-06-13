import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v117", { waitUntil: "networkidle", timeout: 60000 });

const gestor = await page.evaluate(() => {
  authUnlocked = true;
  const sid = state.sellers[0]?.id;
  const ind = state.indicators.find(i => !i.pctOnly);
  if (!ind || !sid) return { err: "setup" };
  const cfg = {
    id: uid(), name: "Remarcou algum agdto p/ prox sab?", checkin: false, checkout: true,
    openQuestion: true, metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0, planCrossIds: [],
    diarioDays: [false, true, true, true, true, true, false]
  };
  ind.subs = ind.subs || [];
  ind.subs.push(cfg);
  const day = 10;
  const md = monthData(currentMonth);
  md.daily[sid] = md.daily[sid] || {};
  md.daily[sid][cfg.id] = md.daily[sid][cfg.id] || {};
  md.daily[sid][cfg.id][String(day)] = {
    planYes: false,
    planJustif: "Não remarquei nenhum agendamento hoje na loja",
    planBy: "consultor",
    planConfirm: true,
  };
  const needs = diarioFieldNeeds(sid, cfg, day);
  const coIds = diarioCheckoutFieldIds(sid, day);
  return {
    needs,
    checkoutOnly: openQuestionCheckoutOnly(cfg, needs),
    hasCo: hasCheckoutValue(sid, cfg, day),
    fieldOk: coIds.includes(cfg.id) && hasCheckoutValue(sid, cfg, day),
    weekVal: diarioDayFieldOutValue(sid, cfg, day),
    display: openPlanDisplay(getCell(sid, cfg.id, day)),
  };
});

await page.goto("http://127.0.0.1:8765/consultor.html?v=v117", { waitUntil: "networkidle", timeout: 60000 });
const consultor = await page.evaluate(() => {
  const sid = "x";
  const cfg = { id: "f1", openQuestion: true, checkin: false, checkout: true };
  const needs = { checkin: false, checkout: true };
  const cellNo = { planYes: false, planJustif: "Não remarquei nenhum agendamento hoje" };
  return {
    checkoutOnly: openQuestionCheckoutOnly(cfg, needs),
    completeNo: isOpenPlanComplete(cellNo),
  };
});

console.log(JSON.stringify({ gestor, consultor }, null, 2));
const pass = gestor.checkoutOnly && gestor.hasCo && gestor.fieldOk && gestor.weekVal === 0 && gestor.display.startsWith("Não") && consultor.completeNo;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
