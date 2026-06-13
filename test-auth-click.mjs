import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8765/index.html?v=v103";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));

await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });

const pre = await page.evaluate(() => ({
  hasSubmitAuthLogin: typeof window.submitAuthLogin === "function",
  gateBound: document.getElementById("authGate")?.dataset?.authBound,
  btnOnclick: typeof document.getElementById("authPassSubmit")?.onclick,
}));

await page.fill("#authPassInput", "testpassword123");
await page.fill("#authLojaInputInline", "VCANT");
await page.click("#authPassSubmit");

await page.waitForTimeout(1500);

const post = await page.evaluate(() => ({
  btnText: document.getElementById("authPassSubmit")?.textContent,
  errText: document.getElementById("authPassErr")?.textContent,
  toastText: document.getElementById("toast")?.textContent,
  authGateShow: document.getElementById("authGate")?.classList.contains("show"),
}));

console.log("PRE", pre);
console.log("POST", post);
console.log("ERRORS", errors);

const ok = pre.hasSubmitAuthLogin && (post.btnText === "Entrando…" || post.errText.length > 0 || post.toastText.length > 0);
console.log(ok ? "TEST PASS: button triggers auth" : "TEST FAIL: no auth response");
process.exit(ok ? 0 : 1);

await browser.close();
