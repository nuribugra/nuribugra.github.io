import { projects } from "../../data/projects.js";
import { createShowcase } from "./showcase.js";

const root = document.querySelector(".showcase");
if (root) createShowcase(root, projects);
