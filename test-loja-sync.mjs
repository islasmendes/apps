import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v124", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  lojaCode = "VCBRO";
  markLocalStateLoja("VCBRO");
  const sid = state.sellers[0].id;
  const fid = state.indicators[0].id;
  const m = currentMonth;
  const day = new Date().getDate();
  setCell(sid, fid, day, "real", 8, m);

  const localMonths = JSON.parse(JSON.stringify(state.months));
  const remoteMonths = { [m]: { daily: {}, system: {}, metaLoja: {} } };
  mergeDailyFromRemote(remoteMonths);
  const afterWipe = getCell(sid, fid, day, m).real;

  const dayKey = String(day);
  const remotePartial = { [m]: { daily: {} } };
  remotePartial[m].daily[sid] = {};
  remotePartial[m].daily[sid][fid] = {};
  remotePartial[m].daily[sid][fid][dayKey] = null;
  mergeDailyFromRemote(remotePartial);
  const afterExplicitNull = getCell(sid, fid, day, m).real;

  persistLocalState(state, "VCBRO");
  const disk = loadLocalStateSnapshot("VCBRO");
  const wrong = loadLocalStateSnapshot("VCANT");

  return {
    lojaKey: lojaLsKey("VCBRO"),
    afterWipe,
    afterExplicitNull,
    diskHasData: disk?.months?.[m]?.daily?.[sid]?.[fid]?.[String(day)]?.real === 8,
    wrongLojaBlocked: wrong == null || wrong._persistLoja !== "VCANT",
    snapTag: disk?._persistLoja,
  };
});

console.log(JSON.stringify(result, null, 2));
const ok = result.afterWipe === 8
  && result.diskHasData
  && result.lojaKey.includes("VCBRO")
  && result.snapTag === "VCBRO";
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
