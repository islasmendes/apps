import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v120", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  const ind = state.indicators.find(i => !i.pctOnly && i.checkin && i.checkout);
  const sub = ind?.subs?.find(s => s.checkout) || null;
  if (!ind) return { err: "no ind" };

  ind.checkout = false;
  if (sub) sub.checkout = false;
  persistKpiTogglesUi(state);

  const tpl = extractOperationalConfig(state);
  const tplInd = tpl.indicators.find(x => x.name === ind.name);
  tplInd.checkout = true;
  if (sub) {
    const tplSub = tplInd.subs.find(x => x.name === sub.name);
    if (tplSub) tplSub.checkout = true;
  }
  tpl.updatedAt = Date.now();

  const st = JSON.parse(JSON.stringify(state));
  const localSnap = JSON.parse(JSON.stringify(state));
  applyOperationalConfig(st, tpl, { ignoreVersion: true });
  mergeKpiTogglesFromLocalState(st, localSnap);
  applyKpiTogglesUi(st);

  const afterInd = st.indicators.find(i => i.id === ind.id);
  const afterSub = sub ? afterInd?.subs?.find(s => s.id === sub.id) : null;

  return {
    indOff: ind.checkout === false,
    afterIndOff: afterInd?.checkout === false,
    subOff: sub ? sub.checkout === false : null,
    afterSubOff: afterSub ? afterSub.checkout === false : null,
    uiBag: !!st.ui.kpiToggles?.[ind.id] && st.ui.kpiToggles[ind.id].checkout === false,
  };
});

console.log(JSON.stringify(result, null, 2));
const pass = result.indOff && result.afterIndOff && result.uiBag && (result.subOff == null || result.afterSubOff);
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
