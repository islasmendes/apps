import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v149", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  lojaCode = "VCANT";
  currentMonth = "2026-06";
  const seller = state.sellers[0]?.id || "s1";
  if (!state.sellers.length) state.sellers.push({ id: seller, name: "Teste" });

  const newIndId = uid();
  state.indicators.push({
    id: newIndId, name: "Novo KPI", abbr: "NOV", color: "#22d3aa",
    checkin: true, checkout: true, pctOnly: false, subs: [], rates: [
      { id: uid(), name: "Taxa Nova", manual: true, absolute: false, numId: "", denId: "", target: 0 }
    ]
  });

  setSystem(seller, newIndId, "42");
  const localVal = getSystem(seller, newIndId);
  const md = monthData(currentMonth);
  const localAt = md.systemAt?.[seller]?.[newIndId];

  const remoteMonths = {
    [currentMonth]: {
      system: { [seller]: {} },
      systemAt: { [seller]: {} },
      systemRate: {}
    }
  };
  const beforeMerge = getSystem(seller, newIndId);
  mergeMonthsConfigFromLocal(state, { months: remoteMonths });
  const afterMerge = getSystem(seller, newIndId);

  const rateId = state.indicators.find(i => i.id === newIndId).rates[0].id;
  setSystemRate(seller, rateId, "88");
  const rateLocal = getSystemRate(seller, rateId);
  mergeMonthsConfigFromLocal(state, { months: { [currentMonth]: { systemRate: { [seller]: {} } } } });
  const rateAfterMerge = getSystemRate(seller, rateId);

  const updates = {};
  const base = `lojas/VCANT/data/months/${currentMonth}`;
  updates[`${base}/system/${seller}/${newIndId}`] = 42;
  const hasPushPath = Object.keys(updates).length > 0;

  return {
    localVal,
    localAt,
    beforeMerge,
    afterMerge,
    rateLocal,
    rateAfterMerge,
    hasPushPath,
    ok: localVal === 42 && beforeMerge === 42 && afterMerge === 42 && rateLocal === 88 && rateAfterMerge === 88 && localAt > 0
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
