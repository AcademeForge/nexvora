"use strict";

import { supabase } from "./supabase-client.js";
import { CONFIG } from "./config.js";
import { esc, byId } from "./utils.js";

const grid = byId("testimonialsGrid");

function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function cardTemplate(t) {
  return `
    <div class="card testimonial-card reveal">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:var(--primary);" stroke-width="1.5"><path d="M7.5 5C4.5 5 2 7.5 2 11c0 2.5 1.5 4 3.5 4.5-.5 1.5-1.5 2.5-3 3v1.5c3.5-.5 6-3 6-7V5H7.5Zm11 0c-3 0-5.5 2.5-5.5 6 0 2.5 1.5 4 3.5 4.5-.5 1.5-1.5 2.5-3 3v1.5c3.5-.5 6-3 6-7V5h-1Z"/></svg>
      <p class="testimonial-quote">"${esc(t.quote)}"</p>
      <div class="testimonial-person">
        <span class="avatar">${esc(initials(t.author_name))}</span>
        <div>
          <strong style="display:block;font-size:var(--fs-sm);">${esc(t.author_name)}</strong>
          <span class="muted" style="font-size:var(--fs-xs);">${esc(t.author_role || "")}${t.company ? `, ${esc(t.company)}` : ""}</span>
        </div>
      </div>
    </div>`;
}

async function loadTestimonials() {
  if (!grid) return;
  const { data, error } = await supabase
    .from(CONFIG.TABLES.TESTIMONIALS)
    .select("id, quote, author_name, author_role, company, rating")
    .eq("published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[nexvora] failed to load testimonials:", error);
    grid.innerHTML = "";
    return;
  }
  if (!data || !data.length) { grid.innerHTML = ""; return; }
  grid.innerHTML = data.map(cardTemplate).join("");
  document.dispatchEvent(new CustomEvent("nexvora:content-updated"));
}

document.addEventListener("DOMContentLoaded", loadTestimonials);
