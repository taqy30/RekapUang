const page = process.argv[2] || "https://zonalogo.com/id/logo-ovo";
const res = await fetch(page, { headers: { "User-Agent": "Mozilla/5.0" } });
const html = await res.text();
const urls = [
  ...new Set(
    [...html.matchAll(/https:\/\/assets\.zonalogo\.com\/finance\/[^\s"'<>]+\.(?:svg|png)/gi)].map(
      (m) => m[0].split("&")[0]
    )
  ),
];
urls.forEach((u) => console.log(u));
