import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v155&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  divisionalCode = "RSCEN";
  lojaCode = null;
  currentMonth = "2026-06";
  state.ui.divMetaExpanded = {};

  const ind = state.indicators.find(i => !i.pctOnly && (i.subs || []).length > 0) || state.indicators[0];
  if (!ind) return { ok: false, reason: "no indicator" };

  openDivisionalMetasModal();
  const modal = document.getElementById("divisionalMetasModal");
  const body = document.getElementById("divisionalMetasBody");
  const cards = body?.querySelectorAll(".syscards .sysgroup") || [];
  const firstCard = body?.querySelector(`.sysgroup[data-ind="${ind.id}"]`);
  const collapsedByDefault = firstCard?.classList.contains("collapsed");
  const subsHidden = firstCard?.querySelector(".sysgroup-subs") && collapsedByDefault;

  const toggle = firstCard?.querySelector(".sys-toggle");
  toggle?.click();
  const cardAfter = body?.querySelector(`.sysgroup[data-ind="${ind.id}"]`);
  const expandedAfterClick = cardAfter && !cardAfter.classList.contains("collapsed");
  const subsVisible = cardAfter?.querySelector(".sysgroup-subs .sysfield.sub") != null;

  const metaVal = 2000;
  const inp = cardAfter?.querySelector(".div-meta-inp");
  if (inp) {
    inp.value = String(metaVal);
    inp.dispatchEvent(new Event("input", { bubbles: true }));
  }
  const stored = getMetaDivisional(ind.id);
  const ls = loadDivisionalMetasStore();
  const lsVal = ls?.RSCEN?.[currentMonth]?.[ind.id];

  const nps = state.indicators.find(i => i.pctOnly);
  const npsCard = nps ? body?.querySelector(`.sysgroup[data-ind="${nps.id}"]`) : null;

  closeDivisionalMetasModal();

  return {
    modalOpen: modal?.classList.contains("show") === false,
    cardCount: cards.length,
    collapsedByDefault,
    subsHidden,
    expandedAfterClick,
    subsVisible,
    stored,
    lsVal,
    hasNpsCard: !!npsCard,
    ok: cards.length >= 3
      && collapsedByDefault
      && subsHidden
      && expandedAfterClick
      && subsVisible
      && stored === metaVal
      && lsVal === metaVal
      && !!npsCard
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
