// Yazı API'si istemcisi. Sözleşme: docs/backend.md
//   GET /api/articles        → [{ slug, title, excerpt, publishedAt }]
//   GET /api/articles/:slug  → { slug, title, excerpt, publishedAt, bodyMarkdown } | 404

const TIMEOUT_MS = 8000;

export class NotFoundError extends Error {}
export class ApiError extends Error {}

async function getJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(path, { headers: { Accept: "application/json" }, signal: controller.signal });
  } catch {
    throw new ApiError("Sunucuya ulaşılamadı");
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 404) throw new NotFoundError("Bulunamadı");
  if (!res.ok) throw new ApiError(`Beklenmeyen yanıt: ${res.status}`);
  try {
    return { data: await res.json(), sample: res.headers.get("X-Data-Source") === "sample" };
  } catch {
    throw new ApiError("Yanıt okunamadı");
  }
}

export const fetchArticles = () => getJson("/api/articles");
export const fetchArticle = (slug) => getJson(`/api/articles/${encodeURIComponent(slug)}`);

const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
export function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFormat.format(d);
}

// Yerel geliştirme sunucusu örnek veri döndürüyorsa sayfanın köşesinde küçük bir işaret göster
export function markSample(isSample) {
  if (!isSample || document.querySelector(".sample-flag")) return;
  const flag = document.createElement("p");
  flag.className = "sample-flag";
  flag.textContent = "Örnek veri — yerel geliştirme sunucusu";
  flag.setAttribute("role", "note");
  const header = document.querySelector(".sub-header");
  header ? header.after(flag) : document.body.prepend(flag);
}
