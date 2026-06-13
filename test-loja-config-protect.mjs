import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v125", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  lojaCode = "VCBRO";
  const rich = JSON.parse(JSON.stringify(state));
  rich.storeName = "VCBRO";
  rich._persistLoja = "VCBRO";
  rich.sellers = [
    { id: "s1", name: "Pedro", matricula: "100" },
    { id: "s2", name: "Ana", matricula: "101" },
    { id: "s3", name: "Luis", matricula: "102" }
  ];
  rich.indicators[0].subs = rich.indicators[0].subs || [];
  rich.indicators[0].subs.push({ id: "subx", name: "Extra KPI", checkin: true, checkout: true, metaDay: 2, metaSat: 0, metaSun: 0, metaMonth: 0 });
  rich.months[currentMonth] = rich.months[currentMonth] || {};
  rich.months[currentMonth].sched = { s1: { 1: 1, 2: 1 } };
  persistLocalState(rich, "VCBRO");

  const empty = defaultState();
  empty.storeName = "VCBRO";
  empty._persistLoja = "VCBRO";
  mergeLojaConfigFromSnapshot(empty, rich, "VCBRO");

  const wiped = defaultState();
  wiped.storeName = "VCBRO";
  const localScore = lojaStateRichness(rich);
  const cloudScore = lojaStateRichness(wiped);
  const useLocal = localScore > cloudScore + 5;

  return {
    sellers: empty.sellers?.length,
    hasExtraSub: empty.indicators?.[0]?.subs?.some(s => s.name === "Extra KPI"),
    hasSched: !!empty.months?.[currentMonth]?.sched?.s1,
    backupKey: lojaLsBackupKey("VCBRO"),
    localScore,
    cloudScore,
    useLocal,
    disk: loadLocalStateSnapshot("VCBRO")?.sellers?.length,
  };
});

console.log(JSON.stringify(result, null, 2));
const ok = result.sellers === 3
  && result.hasExtraSub
  && result.hasSched
  && result.useLocal
  && result.disk === 3
  && result.backupKey.includes("VCBRO");
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
