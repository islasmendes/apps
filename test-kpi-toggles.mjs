import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v123", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  const ind = state.indicators.find(i => /carro troca/i.test(i.name));
  const sub = ind?.subs?.find(s => /efetiv/i.test(s.name)) || ind?.subs?.find(s => s.checkout) || null;
  const target = sub || state.indicators.find(i => !i.pctOnly && i.checkin && i.checkout);
  const ind2 = target === sub ? ind : target;
  if (!ind2) return { err: "no ind" };

  const fieldId = sub ? sub.id : ind2.id;
  const sid = state.sellers[0]?.id;
  const day = new Date().getDate();
  if (sid) setCell(sid, fieldId, day, "real", 3);

  if (sub) sub.checkout = false;
  else ind2.checkout = false;
  persistKpiTogglesUi(state);

  const tpl = extractOperationalConfig(state);
  const tplInd = tpl.indicators.find(x => x.name === ind2.name);
  if (sub) {
    const tplSub = tplInd.subs.find(x => x.name === sub.name);
    if (tplSub) tplSub.checkout = true;
  } else {
    tplInd.checkout = true;
  }
  tpl.updatedAt = Date.now();

  const st = JSON.parse(JSON.stringify(state));
  const localSnap = JSON.parse(JSON.stringify(state));
  applyOperationalConfig(st, tpl, { ignoreVersion: true });
  mergeKpiTogglesFromLocalState(st, localSnap);
  applyKpiTogglesUi(st);

  const afterInd = st.indicators.find(i => i.id === ind2.id);
  const afterSub = sub ? afterInd?.subs?.find(s => s.id === sub.id) : null;

  return {
    fieldId,
    hadTodayData: true,
    afterSubOff: sub ? afterSub?.checkout === false : null,
    afterIndOff: sub ? null : afterInd?.checkout === false,
    uiBagOff: sub
      ? st.ui.kpiToggles?.[sub.id]?.checkout === false
      : st.ui.kpiToggles?.[ind2.id]?.checkout === false,
  };
});

console.log(JSON.stringify(result, null, 2));
const pass = result.hadTodayData && (result.afterSubOff === true || result.afterIndOff === true) && result.uiBagOff;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
