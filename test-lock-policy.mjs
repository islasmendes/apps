import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v140", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForFunction(() => typeof shouldUseStrictKpiSync === "function", { timeout: 25000 });

const result = await page.evaluate(() => {
  lockPolicyCache = normalizeLockPolicy(null);
  isAdmin = false;
  divisionalCode = "";
  const strictDefault = shouldUseStrictKpiSync();
  const metasEditable = canEditKpiSection("metas");
  const togglesLocked = lockMode("kpis", "toggles") === "locked";
  const tpl = {
    v: 1,
    updatedAt: Date.now(),
    orderNames: ["Agendamento"],
    indicators: [{
      name: "Agendamento", abbr: "AG", color: "#4f8cff", checkin: true, checkout: false,
      subs: [{ name: "Sub HOJE", checkin: false, checkout: true, diarioDays: [true, true, true, true, true, true, true] }],
      rates: [], diarioDays: [true, true, true, true, true, true, true]
    }]
  };
  const st = defaultState();
  st.indicators.push({ id: "x1", name: "Loja Only", checkin: true, checkout: true, subs: [], rates: [] });
  applyOperationalConfig(st, tpl, { strictTemplate: true, ignoreVersion: true });
  const names = st.indicators.map(i => i.name);
  const subNames = (st.indicators.find(i => i.name === "Agendamento")?.subs || []).map(s => s.name);
  return { strictDefault, metasEditable, togglesLocked, names, subNames, ok: strictDefault && metasEditable && togglesLocked && !names.includes("Loja Only") && subNames.includes("Sub HOJE") };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
