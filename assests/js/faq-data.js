"use strict";

import { supabase } from "./supabase-client.js";
import { CONFIG } from "./config.js";
import { esc, byId } from "./utils.js";
import { initFAQAccordion } from "./ui.js";

function faqTemplate(f) {
  return `
    <div class="faq reveal">
      <div class="faq-q">
        <span>${esc(f.question)}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <div class="faq-a"><p>${esc(f.answer)}</p></div>
    </div>`;
}

export async function loadFAQs(mountId, category = null) {
  const mount = byId(mountId);
  if (!mount) return;

  let query = supabase
    .from(CONFIG.TABLES.FAQS)
    .select("id, question, answer, category")
    .eq("published", true)
    .order("display_order", { ascending: true });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;

  if (error) {
    console.error("[nexvora] failed to load FAQs:", error);
    return;
  }
  if (!data || !data.length) return;

  mount.innerHTML = data.map(faqTemplate).join("");
  initFAQAccordion(mount);
  document.dispatchEvent(new CustomEvent("nexvora:content-updated"));
}

document.addEventListener("DOMContentLoaded", () => {
  qsaFaqMounts().forEach((mount) => loadFAQs(mount.id, mount.dataset.category || null));
});

function qsaFaqMounts() {
  return Array.from(document.querySelectorAll("[data-faq-mount]"));
}
