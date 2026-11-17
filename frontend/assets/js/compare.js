// Önce / sonra karşılaştırması: çizgi sürüklenir, dokunulan yere atlar, ok tuşlarıyla kayar.
// Dikey kaydırma tarayıcıda kalır; yalnızca yatay hareket kaydırıcıyı yönetir.

const LOCK = 8; // px — jestin yatay mı dikey mi olduğuna karar verilen mesafe

export function initCompare(root) {
  const stage = root.querySelector("[data-compare-stage]");
  const handle = root.querySelector("[data-compare-handle]");
  let pos = 50;

  function set(value) {
    pos = Math.max(0, Math.min(100, value));
    stage.style.setProperty("--pos", `${pos}%`);
    const rounded = Math.round(pos);
    handle.setAttribute("aria-valuenow", String(rounded));
    handle.setAttribute("aria-valuetext", `Yüzde ${100 - rounded} sonra`);
  }

  const fromEvent = (e) => {
    const r = stage.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };

  let start = null;
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId, mode: "pending" };
    // Fareyle doğrudan sürükleme; dokunmada önce yön beklenir
    if (e.pointerType === "mouse") {
      start.mode = "drag";
      stage.setPointerCapture(e.pointerId);
      set(fromEvent(e));
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!start || e.pointerId !== start.id) return;
    if (start.mode === "pending") {
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx < LOCK && dy < LOCK) return;
      if (dy > dx) { start = null; return; }
      start.mode = "drag";
      stage.setPointerCapture(e.pointerId);
    }
    set(fromEvent(e));
  });
  const end = (e) => {
    if (!start || e.pointerId !== start.id) return;
    if (start.mode === "pending" && e.type === "pointerup") set(fromEvent(e)); // dokunma: oraya atla
    start = null;
  };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);

  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 20 : 5;
    const map = { ArrowLeft: pos - step, ArrowRight: pos + step, Home: 0, End: 100 };
    if (!(e.key in map)) return;
    e.preventDefault();
    set(map[e.key]);
  });

  set(50);
}

// Uzun ekran görüntüsü: önce kısaltılmış, düğmeyle tamamı açılır
export function initFullpage(root) {
  const frame = root.querySelector("[data-fullpage-frame]");
  const toggle = root.querySelector("[data-fullpage-toggle]");
  toggle.addEventListener("click", () => {
    const open = frame.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Sayfayı kısalt" : "Sayfanın tamamını göster";
    if (!open) frame.scrollIntoView({ block: "nearest" });
  });
}
