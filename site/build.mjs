// Sayfa üretici — bağımlılık yok, yalnızca Node.
//
//   node site/build.mjs
//
// site/pages/*.html şablonlarını site/i18n/{tr,en}.json ile doldurup frontend/ klasörüne yazar.
// frontend/ içindeki HTML dosyaları ÜRETİLİR; metinleri site/ içinden değiştir, sonra bu betiği çalıştır.
//
// Şablon sözdizimi:
//   {{t.home.lede}}        → çeviri metni (HTML kaçışlı)
//   {{{t.contact.sub}}}    → çeviri metni, HTML olarak (yalnızca bizim yazdığımız metinler için)
//   {{path.about}}         → o dildeki sayfa adresi
//   {{> nav}}              → site/partials/nav.html
//   {{#if page.alt}}…{{/if}} → değer boş değilse göster

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(SITE, "../frontend");
const config = JSON.parse(await readFile(join(SITE, "config.json"), "utf8"));

// ---------- Adresler ----------
// Her sayfanın iki dildeki adresi ve dosyası. Bölüm sayfaları (hakkimda, iletisim) aynı ana sayfa
// şablonunun kopyasıdır; açıldıklarında ilgili bölüme inerler.
const PATHS = {
  tr: { home: "/", about: "/hakkimda", contact: "/iletisim", haus: "/projeler/haus-pera/", jakovs: "/projeler/jakovs/", articles: "/articles/" },
  en: { home: "/en/", about: "/en/about", contact: "/en/contact", haus: "/en/projects/haus-pera/", jakovs: "/en/projects/jakovs/", articles: null },
};

const PAGES = [
  { id: "home",    template: "home.html",              section: "",        file: { tr: "index.html",                   en: "en/index.html" } },
  { id: "about",   template: "home.html",              section: "about",   file: { tr: "hakkimda.html",                en: "en/about.html" } },
  { id: "contact", template: "home.html",              section: "contact", file: { tr: "iletisim.html",                en: "en/contact.html" } },
  { id: "haus",    template: "project-haus-pera.html",                     file: { tr: "projeler/haus-pera/index.html", en: "en/projects/haus-pera/index.html" } },
  { id: "jakovs",  template: "project-jakovs.html",                        file: { tr: "projeler/jakovs/index.html",   en: "en/projects/jakovs/index.html" } },
  // Yazılar şimdilik yalnızca Türkçe (menüde gizli)
  { id: "articles", template: "articles.html", file: { tr: "articles/index.html" } },
  { id: "article",  template: "article.html",  file: { tr: "articles/article.html" } },
  // Bulunamayan adresler için (iki dilli tek sayfa)
  { id: "notfound", template: "404.html", file: { tr: "404.html" } },
];

const urlFor = (page, lang) => {
  if (page.id === "article" || page.id === "notfound") return null;
  return PATHS[lang][page.id === "home" ? "home" : page.id] ?? null;
};

// ---------- Küçük şablon motoru ----------
// Windows'ta git satır sonlarını CRLF yapabilir; şablonları her makinede aynı okumak için LF'ye çevir
const readText = async (file) => (await readFile(file, "utf8")).replace(/\r\n/g, "\n");

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function lookup(ctx, key, where) {
  const value = key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), ctx);
  if (value === undefined) throw new Error(`Eksik anahtar "${key}" (${where})`);
  return value;
}

async function render(src, ctx, where) {
  // parçalar
  let out = src;
  for (let i = 0; i < 5 && /\{\{>\s*[\w-]+\s*\}\}/.test(out); i++) {
    const names = [...out.matchAll(/\{\{>\s*([\w-]+)\s*\}\}/g)].map((m) => m[1]);
    for (const name of new Set(names)) {
      const partial = await readText(join(SITE, "partials", `${name}.html`));
      out = out.replaceAll(new RegExp(`\\{\\{>\\s*${name}\\s*\\}\\}`, "g"), partial.trimEnd());
    }
  }
  // koşullar (iç içe değil)
  out = out.replace(/\{\{#if\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, body) => {
    const v = key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), ctx);
    return v ? body : "";
  });
  out = out.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, key) => String(lookup(ctx, key, where)));
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => escapeHtml(lookup(ctx, key, where)));
  return out;
}

