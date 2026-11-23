import { guardImages } from "./placeholder.js";
import { initCompare, initFullpage } from "./compare.js";
import { initToTop } from "./ui.js";

// Eksik görseller işaretli yer tutucuya dönüşür
guardImages();

document.querySelectorAll("[data-compare]").forEach(initCompare);
document.querySelectorAll("[data-fullpage]").forEach(initFullpage);
initToTop();
