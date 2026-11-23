// /articles/:slug — tek yazı. Markdown, ham HTML kapalı olarak çizilir.
import { fetchArticle, formatDate, markSample, NotFoundError } from "./api.js";
import { initToTop } from "./ui.js";

const root = document.querySelector("[data-article]");
const slug = decodeURIComponent(location.pathname.replace(/^\/articles\/|\/$/g, ""));

// html: false → yazıdaki <script>, <b> gibi etiketler çalıştırılmaz, düz metin olarak görünür
const md = window.markdownit({ html: false, linkify: false, typographer: false });
// Dış bağlantılar yeni sekmede ve güvenli açılsın
const defaultLink = md.renderer.rules.link_open ?? ((t, i, o, e, s) => s.renderToken(t, i, o));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet("href") ?? "";
  if (/^https?:\/\//i.test(href) && !href.startsWith(location.origin)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener");
  }
  return defaultLink(tokens, idx, options, env, self);
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function backLink() {
  const a = el("a", "post__back");
  a.href = "/articles/";
  a.innerHTML = '<span aria-hidden="true">←</span> Tüm yazılar';
  return a;
}

function showLoading() {
  root.setAttribute("aria-busy", "true");
  const wrap = el("div", "post__skeleton");
  wrap.setAttribute("aria-hidden", "true");
  wrap.append(el("span", "sk sk--date"), el("span", "sk sk--heading"), el("span", "sk sk--text"), el("span", "sk sk--text"), el("span", "sk sk--text sk--short"));
  root.replaceChildren(wrap, el("span", "sr-only", "Yazı yükleniyor"));
}

function showMessage(title, text, withRetry) {
  root.removeAttribute("aria-busy");
  const box = el("div", "state state--page");
  box.append(el("p", "state__title", title));
  if (text) box.append(el("p", "state__text", text));
  const actions = el("div", "state__actions");
  if (withRetry) {
    const btn = el("button", "btn btn--ghost", "Tekrar dene");
    btn.type = "button";
    btn.addEventListener("click", load);
    actions.append(btn);
  }
  actions.append(backLink());
  box.append(actions);
  root.replaceChildren(box);
}

function showArticle(a) {
  root.removeAttribute("aria-busy");
  document.title = `${a.title} · Nuri Buğra Demir`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && a.excerpt) meta.content = a.excerpt;

  const header = el("header", "post__header");
  const time = el("time", "post__date", formatDate(a.publishedAt));
  time.dateTime = a.publishedAt;
  header.append(time, el("h1", "post__title", a.title));
  if (a.excerpt) header.append(el("p", "post__excerpt", a.excerpt));

  const body = el("div", "post__body prose");
  body.innerHTML = md.render(a.bodyMarkdown ?? ""); // markdown-it çıktısı; ham HTML kapalı

  const footer = el("footer", "post__footer");
  footer.append(backLink());

  root.replaceChildren(header, body, footer);
}

async function load() {
  if (!slug) return showMessage("Yazı bulunamadı.", "Adres eksik görünüyor.");
  showLoading();
  try {
    const { data, sample } = await fetchArticle(slug);
    markSample(sample);
    showArticle(data);
  } catch (err) {
    if (err instanceof NotFoundError) {
      document.title = "Yazı bulunamadı · Nuri Buğra Demir";
      showMessage("Yazı bulunamadı.", "Bu yazı kaldırılmış, henüz yayımlanmamış ya da adres hatalı olabilir.");
    } else {
      showMessage("Yazı şu anda yüklenemedi.", "Bağlantıda geçici bir sorun olabilir.", true);
    }
  }
}

load();
initToTop();
