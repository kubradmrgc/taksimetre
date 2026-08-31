/**
 * Canlı GitHub Pages demosundan README ekran görüntüleri üretir.
 *
 *   npm install -D playwright
 *   npx playwright install chromium
 *   node scripts/capture-readme-shots.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../docs/screenshots");
const BASE = "https://kubradmrgc.github.io/taksimetre";

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  locale: "tr-TR",
});
const page = await context.newPage();

async function shot(name, url, { theme = "light", waitMs = 2000 } = {}) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.evaluate((t) => {
    localStorage.setItem("taksimetre-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(waitMs);
  const file = join(outDir, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("Yazıldı:", file);
}

await shot("01-hesapla-light.png", `${BASE}/`, { theme: "light" });
await shot("02-hesapla-dark.png", `${BASE}/`, { theme: "dark" });
await shot("03-sehirler.png", `${BASE}/sehirler`, { theme: "light" });
await shot("04-istanbul.png", `${BASE}/sehir/istanbul`, { theme: "light" });

await browser.close();
console.log("Tamam.");
