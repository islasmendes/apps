import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v154&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  matrizPeriodo = "mes";
  state.ui.period = "mes";

  const sellerId = state.sellers[0]?.id || uid();
  if (!state.sellers.length) state.sellers.push({ id: sellerId, name: "Teste", active: true });

  const nps = state.indicators.find(i => i.pctOnly || i.name === "NPS");
  const agto = state.indicators.find(i => i.name === "Agendamento");
  const m = currentMonth;
  state.months[m] = state.months[m] || { daily: {}, system: {}, systemRate: {} };
  state.months[m].system[sellerId] = state.months[m].system[sellerId] || {};
  if (nps) state.months[m].system[sellerId][nps.id] = 85;
  if (agto) state.months[m].system[sellerId][agto.id] = 10;

  const allFields = acuracidadeFieldList();
  const hasNps = allFields.some(f => f.id === nps?.id);
  const hasAgto = allFields.some(f => f.id === agto?.id);
  const visible = acuracidadeVisibleFields([{ id: sellerId }], allFields, monthDays());
  const npsVisible = visible.some(f => f.id === nps?.id);
  const agtoVisible = visible.some(f => f.id === agto?.id);

  renderAcuracidade();
  const headText = document.getElementById("acuracidadeTable")?.querySelector("thead")?.textContent || "";

  return {
    npsCheckout: !!nps?.checkout,
    npsPctOnly: !!nps?.pctOnly,
    hasNpsInList: hasNps,
    hasAgtoInList: hasAgto,
    npsVisible,
    agtoVisible,
    headHasNps: /NPS/i.test(headText),
    headHasAgto: /AGENDAMENTO/i.test(headText),
    fieldCount: allFields.length,
  };
});

console.log(JSON.stringify(result, null, 2));
const pass =
  result.npsPctOnly &&
  !result.npsCheckout &&
  !result.hasNpsInList &&
  !result.npsVisible &&
  !result.headHasNps &&
  result.hasAgtoInList &&
  result.agtoVisible &&
  result.headHasAgto;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
