import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v113", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  const troca = state.indicators.find(i => /troca|carro/.test(normKpiName(i.name)));
  const vendas = state.indicators.find(i => /vend/i.test(normKpiName(i.name)));
  if (!vendas || !troca) return { err: "indicadores" };
  const sub = (troca.subs || [])[0] || { id: uid(), name: "Efetivação" };
  if (!(troca.subs || []).length) troca.subs = [sub];
  const ids = state.sellers.map(s => s.id);
  const m = currentMonth;
  const md = monthData(m);
  md.metaLoja = md.metaLoja || {};
  md.metaLoja[vendas.id] = 100;
  md.metaLoja[troca.id] = 80;
  md.metaLoja[sub.id] = 999;

  const day = Math.min(new Date().getDate(), 10);
  ids.forEach((sid, i) => {
    for (let d = 1; d <= day; d++) {
      if (!isSunday(m, d)) setCell(sid, vendas.id, d, "real", 2 + i);
    }
  });

  const equipeIds = matrizEquipeSellerIds();
  const vendasPack = matrizTeamProjPack(vendas, equipeIds, true);
  const subMetaProj = matrizMetaForProj(sub, equipeIds, true);
  const subMetaMatriz = metaForMatriz(sub, equipeIds, monthDays(), "mes", true);
  const visao = visaoDiaTeamProjPct(vendas);

  return {
    vendasMeta: vendasPack?.metaProj,
    subMetaProj,
    subMetaPctCol: subMetaMatriz,
    subDirectIgnored: getMetaLoja(sub.id) === 999 && subMetaProj === 80,
    visaoMatch: vendasPack?.pp === visao?.pct,
    principalOnly: vendasPack?.metaProj === 100 && subMetaProj === 80,
  };
});

console.log("projecao test:", JSON.stringify(result, null, 2));
const ok = result.vendasMeta === 100
  && result.subMetaProj === 80
  && result.subMetaPctCol === 80
  && result.subDirectIgnored
  && result.visaoMatch
  && result.principalOnly;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
