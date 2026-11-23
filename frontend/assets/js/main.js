import { projectsByLang } from "../../data/projects.js";
import { createShowcase } from "./showcase.js";
import { lang, ui, initToTop } from "./ui.js";

const root = document.querySelector(".showcase");
if (root) createShowcase(root, projectsByLang[lang]);

initToTop();

// ---------- Temiz adresler: /hakkimda, /iletisim, /en/about … ----------
// Bölümler aynı sayfada durur. Menüye tıklayınca sayfa kayar ve adres # olmadan değişir;
// /hakkimda doğrudan açılınca (sunucu ana sayfanın bu kopyasını verir) o bölüme inilir.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const sections = [...document.querySelectorAll("[data-route]")];
const navLinks = [...document.querySelectorAll(".site-nav a[data-section]")];
const routeOf = Object.fromEntries(sections.map((s) => [s.id, s.dataset.route]));
let spyPaused = false;

function scrollToSection(id, smooth) {
  const behavior = smooth && !reduceMotion.matches ? "smooth" : "auto";
  if (id === "projects" || !id) return window.scrollTo({ top: 0, behavior });
  document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
}

const langSwitch = document.querySelector(".site-nav .lang-switch");

function markCurrent(id) {
  // Dil düğmesi, bulunulan bölümün öbür dildeki adresine gider (/hakkimda ↔ /en/about)
  const alt = document.getElementById(id)?.dataset.altRoute;
  if (langSwitch && alt) langSwitch.href = alt;
  navLinks.forEach((a) => {
    if (a.dataset.section === id) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
}

function sectionForPath(pathname) {
  return sections.find((s) => s.dataset.route === pathname)?.id ?? "projects";
}

if (document.body.hasAttribute("data-home")) {
  // Doğrudan /hakkimda gibi bir adresle açıldıysa o bölüme in
  const initial = document.body.dataset.section;
  if (initial) {
    history.scrollRestoration = "manual";
    spyPaused = true;
    scrollToSection(initial, false);
    // yazı tipleri yüklenince sayfa yüksekliği değişebilir; konumu tazele
    document.fonts?.ready.then(() => scrollToSection(initial, false));
    setTimeout(() => { spyPaused = false; }, 600);
  }
  markCurrent(initial || "projects");

  navLinks.forEach((a) =>
    a.addEventListener("click", (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const id = a.dataset.section;
      const target = a.getAttribute("href");
      if (location.pathname + location.search !== target) history.pushState({ section: id }, "", target);
      markCurrent(id);
      spyPaused = true;
      scrollToSection(id, true);
      setTimeout(() => { spyPaused = false; }, 900);
    })
  );

  // Logo: ana sayfadayken sayfayı yeniden yüklemeden başa kaydır
  document.querySelector("[data-brand]")?.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const target = e.currentTarget.getAttribute("href");
    if (location.pathname + location.search !== target) history.pushState({ section: "projects" }, "", target);
    markCurrent("projects");
    spyPaused = true;
    scrollToSection("projects", true);
    setTimeout(() => { spyPaused = false; }, 900);
  });

  // Geri / ileri tuşları
  window.addEventListener("popstate", () => {
    const id = sectionForPath(location.pathname);
    markCurrent(id);
    scrollToSection(id, false);
  });

  // Elle kaydırınca adresi bulunulan bölüme göre güncelle (geçmişe kayıt eklemeden)
  let current = initial || "projects";
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (spyPaused) return;
        const line = innerHeight * 0.45;
        let id = "projects";
        for (const s of sections) if (s.id !== "projects" && s.getBoundingClientRect().top < line) id = s.id;
        if (id === current) return;
        current = id;
        markCurrent(id);
        const path = routeOf[id];
        if (path && location.pathname !== path) history.replaceState({ section: id }, "", path);
      });
    },
    { passive: true }
  );
}

// ---------- "Adresi kopyala" ----------
const copyBtn = document.querySelector("[data-copy]");
const copyStatus = document.querySelector("[data-copy-status]");
if (copyBtn && copyStatus) {
  let timer;
  copyBtn.addEventListener("click", async () => {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copy);
      copyStatus.textContent = ui("copied");
    } catch {
      copyStatus.textContent = ui("copy_failed", { value: copyBtn.dataset.copy });
    }
    timer = setTimeout(() => { copyStatus.textContent = ""; }, 3000);
  });
}
