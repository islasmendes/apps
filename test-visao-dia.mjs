import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html?v=v104", { waitUntil: "networkidle", timeout: 60000 });

// bypass auth for test
await page.evaluate(() => {
  authUnlocked = true;
  document.body.classList.remove("auth-locked");
  document.getElementById("authGate").classList.remove("show");
  state.ui.visaoDiaDismissed = null;
  activeView = "matriz";
  updateVisaoDiaOverlay();
});

const html = await page.evaluate(() => ({
  teamBar: document.getElementById("visaoDiaTeamBar")?.textContent,
  cards: document.getElementById("visaoDiaCards")?.innerHTML?.includes("vd-plan"),
  subtitle: document.getElementById("visaoDiaSubtitle")?.textContent,
  hidden: document.getElementById("matrizVisaoDia")?.hidden,
}));

console.log("visao dia test:", html);
const ok = html.cards && html.teamBar && !html.hidden && html.subtitle?.includes("planejado");
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
