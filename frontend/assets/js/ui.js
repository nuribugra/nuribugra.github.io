// Arayüz metinleri: her sayfa kendi dilindeki metinleri <script id="ui-strings"> içinde taşır
// (site/i18n/*.json → "ui" bölümü). Böylece JavaScript dosyaları dilden bağımsız kalır.

let strings = {};
try {
  strings = JSON.parse(document.getElementById("ui-strings")?.textContent || "{}");
} catch { /* metinler yoksa anahtar adları gösterilir */ }

export const lang = document.documentElement.lang?.startsWith("en") ? "en" : "tr";

// ui("inspect_aria", { title: "Jakovs" }) → "Jakovs projesini incele"
export function ui(key, vars = {}) {
  const template = strings[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

// Sayfa sonundaki "Başa dön" düğmesi (adres çubuğuna # eklemeden)
export function initToTop() {
  document.querySelectorAll("[data-to-top]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    })
  );
}
