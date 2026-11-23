// Çark vitrini: aktif proje kırmızı seçicinin üstünde durur, diğerleri yay üzerinde kenara çekilir.
// Konum tamamen CSS'te (--o değişkeni); burası yalnızca durumu ve girişleri yönetir.

const SWIPE_THRESHOLD = 48;   // px — bu kadar yatay sürüklenince proje değişir
const DRAG_LOCK = 10;         // px — jestin yatay mı dikey mi olduğuna karar verilen mesafe

import { placeholder as markedPlaceholder } from "./placeholder.js";
import { ui } from "./ui.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function placeholder(project) {
  return markedPlaceholder(project.title, project.coverImage);
}

function renderScreen(project) {
  const screen = el("div", `screen screen--${project.orientation}`);
  if (!project.coverImage) {
    screen.append(placeholder(project));
    return screen;
  }
  const img = new Image();
  img.alt = project.coverAlt ?? project.title;
  img.decoding = "async";
  img.draggable = false;
  if (project.coverSrcset) {
    img.srcset = project.coverSrcset;
    img.sizes = "(min-width: 720px) min(60vw, 820px), 88vw";
  }
  if (project.coverSize) {
    [img.width, img.height] = project.coverSize;
  }
  img.addEventListener("error", () => img.replaceWith(placeholder(project)), { once: true });
  img.src = project.coverImage;
  screen.append(img);
  return screen;
}

function renderCaption(project) {
  const wrap = el("div", "caption is-entering");
  const meta = [project.kind, ...(project.stack ?? [])].filter(Boolean).join(" · ");
  const title = el("h2", "caption__title", project.title);
  if (project.subtitle) title.append(" ", el("span", null, `— ${project.subtitle}`));
  if (meta) wrap.append(el("p", "caption__meta", meta));
  wrap.append(title, el("p", "caption__summary", project.summary));
  return wrap;
}

export function createShowcase(root, projects) {
  const items = [...projects].sort((a, b) => a.displayOrder - b.displayOrder);
  const stage = root.querySelector("[data-stage]");
  const wheel = root.querySelector("[data-wheel]");
  const selector = root.querySelector(".showcase__selector");
  const caption = root.querySelector("[data-caption]");
  const count = root.querySelector("[data-count]");
  const link = root.querySelector("[data-link]");
  const prevBtn = root.querySelector("[data-prev]");
  const nextBtn = root.querySelector("[data-next]");

  // /?proje=jakovs (TR) ya da /en/?project=jakovs (EN) adresiyle belirli projede açılabilir
  const requested = new URLSearchParams(location.search).get(ui("project_param"));
  let active = Math.max(0, items.findIndex((p) => p.slug === requested));
  let drag = 0; // sürükleme sırasında kesirli kayma (slayt cinsinden)

  const slides = items.map((project, i) => {
    const slide = el("div", "slide");
    slide.dataset.index = String(i);
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", ui("slide"));
    slide.setAttribute("aria-label", `${i + 1} / ${items.length}: ${project.title}`);
    slide.append(renderScreen(project));
    wheel.append(slide);
    return slide;
  });

  const pad = (n) => String(n).padStart(2, "0");

  function layout() {
    slides.forEach((slide, i) => slide.style.setProperty("--o", String(i - active + drag)));
  }

  function syncSelector() {
    const screen = slides[active].firstElementChild;
    selector.style.setProperty("--sel-w", `${screen.offsetWidth}px`);
  }

  function render() {
    const project = items[active];
    slides.forEach((slide, i) => {
      const on = i === active;
      slide.classList.toggle("is-active", on);
      slide.setAttribute("aria-hidden", String(!on));
      // Proje sayfasına geçişte yalnızca aktif ekran, detay sayfasındaki ekrana dönüşür
      slide.firstElementChild.style.viewTransitionName = on ? `screen-${items[i].slug}` : "none";
    });
    layout();
    syncSelector();

    caption.replaceChildren(renderCaption(project));
    count.textContent = `${pad(active + 1)} / ${pad(items.length)}`;
    link.href = project.href;
    link.setAttribute("aria-label", ui("inspect_aria", { title: project.title }));
    prevBtn.disabled = active === 0;
    nextBtn.disabled = active === items.length - 1;
  }

  function go(index) {
    const next = Math.max(0, Math.min(items.length - 1, index));
    drag = 0;
    if (next === active) return layout();
    active = next;
    render();
  }

  prevBtn.addEventListener("click", () => go(active - 1));
  nextBtn.addEventListener("click", () => go(active + 1));

  // Klavye: vitrin içindeki herhangi bir öğe odaktayken
  root.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const keys = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: items.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    go(keys[e.key]);
  });

  // Yatay jest (dokunma + fare). Dikey jest tarayıcıya bırakılır (touch-action: pan-y).
  let start = null;
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId, mode: "pending", target: e.target };
  });

  stage.addEventListener("pointermove", (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (start.mode === "pending") {
      if (Math.abs(dx) < DRAG_LOCK && Math.abs(dy) < DRAG_LOCK) return;
      if (Math.abs(dy) > Math.abs(dx)) { start = null; return; }
      start.mode = "drag";
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("is-dragging");
    }
    if (reducedMotion.matches) return; // hareket azaltmada çark parmağı izlemez
    let d = -dx / (stage.clientWidth * 0.7);
    const atEdge = (d < 0 && active === 0) || (d > 0 && active === items.length - 1);
    if (atEdge) d *= 0.25; // uçlarda direnç
    drag = Math.max(-1, Math.min(1, d));
    layout();
  });

  function end(e) {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const wasDrag = start.mode === "drag";
    const target = start.target;
    start = null;
    stage.classList.remove("is-dragging");

    if (wasDrag && e.type === "pointerup" && Math.abs(dx) > SWIPE_THRESHOLD) {
      go(active + (dx < 0 ? 1 : -1));
    } else if (!wasDrag && e.type === "pointerup") {
      const slide = target.closest?.(".slide");
      if (slide) go(Number(slide.dataset.index)); // kenardaki projeye dokununca öne gelir
    } else {
      go(active); // eşik altı: yerine otur
    }
  }
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);

  window.addEventListener("resize", syncSelector);
  // Görsel yüklenince ekran genişliği kesinleşir; kırmızı seçici ona göre ayarlanır
  wheel.querySelectorAll("img").forEach((img) => img.addEventListener("load", syncSelector));
  render();
  // Fontlar/görseller yerleşince seçici genişliğini tazele
  requestAnimationFrame(syncSelector);

  return { go, get active() { return active; } };
}
