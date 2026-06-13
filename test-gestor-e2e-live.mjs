import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", e => pageErrors.push(e.message));

await page.goto("http://127.0.0.1:8765/index.html?v=v137", { waitUntil: "networkidle", timeout: 60000 });

const setup = await page.evaluate(() => {
  unlockAuth();
  authUnlocked = true;
  lojaCode = "VCBRO";
  fbReady = false;
  const agto = state.indicators.find(i => /agend/.test(normKpiName(i.name)));
  if (agto) {
    agto.subs = agto.subs || [];
    if (!agto.subs.some(s => matchVisaoDiaAgendamentoReal(normKpiName(s.name)))) {
      agto.subs.push({
        id: uid(), name: "Agendamentos de HOJE?", checkin: false, checkout: true,
        metaDay: 0, metaSat: 0, metaSun: 0, metaMonth: 0,
        diarioDays: [true, true, true, true, true, true, true]
      });
    }
  }
  const realCfg = findVisaoDiaDiarioCfg(matchVisaoDiaAgendamentoReal)?.cfg;
  const sid = state.sellers[0]?.id;
  const day = diarioTodayDay();
  const fid = realCfg?.id;
  if (!fid || !sid || day == null) return { ok: false, reason: "setup missing" };

  const scSid = ensureSched(sid);
  scSid[day] = 1;

  const md = monthData();
  if (md.daily[sid]?.[fid]) delete md.daily[sid][fid];
  diarioPendingOverlay.clear();
  gestorMergeGuard.clear();
  gestorPushInFlight.clear();

  diarioSeller = sid;
  activeView = "diario";
  showView("diario");
  renderDiario();
  renderVisaoDiaCards();

  return { ok: true, fid, sid, day, sel: `#diarioTable input.checkout-cell[data-field="${fid}"][data-day="${day}"]` };
});

if (!setup.ok) {
  console.log(JSON.stringify({ ok: false, setup, pageErrors }, null, 2));
  await browser.close();
  process.exit(1);
}

// digitação real pelo Playwright
await page.click(setup.sel);
await page.fill(setup.sel, "7");
await page.waitForTimeout(50);

const afterAdd = await page.evaluate(({ fid, sid, day }) => {
  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  const card = [...document.querySelectorAll("#visaoDiaCards .visao-dia-card")].find(c => /agendamento/i.test(c.querySelector(".vd-label")?.textContent || ""));
  return {
    calc: visaoDiaAgendamentoTeamToday(agCard).real,
    dom: card?.querySelector(".vd-real")?.textContent?.trim() ?? null,
    cell: getCell(sid, fid, day).real,
    weekDom: document.querySelector(`#diarioTable [data-sum-loja="${fid}"]`)?.textContent?.replace(/\s+/g, " ").trim()
  };
}, setup);

// apagar com backspace real
await page.fill(setup.sel, "");
await page.waitForTimeout(50);

const afterClear = await page.evaluate(({ fid, sid, day }) => {
  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  const card = [...document.querySelectorAll("#visaoDiaCards .visao-dia-card")].find(c => /agendamento/i.test(c.querySelector(".vd-label")?.textContent || ""));
  return {
    calc: visaoDiaAgendamentoTeamToday(agCard).real,
    dom: card?.querySelector(".vd-real")?.textContent?.trim() ?? null,
    cell: getCell(sid, fid, day).real,
    weekDom: document.querySelector(`#diarioTable [data-sum-loja="${fid}"]`)?.textContent?.replace(/\s+/g, " ").trim()
  };
}, setup);

// merge remoto atrasado (valor antigo) enquanto célula ainda em edição
const staleWhileFocused = await page.evaluate(({ fid, sid, day }) => {
  const stale = {
    [currentMonth]: {
      daily: {
        [sid]: {
          [fid]: {
            [String(day)]: { real: 7, realBy: "gestor", realAt: Date.now() - 8000 }
          }
        }
      }
    }
  };
  mergeDailyFromRemote(stale);
  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  return {
    calc: visaoDiaAgendamentoTeamToday(agCard).real,
    cell: getCell(sid, fid, day).real,
    guarded: isGestorMergeGuarded(sid, fid, day),
    editing: isGestorDailyCellBeingEdited(sid, fid, day)
  };
}, setup);

await page.keyboard.press("Tab");
await page.waitForTimeout(150);

// merge remoto atrasado após blur (sem push firebase — simula nuvem velha)
const staleAfterBlur = await page.evaluate(({ fid, sid, day }) => {
  const stale = {
    [currentMonth]: {
      daily: {
        [sid]: {
          [fid]: {
            [String(day)]: { real: 7, realBy: "gestor", realAt: Date.now() - 8000 }
          }
        }
      }
    }
  };
  mergeDailyFromRemote(stale);
  refreshLiveDailyViews({ fieldId: fid });
  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  const card = [...document.querySelectorAll("#visaoDiaCards .visao-dia-card")].find(c => /agendamento/i.test(c.querySelector(".vd-label")?.textContent || ""));
  return {
    calc: visaoDiaAgendamentoTeamToday(agCard).real,
    dom: card?.querySelector(".vd-real")?.textContent?.trim() ?? null,
    cell: getCell(sid, fid, day).real,
    tombstoned: isDailyTombstoned(sid, fid, day)
  };
}, setup);

// troca para matriz e confere
const afterMatriz = await page.evaluate(({ fid, sid, day }) => {
  showView("matriz");
  matrizPeriodo = "semana";
  renderMatriz();
  const agCard = resolveVisaoDiaCard({ label: "Agendamentos", kind: "agendamentoProx", color: "#4f8cff" });
  const card = [...document.querySelectorAll("#visaoDiaCards .visao-dia-card")].find(c => /agendamento/i.test(c.querySelector(".vd-label")?.textContent || ""));
  return {
    calc: visaoDiaAgendamentoTeamToday(agCard).real,
    dom: card?.querySelector(".vd-real")?.textContent?.trim() ?? null,
    cell: getCell(sid, fid, day).real
  };
}, setup);

const result = {
  afterAdd,
  afterClear,
  staleWhileFocused,
  staleAfterBlur,
  afterMatriz,
  pageErrors,
  ok:
    afterAdd.calc === 7 && afterAdd.dom === "7" && afterAdd.cell === 7 &&
    afterClear.calc == null && afterClear.cell == null &&
    staleWhileFocused.calc == null && staleWhileFocused.cell == null &&
    staleAfterBlur.calc == null && staleAfterBlur.cell == null &&
    afterMatriz.calc == null && afterMatriz.cell == null
};

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
