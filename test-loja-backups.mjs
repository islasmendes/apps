import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:8765/index.html?v=v153&_=${Date.now()}`, { waitUntil: "networkidle", timeout: 60000 });

const result = await page.evaluate(() => {
  authUnlocked = true;
  lojaCode = "VCBRO";
  const rich = JSON.parse(JSON.stringify(state));
  rich.storeName = "VCBRO";
  rich._persistLoja = "VCBRO";
  rich.sellers = [
    { id: "s1", name: "Pedro", matricula: "100" },
    { id: "s2", name: "Ana", matricula: "101" }
  ];
  persistLocalState(rich, "VCBRO");
  const entry = saveVersionedLojaBackup(rich, "VCBRO", "test");
  const list = listLojaVersionedBackups("VCBRO");
  const loaded = loadLojaVersionedBackup("VCBRO", entry.id);
  applyLojaIdentity("VCBRO", "VCANT");
  const wrongName = state.storeName;
  applyLojaIdentity("VCBRO", "VCBRO");
  const fixedName = state.storeName;
  const hdr = document.getElementById("storeName")?.value;
  return {
    label: entry?.label,
    labelHasBuild: entry?.label?.includes("BACKUP"),
    labelHasLoja: entry?.label?.includes("VCBRO"),
    backupCount: list.length,
    loadedSellers: loaded?.sellers?.length,
    wrongName,
    fixedName,
    hdr,
    indexKey: lojaBackupIndexKey("VCBRO"),
  };
});

console.log(JSON.stringify(result, null, 2));
const ok = result.labelHasBuild
  && result.labelHasLoja
  && result.backupCount >= 1
  && result.loadedSellers === 2
  && result.wrongName === "VCBRO"
  && result.fixedName === "VCBRO"
  && result.hdr === "VCBRO";
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
