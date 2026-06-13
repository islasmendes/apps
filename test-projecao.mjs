import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v111", { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  const vendas = state.indicators.find(i => /vend/i.test(normKpiName(i.name)));
  if (!vendas) return { err: "sem vendas" };
  const ids = state.sellers.map(s => s.id);
  const m = currentMonth;
  const md = monthData(m);
  md.metaLoja = md.metaLoja || {};
  md.metaLoja[vendas.id] = 100;
  delete md.metaLoja[(vendas.subs || [])[0]?.id];

  const day = Math.min(new Date().getDate(), 10);
  ids.forEach((sid, i) => {
    for (let d = 1; d <= day; d++) {
      if (!isSunday(m, d)) setCell(sid, vendas.id, d, "real", 2 + i);
    }
  });

  const equipeIds = matrizEquipeSellerIds();
  const pack = matrizTeamProjPack(vendas, equipeIds, true);
  const visao = visaoDiaTeamProjPct(vendas);
  const subResolved = (vendas.subs || [])[0];
  const subMeta = subResolved ? getMetaLojaResolved(subResolved.id) : null;
  const divLeak = getMetaDivisional(vendas.id);

  return {
    equipeCount: equipeIds.length,
    real: pack?.real,
    proj: pack?.proj,
    metaProj: pack?.metaProj,
    pp: pack?.pp,
    visaoPct: visao?.pct,
    visaoText: visao?.text,
    subMeta,
    divLeak,
    divisionalMode: divisionalMode(),
    match: pack?.pp != null && visao?.pct != null && Math.abs(pack.pp - visao.pct) < 1e-9,
    metaIsLoja: pack?.metaProj === 100,
    subInheritsParent: subResolved ? subMeta === 100 : true,
  };
});

console.log("projecao test:", JSON.stringify(result, null, 2));
const ok = result.match && result.metaIsLoja && result.subInheritsParent && result.equipeCount > 0;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
