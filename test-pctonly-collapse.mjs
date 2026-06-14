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
  state.indicators.push({
    id: indId,
    name: "NPS Teste",
    abbr: "NPST",
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
      { id: uid(), name: "%Taxa", numId: "", denId: "", manual: true, absolute: false, showInMatriz: true, target: 85 },
      { id: uid(), name: "%Resp", numId: "", denId: "", manual: true, absolute: false, showInMatriz: true, target: 0 },
      { id: uid(), name: "Oport.", numId: "", denId: "", manual: true, absolute: true, showInMatriz: true, target: 0 },
    ],
  });
  if (!state.order.indicators) state.order.indicators = state.indicators.map(i => i.id);
  if (!state.order.indicators.includes(indId)) state.order.indicators.push(indId);

  if (!state.sellers.length) {
    state.sellers.push({ id: uid(), name: "Vendedor Teste", active: true });
  }
  const sellerId = state.sellers[0].id;
  const m = currentMonth;
  if (!state.months[m]) state.months[m] = { daily: {}, system: {}, systemRate: {} };
  state.months[m].system[sellerId] = { [indId]: 85 };

  function colCount(expanded) {
    expandedBlocks[indId] = expanded ? true : false;
    const ind = state.indicators.find(i => i.id === indId);
    return matrizColCount(ind, "mes");
  }

  function headerCols(expanded) {
    expandedBlocks[indId] = expanded ? true : false;
    const inds = matrizIndicators().filter(i => i.id === indId);
    const { head2 } = matrizBuildHeaders(inds, { periodo: "mes", moveOn: false });
    return (head2.match(/<th/g) || []).length;
  }

  const ind = state.indicators.find(i => i.id === indId);
  const mainCols = matrizPctOnlyMainColCount(ind, "mes");
  const collapsedCols = colCount(false);
  const expandedCols = colCount(true);
  const collapsedSubHeaders = headerCols(false);
  const expandedSubHeaders = headerCols(true);
  const expandable = matrizPctOnlyHasExpandableRates(ind);

  expandedBlocks[indId] = false;
  renderMatriz();
  const blockCollapsed = document.querySelector(`[data-block="${indId}"]`);
  const toggleCollapsed = blockCollapsed ? blockCollapsed.querySelector(".block-toggle")?.textContent?.trim() : "";
  const colspanWhenCollapsed = blockCollapsed ? +blockCollapsed.getAttribute("colspan") : 0;

  expandedBlocks[indId] = true;
  renderMatriz();
  const blockExpanded = document.querySelector(`[data-block="${indId}"]`);
  const toggleExpanded = blockExpanded ? blockExpanded.querySelector(".block-toggle")?.textContent?.trim() : "";
  const colspanWhenExpanded = blockExpanded ? +blockExpanded.getAttribute("colspan") : 0;

  return {
    expandable,
    mainCols,
    collapsedCols,
    expandedCols,
    collapsedSubHeaders,
    expandedSubHeaders,
    toggleCollapsed,
    toggleExpanded,
    colspanWhenCollapsed,
    colspanWhenExpanded,
  };
});

console.log(JSON.stringify(result, null, 2));
const pass =
  result.expandable &&
  result.mainCols === 2 &&
  result.collapsedCols === 2 &&
  result.expandedCols > result.collapsedCols &&
  result.collapsedSubHeaders === 2 &&
  result.expandedSubHeaders > result.collapsedSubHeaders &&
  result.toggleCollapsed === "▸" &&
  result.toggleExpanded === "▾" &&
  result.colspanWhenCollapsed === 2 &&
  result.colspanWhenExpanded > result.colspanWhenCollapsed;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
