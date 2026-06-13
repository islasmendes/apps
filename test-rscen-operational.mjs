import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v136", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  divisionalCode = "RSCEN";
  lojaCode = null;
  myLojaId = null;

  const tpl = {
    v: 1,
    updatedAt: Date.now(),
    orderNames: ["Agendamento"],
    indicators: [{
      name: "Agendamento",
      abbr: "AGTO",
      color: "#4f8cff",
      checkin: true,
      checkout: true,
      subs: [{ name: "Agendamentos de HOJE?", checkin: false, checkout: true }],
      rates: []
    }]
  };
  operationalTemplateCache = JSON.parse(JSON.stringify(tpl));

  state.indicators[0].subs = state.indicators[0].subs || [];
  state.indicators[0].subs.push({
    id: "loja-only-sub",
    name: "Sub só da loja",
    checkin: true,
    checkout: true,
    metaDay: 1,
    metaSat: 0,
    metaSun: 0,
    metaMonth: 0
  });
  state.indicators.push({
    id: "loja-only-kpi",
    name: "KPI só da loja",
    color: "#f00",
    checkin: true,
    checkout: true,
    subs: [],
    rates: []
  });

  applyOperationalConfig(state, tpl, { strictTemplate: true, ignoreVersion: true });
  const filtered = filterIndicatorTreeToOperational(state.indicators);
  const matriz = matrizIndicators();
  const names = matriz.map(i => i.name);
  const ag = state.indicators.find(i => /agend/i.test(i.name));
  const extraSub = (ag?.subs || []).some(s => /só da loja/i.test(s.name));
  const extraKpi = state.indicators.some(i => /KPI só da loja/i.test(i.name));
  const tplSubOk = (ag?.subs || []).some(s => /de HOJE/i.test(s.name));

  return {
    extraSub,
    extraKpi,
    tplSubOk,
    matrizNames: names,
    filteredCount: filtered.length,
    ok: !extraSub && !extraKpi && tplSubOk && !names.some(n => /KPI só da loja/i.test(n))
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
