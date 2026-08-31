// Navbar Elements
const navBtn = document.querySelector(".nav-btn");
const nav = document.querySelector("#nav");
const mainNav = document.querySelector(".main-nav");
const navItems = document.querySelectorAll(".nav-item");

let showMenu = false;

navBtn.addEventListener("click", toggleMenu);

function toggleMenu() {
   if (!showMenu) {
      navBtn.classList.add("open");
      nav.classList.add("open");
      mainNav.classList.add("open");
      navItems.forEach((item) => item.classList.add("open"));
      showMenu = true;
   } else {
      closeMenu();
   }
}

function closeMenu() {
   navBtn.classList.remove("open");
   nav.classList.remove("open");
   mainNav.classList.remove("open");
   navItems.forEach((item) => item.classList.remove("open"));
   showMenu = false;
}

// Smooth Scroll Links
const navLinks = [
   { id: "home-link", target: "home" },
   { id: "about-link", target: "about" },
   { id: "portfolio-link", target: "portfolio" },
   { id: "articles-link", target: "articles" },
   { id: "contact-link", target: "contact" }
];

navLinks.forEach(link => {
   const el = document.getElementById(link.id);
   if (el) {
      el.addEventListener("click", () => {
         document.getElementById(link.target).scrollIntoView({ behavior: 'smooth' });
         closeMenu();
      });
   }
});