"use strict";

import { qsa } from "./utils.js";

/** FAQ accordion — works for both static and dynamically-rendered FAQ items. */
export function initFAQAccordion(container = document) {
  qsa(".faq", container).forEach((item) => {
    if (item.dataset.bound) return;
    item.dataset.bound = "true";
    const question = item.querySelector(".faq-q");
    if (!question) return;
    question.setAttribute("role", "button");
    question.setAttribute("tabindex", "0");
    const toggle = () => {
      const isOpen = item.classList.contains("open");
      qsa(".faq.open", container).forEach((other) => other !== item && other.classList.remove("open"));
      item.classList.toggle("open", !isOpen);
    };
    question.addEventListener("click", toggle);
    question.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
}

/** Subtle mouse-parallax drift on the hero gradient mesh (desktop only, reduced-motion safe). */
export function initHeroParallax() {
  const mesh = document.querySelector(".hero-mesh");
  if (!mesh) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 720px)").matches) return;

  let raf = null;
  window.addEventListener("mousemove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;
      mesh.style.transform = `translate(${x}px, ${y}px)`;
      raf = null;
    });
  });
}

/** Generic filter-chip group: click a chip, filter matching cards by data-category. */
export function initFilterChips(rowSelector, cardsSelector, onFilter) {
  const row = document.querySelector(rowSelector);
  if (!row) return;
  row.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    qsa(".filter-chip", row).forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const value = chip.dataset.filter || "all";
    if (typeof onFilter === "function") {
      onFilter(value);
      return;
    }
    qsa(cardsSelector).forEach((card) => {
      const match = value === "all" || card.dataset.category === value;
      card.style.display = match ? "" : "none";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => initFAQAccordion());
document.addEventListener("nexvora:content-updated", () => initFAQAccordion());
document.addEventListener("DOMContentLoaded", () => initHeroParallax());
