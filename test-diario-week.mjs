import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v138", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  lojaCode = "VCBRO";
  activeView = "diario";
  state.ui.view = "diario";
  diarioEnsureCurrentWeek();
  const start = diarioWeekIdx;

  renderDiario();
  const afterRenderSame = diarioWeekIdx;

  diarioWeekIdx = start === 0 ? 1 : 0;
  state.ui.diarioWeek = diarioWeekIdx;
  renderDiario();
  const afterManualPick = diarioWeekIdx;

  showView("matriz");
  showView("diario");
  const afterReenter = diarioWeekIdx;

  return {
    start,
    afterRenderSame,
    afterManualPick,
    afterReenter,
    currentWeek: currentWeekIndex(),
    ok:
      afterRenderSame === start &&
      afterManualPick !== start &&
      afterReenter === currentWeekIndex()
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
