const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const pptxgen = require("pptxgenjs");

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "exports");
const PNG_DIR = path.join(OUT_DIR, "slide-images");
const PPTX_PATH = path.join(OUT_DIR, "ASGroup-AI-Owner-Session.pptx");
const URL = "http://127.0.0.1:4173/index.html";

async function ensureDirs() {
  fs.mkdirSync(PNG_DIR, { recursive: true });
  for (const file of fs.readdirSync(PNG_DIR)) {
    if (file.toLowerCase().endsWith(".png")) fs.unlinkSync(path.join(PNG_DIR, file));
  }
}

async function main() {
  await ensureDirs();

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  await page.goto(`${URL}#01`, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: `
      .controls { display: none !important; }
      body { background: #f7f4ee !important; }
      .deck { box-shadow: none !important; }
    `,
  });

  const slideCount = await page.locator(".slide").count();
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "PRO Resources";
  pptx.company = "PRO Resources";
  pptx.subject = "ASGroup AI Owner Session";
  pptx.title = "Future-Proofing With AI";
  pptx.lang = "en-US";
  pptx.theme = {
    headFontFace: "Aptos",
    bodyFontFace: "Aptos",
    lang: "en-US",
  };

  for (let i = 1; i <= slideCount; i += 1) {
    const hash = String(i).padStart(2, "0");
    await page.goto(`${URL}#${hash}`, { waitUntil: "networkidle" });
    await page.addStyleTag({
      content: ".controls { display: none !important; } .deck { box-shadow: none !important; }",
    });
    const imagePath = path.join(PNG_DIR, `slide-${hash}.png`);
    await page.locator(".deck").screenshot({ path: imagePath });
    const slide = pptx.addSlide();
    slide.background = { color: "F7F4EE" };
    slide.addImage({ path: imagePath, x: 0, y: 0, w: 13.333333, h: 7.5 });
  }

  await browser.close();
  await pptx.writeFile({ fileName: PPTX_PATH });
  console.log(`Wrote ${PPTX_PATH}`);
  console.log(`Slides: ${slideCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