// ---------- Üretim ----------
const locales = {
  tr: JSON.parse(await readText(join(SITE, "i18n", "tr.json"))),
  en: JSON.parse(await readText(join(SITE, "i18n", "en.json"))),
};
const ALT = { tr: "en", en: "tr" };
const written = [];

for (const page of PAGES) {
  const template = await readText(join(SITE, "pages", page.template));
  for (const lang of Object.keys(page.file)) {
    const t = locales[lang];
    const alt = ALT[lang];
    const url = urlFor(page, lang);
    const altUrl = page.file[alt] ? urlFor(page, alt) : null;
    const trUrl = urlFor(page, "tr");
    const enUrl = page.file.en ? urlFor(page, "en") : null;

    const ctx = {
      t,
      lang,
      v: config.assetVersion,
      path: PATHS[lang],
      altpath: PATHS[alt],
      site: { origin: config.origin },
      page: {
        id: page.id,
        project: { haus: "haus-pera", jakovs: "jakovs" }[page.id] ?? "",
        section: page.section ?? "",
        // bölüm sayfaları ana sayfanın kopyası olduğu için arama motorlarına ana sayfa gösterilir
        canonical: page.section ? PATHS[lang].home : (url ?? ""),
        // bölüm sayfalarının dil eşleşmeleri de ana sayfaları gösterir (canonical ile tutarlı)
        url_tr: page.section ? PATHS.tr.home : (trUrl ?? ""),
        url_en: page.section ? PATHS.en.home : (enUrl ?? ""),
        alternates: Boolean(trUrl && enUrl),
        alt: altUrl ? { href: altUrl, lang: alt, label: locales[alt].lang.short, name: locales[alt].lang.name } : null,
      },
      // Başlık ve açıklama (paylaşım önizlemesi için)
      meta: (() => {
        const key = { home: "home", about: "home", contact: "home", haus: "haus", jakovs: "jakovs" }[page.id] ?? "articles";
        return { title: key === "articles" ? `${t.articles.title} · ${t.site.name}` : t[key].title, description: t[key].description };
      })(),
      // Tarayıcıdaki JavaScript'in kullandığı metinler
      ui_json: JSON.stringify(t.ui).replace(/</g, "\\u003c"),
    };

    const html = await render(template, ctx, `${page.template} [${lang}]`);
    const banner = `<!-- Bu dosya site/pages/${page.template} ve site/i18n/${lang}.json dosyalarından üretildi. Elle düzenleme; değişiklik için site/ içini düzenleyip "node site/build.mjs" çalıştır. -->\n`;
    const target = join(OUT, page.file[lang]);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html.replace(/^<!DOCTYPE html>\r?\n/i, `<!DOCTYPE html>\n${banner}`));
    written.push(page.file[lang]);
  }
}

// ---------- sitemap.xml ve robots.txt ----------
// Yalnızca asıl sayfalar: bölüm kopyaları (/hakkimda…) ana sayfayı gösterdiği, Yazılar da henüz gizli olduğu için dışarıda.
const origin = config.origin || "";
const listed = ["home", "haus", "jakovs"];
const urls = listed.flatMap((id) => {
  const tr = PATHS.tr[id === "home" ? "home" : id];
  const en = PATHS.en[id === "home" ? "home" : id];
  const alts = `    <xhtml:link rel="alternate" hreflang="tr" href="${origin}${tr}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${origin}${en}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${tr}"/>`;
  return [tr, en].map((loc) => `  <url>\n    <loc>${origin}${loc}</loc>\n${alts}\n  </url>`);
});
await writeFile(join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`);
await writeFile(join(OUT, "robots.txt"),
  `User-agent: *\n# Yazılar hazır olunca bu satırı kaldır\nDisallow: /articles/\n\nSitemap: ${origin}/sitemap.xml\n`);
written.push("sitemap.xml", "robots.txt");

console.log(`  ${written.length} sayfa üretildi → frontend/`);
for (const f of written) console.log(`   · ${f}`);
