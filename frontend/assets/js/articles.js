// /articles — yazı listesi: yükleniyor, boş, hata ve dolu durumları
import { fetchArticles, formatDate, markSample } from "./api.js";
import { initToTop } from "./ui.js";

const list = document.querySelector("[data-articles]");
const status = document.querySelector("[data-articles-status]");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function showLoading() {
  list.setAttribute("aria-busy", "true");
  list.replaceChildren(
    ...Array.from({ length: 3 }, () => {
      const li = el("li", "article-row article-row--skeleton");
      li.setAttribute("aria-hidden", "true");
      li.append(el("span", "sk sk--date"), el("span", "sk sk--title"), el("span", "sk sk--text"));
      return li;
    })
  );
  status.replaceChildren(el("span", "sr-only", "Yazılar yükleniyor"));
}

function showMessage(title, text, withRetry) {
  list.removeAttribute("aria-busy");
  list.replaceChildren();
  const box = el("div", "state");
  box.append(el("p", "state__title", title));
  if (text) box.append(el("p", "state__text", text));
  if (withRetry) {
    const btn = el("button", "btn btn--ghost", "Tekrar dene");
    btn.type = "button";
    btn.addEventListener("click", load);
    box.append(btn);
  }
  status.replaceChildren(box);
}

function showArticles(articles) {
  list.removeAttribute("aria-busy");
  status.replaceChildren();
  list.replaceChildren(
    ...articles.map((a) => {
      const li = el("li", "article-row");
      const link = el("a", "article-row__link");
      link.href = `/articles/${encodeURIComponent(a.slug)}`;
      const time = el("time", "article-row__date", formatDate(a.publishedAt));
      time.dateTime = a.publishedAt;
      const body = el("div", "article-row__body");
      body.append(el("h2", "article-row__title", a.title));
      if (a.excerpt) body.append(el("p", "article-row__excerpt", a.excerpt));
      link.append(time, body, el("span", "article-row__arrow", "→"));
      link.lastChild.setAttribute("aria-hidden", "true");
      li.append(link);
      return li;
    })
  );
}

async function load() {
  showLoading();
  try {
    const { data, sample } = await fetchArticles();
    markSample(sample);
    if (!Array.isArray(data) || data.length === 0) {
      showMessage("Henüz yayımlanmış bir yazı yok.", "Yeni yazılar burada listelenecek.");
    } else {
      showArticles(data);
    }
  } catch {
    showMessage("Yazılar şu anda yüklenemedi.", "Bağlantıda geçici bir sorun olabilir.", true);
  }
}

load();
initToTop();
