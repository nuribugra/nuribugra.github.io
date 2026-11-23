// Yerel geliştirme sunucusu — bağımlılık yok, yalnızca Node.
//
//   node dev/server.mjs                 → http://localhost:5173
//   MOCK=slow  node dev/server.mjs      → API 1,5 sn gecikmeli (yükleme durumu)
//   MOCK=empty node dev/server.mjs      → hiç yayımlanmış yazı yok (boş liste)
//   MOCK=error node dev/server.mjs      → API 500 döner (hata durumu)
//   API_TARGET=http://localhost:3000 node dev/server.mjs
//                                        → /api isteklerini senin Express sunucuna iletir (örnek veri kapanır)
//
// Yayında bu işi Caddy yapar: frontend klasörünü sunar, /api'yi Express'e iletir,
// /articles/:slug adreslerini articles/article.html'e yönlendirir.

import { createServer, request as httpRequest } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { sampleArticles } from "./sample-articles.mjs";
import { spawnSync } from "node:child_process";
import { watch } from "node:fs";

const PORT = Number(process.env.PORT ?? 5173);
const MOCK = process.env.MOCK ?? "";
const API_TARGET = process.env.API_TARGET ?? "";
const ROOT = resolve(fileURLToPath(new URL("../frontend", import.meta.url)));
const SITE = resolve(fileURLToPath(new URL("../site", import.meta.url)));

// Sayfaları site/ şablonlarından üret; site/ içinde bir dosya değişince yeniden üret
function build() {
  const r = spawnSync(process.execPath, [join(SITE, "build.mjs")], { stdio: "inherit" });
  if (r.status !== 0) console.error("  Sayfa üretimi başarısız — yukarıdaki hataya bak.");
}
build();
let rebuildTimer;
watch(SITE, { recursive: true }, () => {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(build, 150);
});

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Data-Source": "sample",
  });
  res.end(JSON.stringify(body));
}

// ---------- Örnek API: backend.md'deki sözleşmenin aynısı ----------
const isPublished = (a) => a.published_at !== null && new Date(a.published_at) <= new Date();
const toListItem = (a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, publishedAt: a.published_at });

async function handleMockApi(req, res, pathname) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Yöntem desteklenmiyor" });
  if (MOCK === "slow") await sleep(1500);
  if (MOCK === "error") return sendJson(res, 500, { error: "Sunucu hatası" });

  const published = MOCK === "empty" ? [] : sampleArticles.filter(isPublished);

  if (pathname === "/api/articles") {
    const list = published
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .map(toListItem);
    return sendJson(res, 200, list);
  }

  const match = pathname.match(/^\/api\/articles\/([^/]+)$/);
  if (match) {
    const slug = decodeURIComponent(match[1]);
    const article = published.find((a) => a.slug === slug);
    if (!article) return sendJson(res, 404, { error: "Yazı bulunamadı" });
    return sendJson(res, 200, { ...toListItem(article), bodyMarkdown: article.body_markdown });
  }

  return sendJson(res, 404, { error: "Bulunamadı" });
}

// ---------- /api → gerçek Express (API_TARGET verilirse) ----------
function proxyApi(req, res) {
  const target = new URL(req.url, API_TARGET);
  const upstream = httpRequest(
    target,
    { method: req.method, headers: { ...req.headers, host: target.host } },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    }
  );
  upstream.on("error", () => sendJson(res, 502, { error: "API'ye ulaşılamadı" }));
  req.pipe(upstream);
}

// ---------- Statik dosyalar ----------
async function resolveFile(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  let file = join(ROOT, safe);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) return null; // klasör dışına çıkma

  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, "index.html");
    await stat(file);
    return file;
  } catch { /* aşağıda temiz adres denenir */ }

  // Temiz adres: /hakkimda → hakkimda.html (Cloudflare Pages de böyle sunar)
  try {
    const html = join(ROOT, safe.replace(/\/$/, "") + ".html");
    await stat(html);
    return html;
  } catch {
    // /articles/:slug → yazı sayfası (yenilemede de çalışır)
    if (/^\/articles\/[^/]+\/?$/.test(pathname)) return join(ROOT, "articles", "article.html");
    return null;
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname.startsWith("/api/")) {
    return API_TARGET ? proxyApi(req, res) : handleMockApi(req, res, pathname);
  }

  // /hakkimda.html → /hakkimda (yayındaki davranışla aynı); index.html → klasör
  if (pathname.endsWith(".html") && !pathname.startsWith("/articles/")) {
    const clean = pathname.endsWith("/index.html") ? pathname.slice(0, -"index.html".length) : pathname.slice(0, -5);
    res.writeHead(301, { Location: clean + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "") });
    return res.end();
  }

  // Dizin adresleri sondaki eğik çizgiye yönlendirilir (göreli yollar doğru çalışsın)
  if (!pathname.endsWith("/") && !extname(pathname) && !pathname.startsWith("/articles/")) {
    try {
      if ((await stat(join(ROOT, pathname))).isDirectory()) {
        res.writeHead(301, { Location: pathname + "/" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "") });
        return res.end();
      }
    } catch { /* dosya değil, aşağıda 404 */ }
  }

  const file = await resolveFile(pathname);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("404 — Sayfa bulunamadı");
  }
  const body = await readFile(file);
  res.writeHead(200, {
    "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "no-store", // geliştirmede tarayıcı eski dosyayı göstermesin
  });
  res.end(body);
});

server.listen(PORT, () => {
  const mode = API_TARGET ? `API → ${API_TARGET}` : `örnek veri${MOCK ? ` (MOCK=${MOCK})` : ""}`;
  console.log(`\n  http://localhost:${PORT}   ·   ${mode}\n`);
});
