import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://127.0.0.1:8765/consultor.html?v=v114", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForFunction(() => typeof fbReady !== "undefined" && fbReady, { timeout: 25000 });

const result = await page.evaluate(() => {
  try {
    lojaData = {
      sellers: [{ id: "s1", matricula: "123", name: "Test", pinHash: "x", pinSalt: "y" }],
      indicators: [{
        id: "i1", name: "Agendamento", pctOnly: false, checkin: true, checkout: true,
        subs: [{ id: "sub1", name: "Agendamentos p/ sabado", checkin: false, checkout: true, metaDay: 0, metaSat: 5, metaSun: 0 }],
      }],
    };
    normalizeLojaIndicators();
    return { ok: true, subDays: lojaData.indicators[0].subs[0].diarioDays };
  } catch (e) {
    return { ok: false, err: e.message };
  }
});

console.log("consultor login test:", JSON.stringify(result, null, 2));
if (errors.length) console.log("page errors:", errors);
const pass = result.ok && Array.isArray(result.subDays);
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
