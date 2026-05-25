/**
 * Unduh logo merek dari assets.zonalogo.com (halaman referensi di zonalogo.com).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/icons/fund-sources");

const BRAND_PAGES = {
  seabank: "https://zonalogo.com/id/logo-seabank",
  mandiri: "https://zonalogo.com/logo-bank-mandiri",
  bni: "https://zonalogo.com/id/logo-bank-bni",
  bsi: "https://zonalogo.com/id/logo-bank-bsi",
  shopeepay: "https://zonalogo.com/id/logo-shopeepay",
  bca: "https://zonalogo.com/id/logo-bank-central-asia",
  bri: "https://zonalogo.com/id/logo-bank-bri",
  dana: "https://zonalogo.com/id/logo-dana",
  ovo: "https://zonalogo.com/id/logo-ovo",
  gopay: "https://zonalogo.com/id/logo-gopay",
};

const EXTRA = {
  gopay: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg",
};

function cleanUrl(raw) {
  return raw
    .replace(/\\&quot;.*/, "")
    .replace(/&quot;.*/, "")
    .replace(/&amp;/g, "&")
    .split(/[\s"')]/)[0];
}

function extractAssets(html) {
  const found = new Set();
  for (const m of html.matchAll(
    /https:\/\/assets\.zonalogo\.com\/finance\/[^\s"'<>]+\.(?:svg|png|webp)/gi
  )) {
    found.add(cleanUrl(m[0]));
  }
  return [...found];
}

function pickAsset(urls) {
  const iconPng = urls.find((u) => /\/icon[^/]*\.png$/i.test(u));
  if (iconPng) return { url: iconPng, ext: "png" };

  const logoDarkSvg = urls.find((u) => /\/logo-dark[^/]*\.svg$/i.test(u));
  if (logoDarkSvg) return { url: logoDarkSvg, ext: "svg" };

  const logoSvg = urls.find(
    (u) => /\/logo-[^/]+\.svg$/i.test(u) && !/light|putih|white/i.test(u)
  );
  if (logoSvg) return { url: logoSvg, ext: "svg" };

  const logoPng = urls.find(
    (u) => /\/logo-[^/]+\.png$/i.test(u) && !/light|putih|white/i.test(u)
  );
  if (logoPng) return { url: logoPng, ext: "png" };

  const anySvg = urls.find((u) => u.endsWith(".svg"));
  if (anySvg) return { url: anySvg, ext: "svg" };

  const anyPng = urls.find((u) => u.endsWith(".png"));
  if (anyPng) return { url: anyPng, ext: "png" };

  return null;
}

async function download(slug, asset) {
  const res = await fetch(asset.url, {
    headers: { "User-Agent": "RekapUang/1.0" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(OUT, `${slug}.${asset.ext}`), buf);
  console.log(`✓ ${slug}.${asset.ext} (${buf.length} B)`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const [slug, page] of Object.entries(BRAND_PAGES)) {
    try {
      let asset = null;
      if (EXTRA[slug]) {
        try {
          await download(slug, { url: EXTRA[slug], ext: "svg" });
          continue;
        } catch {
          /* fallback ke zonalogo */
        }
      }
      const res = await fetch(page, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();
      asset = pickAsset(extractAssets(html));
      if (!asset) throw new Error("no asset on page");
      await download(slug, asset);
    } catch (e) {
      console.warn(`✗ ${slug}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

main();
