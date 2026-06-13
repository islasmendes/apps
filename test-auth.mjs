import { chromium, webkit } from "playwright";

const BASE = "http://127.0.0.1:8765";

async function testPage(browserName, file, label) {
  const browser = await (browserName === "webkit" ? webkit : chromium).launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  const logs = [];
  page.on("pageerror", e => errors.push(`PAGEERROR: ${e.message}`));
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  const url = `${BASE}/${file}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  const pre = await page.evaluate(() => ({
    hasSubmitAuthLogin: typeof window.submitAuthLogin === "function",
    hasSubmitAuthPassword: typeof submitAuthPassword === "function",
    authGateShow: document.getElementById("authGate")?.classList.contains("show"),
    btnText: document.getElementById("authPassSubmit")?.textContent,
    formBound: document.getElementById("authLoginForm")?.dataset?.authBound,
    gateBound: document.getElementById("authGate")?.dataset?.authBound,
    authUnlocked: typeof authUnlocked !== "undefined" ? authUnlocked : "undef",
  }));

  await page.fill("#authPassInput", "testpassword123");
  const lojaInline = await page.$("#authLojaInputInline");
  if (lojaInline) await page.fill("#authLojaInputInline", "VCANT");

  await page.click("#authPassSubmit", { timeout: 5000 }).catch(e => errors.push(`CLICK: ${e.message}`));
  await page.waitForTimeout(2500);

  const post = await page.evaluate(() => ({
    btnText: document.getElementById("authPassSubmit")?.textContent,
    btnDisabled: document.getElementById("authPassSubmit")?.disabled,
    errText: document.getElementById("authPassErr")?.textContent,
    authGateShow: document.getElementById("authGate")?.classList.contains("show"),
    authUnlocked: typeof authUnlocked !== "undefined" ? authUnlocked : "undef",
    activeStep: document.querySelector(".auth-step.active")?.id,
    toastText: document.getElementById("toast")?.textContent,
  }));

  await browser.close();
  return { label, browserName, url, pre, post, errors, logs: logs.slice(-15) };
}

const files = [
  ["index.html", "current"],
  ["index.html.backup-20260612-v100", "v100-backup"],
];

for (const [file, label] of files) {
  for (const browser of ["chromium", "webkit"]) {
    try {
      const r = await testPage(browser, file, label);
      console.log("\n===", r.label, r.browserName, "===");
      console.log("PRE:", JSON.stringify(r.pre));
      console.log("POST:", JSON.stringify(r.post));
      if (r.errors.length) console.log("ERRORS:", r.errors.join("\n"));
    } catch (e) {
      console.error("FAIL", label, browser, e.message);
    }
  }
}
