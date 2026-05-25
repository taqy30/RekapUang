/**
 * Unduh logo bank/e-wallet ke public/icons/fund-sources/
 * Sumber: Wikimedia Commons (identifikasi merek) + simple-icons (Shopee, Gojek)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as si from "simple-icons";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/icons/fund-sources");

const WIKI = {
  mandiri:
    "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo.svg",
  bni: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Bank_BNI_logo.svg",
  bsi: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Bank_Syariah_Indonesia_logo.svg",
  dana: "https://upload.wikimedia.org/wikipedia/commons/7/77/DANA_%28Indonesia%29_logo.svg",
  gopay: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Gopay_logo.svg",
  ovo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/OVO_%28digital_payment%29_logo.svg",
  seabank:
    "https://upload.wikimedia.org/wikipedia/commons/9/9e/SeaBank_logo.svg",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function simpleIconSvg(icon, { bg, fg = "#fff", pad = 4 } = {}) {
  const size = 32;
  const inner = size - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${icon.title}">
  <rect width="${size}" height="${size}" rx="8" fill="${bg ?? `#${icon.hex}`}"/>
  <g transform="translate(${pad} ${pad})">
    <svg width="${inner}" height="${inner}" viewBox="0 0 24 24" fill="${fg}">
      <path d="${icon.path}"/>
    </svg>
  </g>
</svg>`;
}

async function downloadWiki(slug, url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "RekapUang/1.0 (personal finance app; logo fetch)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const text = await res.text();
  if (!text.includes("<svg")) throw new Error("not svg");
  fs.writeFileSync(path.join(OUT, `${slug}.svg`), text, "utf8");
  console.log(`✓ ${slug} (wikimedia)`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // ShopeePay — ikon Shopee resmi (simple-icons)
  const shopee = si.siShopee;
  fs.writeFileSync(
    path.join(OUT, "shopeepay.svg"),
    simpleIconSvg(shopee, { bg: "#EE4D2D" }),
    "utf8"
  );
  console.log("✓ shopeepay (simple-icons)");

  for (const [slug, url] of Object.entries(WIKI)) {
    await sleep(2500);
    try {
      await downloadWiki(slug, url);
    } catch (e) {
      console.warn(`✗ ${slug}: ${e.message}`);
    }
  }

  // GoPay fallback: Wikimedia dulu; jika gagal pakai Gojek mark (warna GoPay)
  if (!fs.existsSync(path.join(OUT, "gopay.svg"))) {
    const gojek = si.siGojek;
    fs.writeFileSync(
      path.join(OUT, "gopay.svg"),
      simpleIconSvg(gojek, { bg: "#00AED6" }),
      "utf8"
    );
    console.log("✓ gopay (simple-icons fallback)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
