"use strict";

import { supabase } from "./supabase-client.js";
import { CONFIG } from "./config.js";
import { qs, qsa, esc, byId } from "./utils.js";
import { initFilterChips } from "./ui.js";

const grid = byId("portfolioGrid");
const filterRow = byId("portfolioFilters");
const emptyState = byId("portfolioEmpty");

let allProjects = [];

function cardTemplate(project) {
  const cover = project.cover_image_url || "";
  const techs = Array.isArray(project.technologies) ? project.technologies : [];
  return `
    <a href="/portfolio-detail.html?slug=${encodeURIComponent(project.slug)}" class="card project-card reveal" data-category="${esc(project.category || "")}">
      <div class="thumb" style="${cover ? `background-image:url('${esc(cover)}')` : ""}"></div>
      <div class="body">
        <span class="tag">${esc(project.category || "Project")}</span>
        <h3 style="margin-bottom:0;">${esc(project.title)}</h3>
        <p style="margin-bottom:0;">${esc(project.description || "").slice(0, 110)}${(project.description || "").length > 110 ? "…" : ""}</p>
        <div class="tag-row">
          ${techs.slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}
        </div>
        <div class="meta-row">
          <span>${esc(project.client || "")}</span>
          <span>${project.completion_date ? new Date(project.completion_date).getFullYear() : ""}</span>
        </div>
      </div>
    </a>`;
}

function skeletonCard() {
  return `<div class="card project-card"><div class="thumb skeleton"></div><div class="body">
    <div class="skeleton" style="height:14px;width:40%;border-radius:6px;"></div>
    <div class="skeleton" style="height:20px;width:70%;border-radius:6px;"></div>
    <div class="skeleton" style="height:40px;width:100%;border-radius:6px;"></div>
  </div></div>`;
}

function renderProjects(list) {
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }
  if (emptyState) emptyState.style.display = "none";
  grid.innerHTML = list.map(cardTemplate).join("");
  document.dispatchEvent(new CustomEvent("nexvora:content-updated"));
}

function buildFilters(list) {
  if (!filterRow) return;
  const categories = Array.from(new Set(list.map((p) => p.category).filter(Boolean)));
  filterRow.innerHTML = [
    `<button class="filter-chip active" data-filter="all">All Work</button>`,
    ...categories.map((c) => `<button class="filter-chip" data-filter="${esc(c)}">${esc(c)}</button>`)
  ].join("");
}

async function loadProjects() {
  if (grid) grid.innerHTML = Array.from({ length: 6 }).map(skeletonCard).join("");

  const { data, error } = await supabase
    .from(CONFIG.TABLES.PROJECTS)
    .select("id, title, slug, description, category, cover_image_url, technologies, client, completion_date, featured, is_case_study")
    .eq("published", true)
    .order("completion_date", { ascending: false });

  if (error) {
    console.error("[nexvora] failed to load projects:", error);
    if (grid) grid.innerHTML = `<p class="empty-state">We couldn't load the portfolio right now. Please refresh or try again shortly.</p>`;
    return;
  }

  allProjects = data || [];
  buildFilters(allProjects);
  renderProjects(allProjects);
}

function filterByCategory(category) {
  const filtered = category === "all" ? allProjects : allProjects.filter((p) => p.category === category);
  renderProjects(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!grid) return;
  loadProjects();
  initFilterChips("#portfolioFilters", ".project-card", filterByCategory);
});
