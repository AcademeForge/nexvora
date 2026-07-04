"use strict";

import { qs, qsa, byId } from "./utils.js";

async function injectPartial(mountSelector, partialUrl) {
  const mount = qs(mountSelector);
  if (!mount) return;
  try {
    const res = await fetch(partialUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${partialUrl}`);
    mount.innerHTML = await res.text();
  } catch (err) {
    console.error("[nexvora] partial load failed:", err);
  }
}

function highlightActiveNav() {
  const path = location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
  const current = path === "/" || path === "" ? "index" : path.split("/").pop().replace(".html", "");

  qsa("[data-nav]").forEach((link) => {
    if (link.dataset.nav === current) link.setAttribute("aria-current", "page");
  });
}

function initHeaderScroll() {
  const header = byId("siteHeader");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileMenu() {
  const menu = byId("mobileMenu");
  const openBtn = byId("openMenu");
  const closeBtn = byId("closeMenu");
  if (!menu || !openBtn) return;

  const open = () => {
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    openBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("lock");
  };
  const close = () => {
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
    openBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("lock");
  };

  openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  qsa(".mlnk", menu).forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

function initReveal() {
  const items = qsa(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((i) => i.classList.add("show"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((i) => observer.observe(i));
}

function initYear() {
  const el = byId("year");
  if (el) el.textContent = new Date().getFullYear();
}

function initLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

async function bootLayout() {
  await Promise.all([
    injectPartial("#site-header-mount", "/partials/nav.html"),
    injectPartial("#site-footer-mount", "/partials/footer.html")
  ]);
  highlightActiveNav();
  initHeaderScroll();
  initMobileMenu();
  initYear();
  initLucideIcons();
  document.dispatchEvent(new CustomEvent("nexvora:layout-ready"));
}

document.addEventListener("DOMContentLoaded", () => {
  bootLayout();
  initReveal();
  document.addEventListener("nexvora:content-updated", initReveal);
  document.addEventListener("nexvora:content-updated", initLucideIcons);
});
