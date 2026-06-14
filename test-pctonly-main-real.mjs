import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v152&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  activeView = "matriz";
  matrizPeriodo = "mes";
  state.ui.period = "mes";

  const indId = uid();
  const rateId = uid();
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
      { id: rateId, name: "Respondentes", numId: "", denId: "", manual: true, absolute: true, showInMatriz: true, target: 0 },
    ],
  });
  if (!state.order.indicators) state.order.indicators = state.indicators.map(i => i.id);
  if (!state.order.indicators.includes(indId)) state.order.indicators.push(indId);

  if (!state.sellers.length) state.sellers.push({ id: uid(), name: "Vendedor Teste", active: true });
  const sellerId = state.sellers[0].id;
  const m = currentMonth;
  if (!state.months[m]) state.months[m] = { daily: {}, system: {}, systemRate: {} };
  state.months[m].system[sellerId] = { [indId]: 85 };
  state.months[m].systemRate[sellerId] = { [rateId]: 42 };

  const ind = state.indicators.find(i => i.id === indId);
  const mainCols = matrizPctOnlyMainColCount(ind, "mes");
  const { rv } = matrizPctOnlyValue([sellerId], ind, "mes");
  const fmt = matrizPctOnlyFmtValue(rv, ind);

  expandedBlocks[indId] = false;
  const collapsedCols = matrizColCount(ind, "mes");
  const { head2: headCollapsed } = matrizBuildHeaders([ind], { periodo: "mes", moveOn: false });
  const hasProjHeader = headCollapsed.includes("Proj.");

  renderMatriz();
  const blockCollapsed = document.querySelector(`[data-block="${indId}"]`);
  const colspanCollapsed = blockCollapsed ? +blockCollapsed.getAttribute("colspan") : 0;
  const rowCollapsed = document.querySelector(`#matrizTable tbody tr[data-seller="${sellerId}"]`);
  const cellsCollapsed = rowCollapsed ? rowCollapsed.querySelectorAll("td").length : 0;
  const rateVisibleCollapsed = rowCollapsed ? rowCollapsed.textContent.includes("42") : false;

  expandedBlocks[indId] = true;
  const expandedCols = matrizColCount(ind, "mes");
  renderMatriz();
  const rowExpanded = document.querySelector(`#matrizTable tbody tr[data-seller="${sellerId}"]`);
  const rateVisibleExpanded = rowExpanded ? rowExpanded.textContent.includes("42") : false;

  return {
    mainCols,
    collapsedCols,
    expandedCols,
    colspanCollapsed,
    cellsCollapsed,
    fmt,
    hasProjHeader,
    hasPctSuffix: fmt.includes("%"),
    expandable: matrizPctOnlyHasExpandableRates(ind),
    rateVisibleCollapsed,
    rateVisibleExpanded,
  };
});

console.log(JSON.stringify(result, null, 2));
const pass =
  result.mainCols === 2 &&
  result.collapsedCols === 2 &&
  result.expandedCols > result.collapsedCols &&
  result.colspanCollapsed === 2 &&
  result.hasPctSuffix &&
  result.fmt === "85%" &&
  !result.hasProjHeader &&
  result.expandable &&
  !result.rateVisibleCollapsed &&
  result.rateVisibleExpanded;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
