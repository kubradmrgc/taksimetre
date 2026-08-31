/**
 * Build sonrası dist içine şehir HTML kabukları, sitemap ve 404 yazar.
 */
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVINCES } from "../src/lib/provinces.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "dist");

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function readSiteUrl() {
  try {
    const envPath = join(root, ".env");
    const text = readFileSync(envPath, "utf8");
    const match = text.match(/^VITE_SITE_URL=(.*)$/m);
    if (match) {
      return match[1]
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/\/$/, "");
    }
  } catch {
    /* .env yok */
  }
  if (process.env.VITE_SITE_URL) {
    return String(process.env.VITE_SITE_URL).trim().replace(/\/$/, "");
  }
  return "";
}

function injectHead(html, { title, description, canonical, jsonLd }) {
  let next = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeAttr(title)}</title>`,
  );

  if (/name="description"/i.test(next)) {
    next = next.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeAttr(description)}" />`,
    );
  } else {
    next = next.replace(
      /<\/head>/i,
      `    <meta name="description" content="${escapeAttr(description)}" />\n  </head>`,
    );
  }

  const extras = [
    canonical
      ? `<link rel="canonical" href="${escapeAttr(canonical)}" />`
      : null,
    title ? `<meta property="og:title" content="${escapeAttr(title)}" />` : null,
    description
      ? `<meta property="og:description" content="${escapeAttr(description)}" />`
      : null,
    canonical
      ? `<meta property="og:url" content="${escapeAttr(canonical)}" />`
      : null,
    `<meta property="og:type" content="website" />`,
    jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
      : null,
  ]
    .filter(Boolean)
    .join("\n    ");

  return next.replace(/<\/head>/i, `    ${extras}\n  </head>`);
}

function formatDecimal(n) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatLira(n) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(n);
}

function sampleTotal(city) {
  const distance = 10;
  const opening = Number(city.openingFee) || 0;
  const perKm = Number(city.perKmFee) || 0;
  const minimum = Number(city.minimumFee) || 0;
  const sub = opening + distance * perKm;
  return Math.max(sub, minimum);
}

function main() {
  const siteUrl = readSiteUrl();
  const indexHtml = readFileSync(join(distDir, "index.html"), "utf8");
  const tariffs = JSON.parse(
    readFileSync(join(root, "src/data/tariffs.json"), "utf8"),
  );
  const nameById = new Map(PROVINCES.map((p) => [p.id, p.name]));
  const cities = tariffs.cities.map((fees) => ({
    ...fees,
    name: nameById.get(fees.id) || fees.id,
  }));

  const urls = [
    { path: "/", priority: "1.0" },
    { path: "/sehirler", priority: "0.9" },
  ];

  {
    const title = "81 İl Taksi Tarifeleri 2026 | Taksimetre";
    const description = `Türkiye'nin ${cities.length} ili için güncel taksi açılış, km ve indi-bindi ücretleri.`;
    const canonical = siteUrl ? `${siteUrl}/sehirler` : "/sehirler";
    const html = injectHead(indexHtml, {
      title,
      description,
      canonical,
      jsonLd: null,
    });
    const dir = join(distDir, "sehirler");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html, "utf8");
  }

  for (const city of cities) {
    const sample = sampleTotal(city);
    const title = `${city.name} Taksi Ücreti 2026 | Taksimetre`;
    const description = `${city.name} taksi tarifesi: açılış ${formatDecimal(city.openingFee)} ₺, km ${formatDecimal(city.perKmFee)} ₺, indi-bindi ${formatDecimal(city.minimumFee)} ₺. 10 km örnek: ${formatLira(sample)}.`;
    const path = `/sehir/${city.id}`;
    const canonical = siteUrl ? `${siteUrl}${path}` : path;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: canonical,
      about: { "@type": "City", name: city.name },
    };
    const html = injectHead(indexHtml, {
      title,
      description,
      canonical,
      jsonLd,
    });
    const dir = join(distDir, "sehir", city.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html, "utf8");
    urls.push({ path, priority: "0.8" });
  }

  copyFileSync(join(distDir, "index.html"), join(distDir, "404.html"));

  const lastmod = (tariffs.fetchedAt || new Date().toISOString()).slice(0, 10);
  const sitemapBody = urls
    .map(({ path, priority }) => {
      const loc = siteUrl ? `${siteUrl}${path === "/" ? "/" : path}` : path;
      return `  <url>\n    <loc>${escapeAttr(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapBody}\n</urlset>\n`;
  writeFileSync(join(distDir, "sitemap.xml"), sitemap, "utf8");

  const robots = [
    "User-agent: *",
    "Allow: /",
    siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : "Sitemap: /sitemap.xml",
    "",
  ].join("\n");
  writeFileSync(join(distDir, "robots.txt"), robots, "utf8");

  console.log(
    `SEO: ${cities.length} şehir kabuğu + sitemap yazıldı${
      siteUrl ? ` (${siteUrl})` : " (göreli URL; VITE_SITE_URL önerilir)"
    }`,
  );
}

main();
