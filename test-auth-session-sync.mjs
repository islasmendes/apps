import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v158&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  const H48 = 48 * 60 * 60 * 1000;
  const hasLogoutBtn = !!document.getElementById("authLogoutTop");
  const sessionMsOk = typeof AUTH_SESSION_MS === "number" && AUTH_SESSION_MS === H48;

  saveAuthSession({ type: "loja", code: "VCANT" });
  const fresh = JSON.parse(localStorage.getItem("gc_auth_session") || "null");
  const expWindowOk = fresh && fresh.exp - fresh.at <= H48 + 50 && fresh.exp - fresh.at >= H48 - 50;
  const deviceOk = fresh.device === getDeviceId();

  applyAuthContext("loja", "VCANT");
  unlockAuth();
  const restoredBefore = authUnlocked && lojaCode === "VCANT";
  logoutAuth({ skipConfirm: true });
  const clearedAfterLogout = !localStorage.getItem("gc_auth_session") && !authUnlocked;

  const expired = { type: "loja", code: "VCANT", at: Date.now() - H48 - 1000, exp: Date.now() - 1000, device: getDeviceId() };
  localStorage.setItem("gc_auth_session", JSON.stringify(expired));
  const restoreExpired = !tryRestoreAuthSession();

  const wrongDev = { type: "loja", code: "VCANT", at: Date.now(), exp: Date.now() + H48, device: "other_device" };
  localStorage.setItem("gc_auth_session", JSON.stringify(wrongDev));
  const restoreWrongDev = !tryRestoreAuthSession();

  saveAuthSession({ type: "loja", code: "VCANT" });
  const restoreValid = tryRestoreAuthSession() && authUnlocked && lojaCode === "VCANT";

  let pullOpts = null;
  const origPull = pullLoja;
  pullLoja = (opts) => { pullOpts = opts; return Promise.resolve(true); };
  const loginSrc = finishAuthEnterLoja.toString();
  const loginCloudOnly = loginSrc.includes("cloudOnly: true") && loginSrc.includes("resetLocalStateForLoja");

  return {
    hasLogoutBtn,
    sessionMsOk,
    expWindowOk,
    deviceOk,
    restoredBefore,
    clearedAfterLogout,
    restoreExpired,
    restoreWrongDev,
    restoreValid,
    loginCloudOnly,
    ok: hasLogoutBtn && sessionMsOk && expWindowOk && deviceOk && clearedAfterLogout
      && restoreExpired && restoreWrongDev && restoreValid && loginCloudOnly
  };
});

console.log(JSON.stringify(result, null, 2));
console.log(result.ok ? "PASS" : "FAIL");
await browser.close();
process.exit(result.ok ? 0 : 1);
