import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v111", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  const ind = state.indicators.find(i => !i.pctOnly && (i.checkin || i.checkout));
  const sub = (state.indicators.find(i => (i.subs || []).some(s => s.checkin || s.checkout))?.subs || []).find(s => s.checkin || s.checkout);
  const cfg = sub || ind;
  if (!cfg) return { ok: false, reason: "no cfg" };

  normalizeDiarioDays(cfg);
  cfg.diarioDays = [true, true, true, true, true, false, true];
  const snap = JSON.parse(JSON.stringify(state));

  const tpl = extractOperationalConfig(state);
  tpl.indicators.forEach(ti => {
    ti.diarioDays = [true, true, true, true, true, true, true];
    (ti.subs || []).forEach(ts => { ts.diarioDays = [true, true, true, true, true, true, true]; });
  });

  applyOperationalConfig(state, tpl, { ignoreVersion: true });
  mergeDiarioDaysFromLocalState(state, snap);

  const cfgAfter = cfgById(cfg.id);
  let friday = null;
  for (let d = 1; d <= daysInMonth(currentMonth); d++) {
    if (weekday(currentMonth, d) === 5) { friday = d; break; }
  }
  const friActive = friday != null ? cfgActiveOnWeekday(cfgAfter, friday) : null;
  const needsFriday = friday != null ? diarioFieldNeeds(state.sellers[0]?.id || "", cfgAfter, friday) : null;

  return {
    ok: cfgAfter?.diarioDays?.[5] === false && friActive === false,
    friday,
    needsFriday,
    days: cfgAfter?.diarioDays,
  };
});

console.log("diario days test:", result);
const pass = result.ok && result.needsFriday?.checkin === false && result.needsFriday?.checkout === false;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
