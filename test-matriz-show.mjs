import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v120", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  const ind = state.indicators.find(i => !i.pctOnly);
  if (!ind) return { err: "no ind" };

  ind.showInMatriz = false;
  persistMatrizShowUi(state);

  const tpl = extractOperationalConfig(state);
  tpl.indicators.find(x => x.name === ind.name).showInMatriz = true;
  tpl.updatedAt = Date.now();

  const st = JSON.parse(JSON.stringify(state));
  applyOperationalConfig(st, tpl, { ignoreVersion: true });

  const afterInd = st.indicators.find(i => i.id === ind.id);
  return {
    uiFalse: state.ui.matrizShow[ind.id] === false,
    afterShow: afterInd?.showInMatriz,
    cfgShow: cfgShowInMatriz(afterInd),
    uiKept: st.ui.matrizShow[ind.id] === false,
  };
});

console.log(JSON.stringify(result, null, 2));
const pass = result.uiFalse && result.afterShow === false && result.cfgShow === false && result.uiKept;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
