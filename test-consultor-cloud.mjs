import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://127.0.0.1:8765/consultor.html?v=v139", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForFunction(() => typeof cloudOnline === "function" && cloudOnline(), { timeout: 30000 });

const conflict = (s) => (s.liveOn && /offline/i.test(s.liveTxt)) || (!s.liveOn && s.liveTxt === "ao vivo");

const samples = [];
for (let i = 0; i < 10; i++) {
  samples.push(await page.evaluate(() => ({
    cloudOnline: cloudOnline(),
    fbReady,
    connected,
    liveTxt: liveTxt.textContent,
    liveOn: livePill.classList.contains("on"),
    btnDisabled: btnLogin.disabled,
    loginErr: loginErr.textContent,
  })));
  await page.waitForTimeout(200);
}

const simulated = await page.evaluate(() => {
  const prev = connected;
  connected = false;
  refreshCloudUi();
  const out = {
    cloudOnline: cloudOnline(),
    liveTxt: liveTxt.textContent,
    liveOn: livePill.classList.contains("on"),
    btnDisabled: btnLogin.disabled,
    loginErr: loginErr.textContent,
    retryVisible: btnRetryCloud.style.display,
  };
  connected = prev;
  refreshCloudUi();
  return out;
});

const pass =
  !samples.some(conflict) &&
  !conflict(simulated) &&
  simulated.cloudOnline === false &&
  simulated.btnDisabled === true &&
  simulated.liveOn === false &&
  /reconect|offline/i.test(simulated.liveTxt) &&
  simulated.retryVisible === "inline-flex";

console.log(JSON.stringify({ samples: samples[0], simulated, pass, errors }, null, 2));
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
