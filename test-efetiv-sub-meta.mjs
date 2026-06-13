import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v137", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  lojaCode = "VCBRO";

  const troca = state.indicators.find(i => /troca/i.test(i.name));
  const fin = state.indicators.find(i => /financ|ficha/i.test(i.name));
  const trocaEf = troca?.subs?.find(s => /efetiv/i.test(s.name));
  const finEf = fin?.subs?.find(s => /efetiv/i.test(s.name));

  if (trocaEf) Object.assign(trocaEf, { metaDay: 1, metaSat: 1, metaSun: 0, metaMonth: 12, metaGestorSet: false });
  if (finEf) Object.assign(finEf, { metaDay: 1, metaSat: 1, metaSun: 0, metaMonth: 18, metaGestorSet: false });

  sanitizeGestorManualSubMetas(state);

  const trocaAfterPoison = trocaEf ? [trocaEf.metaDay, trocaEf.metaSat, trocaEf.metaSun, trocaEf.metaMonth] : null;
  const finAfterPoison = finEf ? [finEf.metaDay, finEf.metaSat, finEf.metaSun, finEf.metaMonth] : null;

  if (trocaEf) {
    trocaEf.metaDay = 2;
    trocaEf.metaSat = 1;
    trocaEf.metaSun = 0;
    trocaEf.metaMonth = 8;
    trocaEf.metaGestorSet = true;
  }
  sanitizeGestorManualSubMetas(state);
  const trocaGestorKept = trocaEf ? [trocaEf.metaDay, trocaEf.metaSat, trocaEf.metaSun, trocaEf.metaMonth] : null;

  const applied = pickSubMetaForApply({ metaDay: 1, metaMonth: 12 }, "Carro Troca", "Efetivação", "metaDay");

  return {
    trocaAfterPoison,
    finAfterPoison,
    trocaGestorKept,
    appliedWithoutFlag: applied,
    ok:
      JSON.stringify(trocaAfterPoison) === "[0,0,0,0]" &&
      JSON.stringify(finAfterPoison) === "[0,0,0,0]" &&
      JSON.stringify(trocaGestorKept) === "[2,1,0,8]" &&
      applied === 0
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
