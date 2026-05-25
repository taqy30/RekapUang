const pages = [
  ["seabank", "https://zonalogo.com/id/logo-seabank"],
  ["mandiri", "https://zonalogo.com/logo-bank-mandiri"],
  ["bni", "https://zonalogo.com/id/logo-bank-bni"],
  ["bsi", "https://zonalogo.com/id/logo-bank-bsi"],
  ["shopeepay", "https://zonalogo.com/id/logo-shopeepay"],
  ["bca", "https://zonalogo.com/id/logo-bank-bca"],
  ["bri", "https://zonalogo.com/id/logo-bank-bri"],
  ["dana", "https://zonalogo.com/id/logo-dana"],
  ["ovo", "https://zonalogo.com/id/logo-ovo"],
  ["gopay", "https://zonalogo.com/id/logo-gopay"],
];

for (const [name, url] of pages) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const urls = [
    ...html.matchAll(/https?:\/\/[^"'\s]+\.(?:svg|png|webp)/gi),
  ].map((m) => m[0]);
  const uniq = [...new Set(urls)].filter(
    (u) => !u.includes("favicon") && !u.includes("logo-zonalogo")
  );
  console.log("\n===", name, "===");
  uniq.slice(0, 8).forEach((u) => console.log(u));
}
