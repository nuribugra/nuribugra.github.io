import { projects } from "../../data/projects.js";
import { createShowcase } from "./showcase.js";

const root = document.querySelector(".showcase");
if (root) createShowcase(root, projects);

// "Adresi kopyala": e-posta adresini panoya kopyalar ve sonucu ekran okuyuculara da bildirir
const copyBtn = document.querySelector("[data-copy]");
const copyStatus = document.querySelector("[data-copy-status]");
if (copyBtn && copyStatus) {
  let timer;
  copyBtn.addEventListener("click", async () => {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copy);
      copyStatus.textContent = "Adres panoya kopyalandı.";
    } catch {
      copyStatus.textContent = `Kopyalanamadı: ${copyBtn.dataset.copy}`;
    }
    timer = setTimeout(() => { copyStatus.textContent = ""; }, 3000);
  });
}
