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
];

const urlFor = (page, lang) => {
  if (page.id === "article") return null;
  return PATHS[lang][page.id === "home" ? "home" : page.id] ?? null;
};

// ---------- Küçük şablon motoru ----------
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
      const partial = await readFile(join(SITE, "partials", `${name}.html`), "utf8");
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
  tr: JSON.parse(await readFile(join(SITE, "i18n", "tr.json"), "utf8")),
  en: JSON.parse(await readFile(join(SITE, "i18n", "en.json"), "utf8")),
};
const ALT = { tr: "en", en: "tr" };
const written = [];

for (const page of PAGES) {
  const template = await readFile(join(SITE, "pages", page.template), "utf8");
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
      // Tarayıcıdaki JavaScript'in kullandığı metinler
      ui_json: JSON.stringify(t.ui).replace(/</g, "\\u003c"),
    };

    const html = await render(template, ctx, `${page.template} [${lang}]`);
    const banner = `<!-- Bu dosya site/pages/${page.template} ve site/i18n/${lang}.json dosyalarından üretildi. Elle düzenleme; değişiklik için site/ içini düzenleyip "node site/build.mjs" çalıştır. -->\n`;
    const target = join(OUT, page.file[lang]);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html.replace(/^<!DOCTYPE html>\n/i, `<!DOCTYPE html>\n${banner}`));
    written.push(page.file[lang]);
  }
}

console.log(`  ${written.length} sayfa üretildi → frontend/`);
for (const f of written) console.log(`   · ${f}`);
