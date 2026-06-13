import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v113", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  const sid = state.sellers[0]?.id;
  const ind = state.indicators.find(i => !i.pctOnly && (i.checkin || i.checkout));
  const sub = (state.indicators.find(i => (i.subs || []).some(s => s.checkin || s.checkout))?.subs || []).find(s => s.checkin || s.checkout);
  const cfg = sub || ind;
  if (!cfg || !sid) return { ok: false, reason: "no cfg" };

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
  let friday = null, saturday = null;
  for (let d = 1; d <= daysInMonth(currentMonth); d++) {
    const wd = weekday(currentMonth, d);
    if (wd === 5 && friday == null) friday = d;
    if (wd === 6 && saturday == null) saturday = d;
  }

  const satSub = { id: uid(), name: "Agendamentos p/ sábado", checkin: false, checkout: true, metaDay: 0, metaSat: 5, metaSun: 0, metaMonth: 0 };
  normalizeDiarioDays(satSub);
  satSub.diarioDays = [false, false, false, false, false, false, true];
  const needsFriSatSub = friday != null ? diarioFieldNeeds(sid, satSub, friday) : null;
  const needsSatSatSub = saturday != null ? diarioFieldNeeds(sid, satSub, saturday) : null;

  return {
    ok: cfgAfter?.diarioDays?.[5] === false,
    friday,
    saturday,
    needsFriday: friday != null ? diarioFieldNeeds(sid, cfgAfter, friday) : null,
    satSubFriInactive: needsFriSatSub?.checkin === false && needsFriSatSub?.checkout === false,
    satSubSatActive: needsSatSatSub?.checkout === true,
    days: cfgAfter?.diarioDays,
  };
});

console.log("diario days test:", result);
const pass = result.ok
  && result.needsFriday?.checkin === false
  && result.needsFriday?.checkout === false
  && result.satSubFriInactive
  && result.satSubSatActive;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
