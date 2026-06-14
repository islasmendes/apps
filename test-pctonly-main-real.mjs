import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v151&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  activeView = "matriz";
  matrizPeriodo = "mes";
  state.ui.period = "mes";

  const indId = uid();
  state.indicators.push({
    id: indId,
    name: "NPS Main Test",
    abbr: "NPM",
    color: "#f472b6",
    checkin: false,
    checkout: false,
    role: "",
    pctOnly: true,
    showInMatriz: true,
    target: 85,
    metaDay: 0,
    metaSat: 0,
    metaMonth: 0,
    subs: [],
    rates: [
      { id: uid(), name: "%Taxa", numId: "", denId: "", manual: true, absolute: false, showInMatriz: true, target: 0 },
      { id: uid(), name: "%Resp", numId: "", denId: "", manual: true, absolute: false, showInMatriz: true, target: 0 },
    ],
  });
  if (!state.order.indicators) state.order.indicators = state.indicators.map(i => i.id);
  if (!state.order.indicators.includes(indId)) state.order.indicators.push(indId);

  if (!state.sellers.length) state.sellers.push({ id: uid(), name: "Vendedor Teste", active: true });
  const sellerId = state.sellers[0].id;
  const m = currentMonth;
  if (!state.months[m]) state.months[m] = { daily: {}, system: {}, systemRate: {} };
  state.months[m].system[sellerId] = state.months[m].system[sellerId] || {};
  state.months[m].system[sellerId][indId] = 85;

  const ind = state.indicators.find(i => i.id === indId);
  expandedBlocks[indId] = false;
  const collapsedCols = matrizColCount(ind, "mes");
  const collapsedMain = matrizPctOnlyMainColCount(ind, "mes");
  const { rv } = matrizPctOnlyValue([sellerId], ind, "mes");
  const fmt = matrizPctOnlyFmtValue(rv, ind);

  renderMatriz();
  const block = document.querySelector(`[data-block="${indId}"]`);
  const colspan = block ? +block.getAttribute("colspan") : 0;
  const row = document.querySelector(`#matrizTable tbody tr[data-seller="${sellerId}"]`);
  const cells = row ? [...row.querySelectorAll("td")].map(td => td.textContent.trim()) : [];

  const cfgHtml = metaGoalsPctOnlyHtml(ind, indId);
  const hasAlvoCfg = cfgHtml.includes("alvo %");

  expandedBlocks[indId] = true;
  const expandedCols = matrizColCount(ind, "mes");

  return {
    collapsedCols,
    collapsedMain,
    expandedCols,
    colspan,
    fmt,
    hasAlvoCfg,
    hasPctSuffix: fmt.includes("%"),
    cellsSample: cells.slice(-6),
  };
});

console.log(JSON.stringify(result, null, 2));
const pass =
  result.collapsedMain === 3 &&
  result.collapsedCols === 3 &&
  result.expandedCols > result.collapsedCols &&
  result.colspan === 3 &&
  result.hasPctSuffix &&
  result.fmt === "85%" &&
  result.hasAlvoCfg;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
