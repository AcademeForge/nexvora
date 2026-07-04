"use strict";

import { supabase } from "./supabase-client.js";
import { CONFIG } from "./config.js";
import { esc, byId, formatDate } from "./utils.js";

const root = byId("projectDetailRoot");

function getSlug() {
  return new URLSearchParams(location.search).get("slug");
}

function listContext() {
  const listUrl = (root && root.dataset.listUrl) || "/portfolio.html";
  const listLabel = (root && root.dataset.listLabel) || "Portfolio";
  return { listUrl, listLabel };
}

function renderNotFound() {
  if (!root) return;
  const { listUrl, listLabel } = listContext();
  root.innerHTML = `
    <div class="empty-state">
      <h2>Not found</h2>
      <p>The item you're looking for may have been moved or unpublished.</p>
      <a href="${listUrl}" class="btn btn-primary">Back to ${esc(listLabel)}</a>
    </div>`;
}

function updateMeta(project) {
  document.title = `${project.title} — Nexvora Studio Portfolio`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", (project.seo_description || project.description || "").slice(0, 160));

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", project.title);
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && project.cover_image_url) ogImage.setAttribute("content", project.cover_image_url);

  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    image: project.cover_image_url,
    creator: { "@type": "Organization", name: "Nexvora Studio" },
    dateCreated: project.completion_date
  });
  document.head.appendChild(ld);
}

function render(project) {
  updateMeta(project);
  const techs = Array.isArray(project.technologies) ? project.technologies : [];
  const gallery = Array.isArray(project.gallery) ? project.gallery : [];

  const { listUrl, listLabel } = listContext();
  root.innerHTML = `
    <div class="breadcrumb">
      <a href="${listUrl}">${esc(listLabel)}</a> <span aria-hidden="true">/</span> <span>${esc(project.title)}</span>
    </div>
    <span class="tag" style="margin-bottom:1rem;display:inline-block;">${esc(project.category || "Project")}</span>
    <h1>${esc(project.title)}</h1>
    <p class="lede" style="max-width:720px;font-size:var(--fs-lg);">${esc(project.description || "")}</p>

    <div class="detail-hero-img" style="${project.cover_image_url ? `background-image:url('${esc(project.cover_image_url)}')` : ""}"></div>

    <div class="detail-meta">
      <div class="item"><span>Client</span>${esc(project.client || "—")}</div>
      <div class="item"><span>Completed</span>${project.completion_date ? formatDate(project.completion_date) : "—"}</div>
      <div class="item"><span>Category</span>${esc(project.category || "—")}</div>
      <div class="item"><span>Links</span>
        ${project.live_url ? `<a href="${esc(project.live_url)}" target="_blank" rel="noopener">Live Site ↗</a>` : ""}
        ${project.github_url ? `<br><a href="${esc(project.github_url)}" target="_blank" rel="noopener">Source ↗</a>` : ""}
        ${!project.live_url && !project.github_url ? "—" : ""}
      </div>
    </div>

    <div class="detail-columns">
      <div class="rich-content">
        ${project.challenge ? `<h2>The Challenge</h2><p>${esc(project.challenge)}</p>` : ""}
        ${project.solution ? `<h2>The Solution</h2><p>${esc(project.solution)}</p>` : ""}
        ${project.results ? `<h2>The Results</h2><p>${esc(project.results)}</p>` : ""}
        ${gallery.length ? `<h2>Gallery</h2>${gallery.map((g) => `<img src="${esc(g)}" alt="${esc(project.title)} screenshot" loading="lazy">`).join("")}` : ""}
      </div>
      <aside>
        <div class="card">
          <h3>Technology Stack</h3>
          <div class="tag-row">${techs.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>
        <div class="card" style="margin-top:1.5rem;">
          <h3>Have a similar project?</h3>
          <p>Let's talk about what you're building.</p>
          <a href="/contact.html" class="btn btn-primary btn-block">Start Your Project</a>
        </div>
      </aside>
    </div>`;

  document.dispatchEvent(new CustomEvent("nexvora:content-updated"));
}

async function loadProject() {
  const slug = getSlug();
  if (!slug) return renderNotFound();

  let query = supabase
    .from(CONFIG.TABLES.PROJECTS)
    .select("*")
    .eq("slug", slug)
    .eq("published", true);

  if (root && root.dataset.requireCaseStudy === "true") {
    query = query.eq("is_case_study", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    console.error("[nexvora] project fetch error:", error);
    return renderNotFound();
  }
  render(data);
}

document.addEventListener("DOMContentLoaded", () => {
  if (root) loadProject();
});
