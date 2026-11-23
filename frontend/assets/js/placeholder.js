import { ui } from "./ui.js";

// İşaretli yer tutucu: gerçek görsel yoksa ya da yüklenemezse gösterilir.
// Beklenen dosya yolu görünür, böylece hangi görselin eksik olduğu belli olur.

export function placeholder(label, path) {
  const box = document.createElement("div");
  box.className = "screen__placeholder";
  const tag = document.createElement("strong");
  tag.textContent = ui("placeholder");
  const text = document.createElement("span");
  text.textContent = ui("placeholder_text", { label });
  const code = document.createElement("code");
  code.textContent = path ?? "";
  box.append(tag, text, code);
  box.setAttribute("role", "img");
  box.setAttribute("aria-label", ui("placeholder_aria", { label }));
  return box;
}

// HTML'de yazılmış <img data-placeholder="Etiket"> öğeleri için:
// görsel yüklenemezse yerine işaretli yer tutucu konur.
export function guardImages(root = document) {
  root.querySelectorAll("img[data-placeholder]").forEach((img) => {
    const swap = () => img.replaceWith(placeholder(img.dataset.placeholder, img.getAttribute("src")));
    if (img.complete && img.naturalWidth === 0) swap();
    else img.addEventListener("error", swap, { once: true });
  });
}
