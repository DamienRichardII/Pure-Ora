// navigation.js — Header au scroll, menu mobile plein écran, marquage du lien actif.

function initHeaderScroll() {
  const header = document.getElementById("site-header");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const close = document.getElementById("menu-close");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.add("is-open");
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    const firstLink = menu.querySelector("a");
    if (firstLink) firstLink.focus();
  };
  const closeMenu = () => {
    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  };

  toggle.addEventListener("click", open);
  close?.addEventListener("click", closeMenu);
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
  });
}

function markActiveNav() {
  const current = (location.pathname.split("/").pop() || "index.html").replace(/^$/, "index.html");
  document.querySelectorAll(".site-header__nav a, .mobile-menu__list a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === current) a.setAttribute("aria-current", "page");
  });
}

function toggleSearchVisibility() {
  const searchToggle = document.getElementById("search-toggle");
  if (!searchToggle) return;
  const products = window.PureOra?.products || [];
  searchToggle.hidden = products.length <= 1;
}

document.addEventListener("pureora:components-ready", () => {
  initHeaderScroll();
  initMobileMenu();
  markActiveNav();
  toggleSearchVisibility();
});
