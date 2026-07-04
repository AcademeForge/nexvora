"use strict";

import { supabase } from "./supabase-client.js";
import { CONFIG } from "./config.js";
import { qs, qsa, byId, esc, slugify, formatDate, friendlyErrorMessage, setFormStatus } from "./utils.js";

/* ────────────────────────────────────────────────────────────────────────
   Tab navigation
   ──────────────────────────────────────────────────────────────────────── */

const PANELS = ["projects", "blog", "testimonials", "faqs", "messages"];

function initTabs() {
  const links = qsa("[data-panel-link]");
  const panels = qsa("[data-panel]");

  function activate(name) {
    links.forEach((l) => l.classList.toggle("active", l.dataset.panelLink === name));
    panels.forEach((p) => (p.style.display = p.dataset.panel === name ? "" : "none"));
    location.hash = name;
    const sidebar = byId("adminSidebar");
    if (sidebar) sidebar.classList.remove("open");
  }

  links.forEach((l) => l.addEventListener("click", (e) => { e.preventDefault(); activate(l.dataset.panelLink); }));

  const initial = PANELS.includes(location.hash.replace("#", "")) ? location.hash.replace("#", "") : "projects";
  activate(initial);

  const sidebarToggle = byId("sidebarToggle");
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => byId("adminSidebar").classList.toggle("open"));
  }
}

/* ────────────────────────────────────────────────────────────────────────
   Modal helpers
   ──────────────────────────────────────────────────────────────────────── */

function openModal(title, bodyHtml) {
  const overlay = byId("adminModal");
  byId("adminModalTitle").textContent = title;
  byId("adminModalBody").innerHTML = bodyHtml;
  overlay.classList.add("open");
  document.body.classList.add("lock");
}
function closeModal() {
  const overlay = byId("adminModal");
  overlay.classList.remove("open");
  document.body.classList.remove("lock");
  byId("adminModalBody").innerHTML = "";
}
function initModal() {
  const overlay = byId("adminModal");
  if (!overlay) return;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  byId("adminModalClose").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

function toArrayField(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ────────────────────────────────────────────────────────────────────────
   PROJECTS
   ──────────────────────────────────────────────────────────────────────── */

async function fetchProjects() {
  const { data, error } = await supabase
    .from(CONFIG.TABLES.PROJECTS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

function projectFormHtml(p = {}) {
  return `
    <form id="projectForm" class="grid" style="gap:1rem;">
      <input type="hidden" name="id" value="${esc(p.id || "")}">
      <div class="field"><label>Title <span class="required">*</span></label><input name="title" required value="${esc(p.title || "")}"></div>
      <div class="field"><label>Slug <span class="required">*</span></label><input name="slug" required value="${esc(p.slug || "")}"><span class="hint">Auto-generated from title if left blank</span></div>
      <div class="field"><label>Description</label><textarea name="description" rows="3">${esc(p.description || "")}</textarea></div>
      <div class="form-grid">
        <div class="field"><label>Category</label><input name="category" value="${esc(p.category || "")}" placeholder="e.g. SaaS, Mobile, AI"></div>
        <div class="field"><label>Client</label><input name="client" value="${esc(p.client || "")}"></div>
        <div class="field"><label>Completion Date</label><input type="date" name="completion_date" value="${p.completion_date ? p.completion_date.slice(0,10) : ""}"></div>
        <div class="field"><label>Cover Image URL</label><input name="cover_image_url" value="${esc(p.cover_image_url || "")}" placeholder="Supabase Storage public URL"></div>
        <div class="field"><label>Live URL</label><input name="live_url" value="${esc(p.live_url || "")}"></div>
        <div class="field"><label>GitHub URL</label><input name="github_url" value="${esc(p.github_url || "")}"></div>
      </div>
      <div class="field"><label>Technologies (comma separated)</label><input name="technologies" value="${esc((p.technologies || []).join(", "))}"></div>
      <div class="field"><label>Gallery Image URLs (comma separated)</label><input name="gallery" value="${esc((p.gallery || []).join(", "))}"></div>
      <div class="field"><label>Challenge</label><textarea name="challenge" rows="2">${esc(p.challenge || "")}</textarea></div>
      <div class="field"><label>Solution</label><textarea name="solution" rows="2">${esc(p.solution || "")}</textarea></div>
      <div class="field"><label>Results</label><textarea name="results" rows="2">${esc(p.results || "")}</textarea></div>
      <div class="field"><label>SEO Description</label><textarea name="seo_description" rows="2">${esc(p.seo_description || "")}</textarea></div>
      <div class="form-grid">
        <label class="flex items-center gap-1"><input type="checkbox" name="featured" ${p.featured ? "checked" : ""}> Featured</label>
        <label class="flex items-center gap-1"><input type="checkbox" name="is_case_study" ${p.is_case_study ? "checked" : ""}> Show as Case Study</label>
        <label class="flex items-center gap-1"><input type="checkbox" name="published" ${p.published !== false ? "checked" : ""}> Published</label>
      </div>
      <div class="form-status" id="projectFormStatus"></div>
      <button type="submit" class="btn btn-primary btn-block"><span class="btn-label">Save Project</span></button>
    </form>`;
}

function bindProjectForm(existing) {
  const form = byId("projectForm");
  const statusEl = byId("projectFormStatus");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    const slug = slugify(form.slug.value.trim() || title);

    const payload = {
      title,
      slug,
      description: form.description.value.trim() || null,
      category: form.category.value.trim() || null,
      client: form.client.value.trim() || null,
      completion_date: form.completion_date.value || null,
      cover_image_url: form.cover_image_url.value.trim() || null,
      live_url: form.live_url.value.trim() || null,
      github_url: form.github_url.value.trim() || null,
      technologies: toArrayField(form.technologies.value),
      gallery: toArrayField(form.gallery.value),
      challenge: form.challenge.value.trim() || null,
      solution: form.solution.value.trim() || null,
      results: form.results.value.trim() || null,
      seo_description: form.seo_description.value.trim() || null,
      featured: form.featured.checked,
      is_case_study: form.is_case_study.checked,
      published: form.published.checked
    };

    try {
      if (existing && existing.id) {
        const { error } = await supabase.from(CONFIG.TABLES.PROJECTS).update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(CONFIG.TABLES.PROJECTS).insert([payload]);
        if (error) throw error;
      }
      closeModal();
      renderProjectsPanel();
    } catch (err) {
      setFormStatus(statusEl, "error", friendlyErrorMessage(err.message));
    }
  });
}

async function renderProjectsPanel() {
  const tbody = byId("projectsTbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
  try {
    const projects = await fetchProjects();
    if (!projects.length) {
      tbody.innerHTML = `<tr><td colspan="6">No projects yet. Click "New Project" to add one.</td></tr>`;
      return;
    }
    tbody.innerHTML = projects
      .map(
        (p) => `
      <tr>
        <td>${esc(p.title)}</td>
        <td>${esc(p.category || "—")}</td>
        <td>${esc(p.client || "—")}</td>
        <td><span class="status-pill ${p.published ? "published" : "draft"}">${p.published ? "Published" : "Draft"}</span></td>
        <td>${p.completion_date ? formatDate(p.completion_date) : "—"}</td>
        <td class="flex gap-1">
          <button class="icon-action" data-edit-project="${p.id}" aria-label="Edit ${esc(p.title)}">✎</button>
          <button class="icon-action" data-delete-project="${p.id}" aria-label="Delete ${esc(p.title)}">✕</button>
        </td>
      </tr>`
      )
      .join("");

    qsa("[data-edit-project]", tbody).forEach((btn) =>
      btn.addEventListener("click", () => {
        const project = projects.find((p) => p.id === btn.dataset.editProject);
        openModal("Edit Project", projectFormHtml(project));
        bindProjectForm(project);
      })
    );
    qsa("[data-delete-project]", tbody).forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this project permanently?")) return;
        const { error } = await supabase.from(CONFIG.TABLES.PROJECTS).delete().eq("id", btn.dataset.deleteProject);
        if (error) { alert(friendlyErrorMessage(error.message)); return; }
        renderProjectsPanel();
      })
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${esc(friendlyErrorMessage(err.message))}</td></tr>`;
  }
}

function initProjectsPanel() {
  const newBtn = byId("newProjectBtn");
  if (newBtn) newBtn.addEventListener("click", () => { openModal("New Project", projectFormHtml()); bindProjectForm(null); });
  renderProjectsPanel();
}

/* ────────────────────────────────────────────────────────────────────────
   BLOG POSTS
   ──────────────────────────────────────────────────────────────────────── */

async function fetchPosts() {
  const { data, error } = await supabase
    .from(CONFIG.TABLES.BLOG_POSTS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

function postFormHtml(p = {}) {
  return `
    <form id="postForm" class="grid" style="gap:1rem;">
      <input type="hidden" name="id" value="${esc(p.id || "")}">
      <div class="field"><label>Title <span class="required">*</span></label><input name="title" required value="${esc(p.title || "")}"></div>
      <div class="field"><label>Slug <span class="required">*</span></label><input name="slug" required value="${esc(p.slug || "")}"></div>
      <div class="field"><label>Excerpt</label><textarea name="excerpt" rows="2">${esc(p.excerpt || "")}</textarea></div>
      <div class="field"><label>Content (HTML)</label><textarea name="content" rows="8">${esc(p.content || "")}</textarea><span class="hint">Rich HTML content — rendered through DOMPurify on the frontend.</span></div>
      <div class="form-grid">
        <div class="field"><label>Category</label><input name="category" value="${esc(p.category || "")}"></div>
        <div class="field"><label>Tags (comma separated)</label><input name="tags" value="${esc((p.tags || []).join(", "))}"></div>
        <div class="field"><label>Featured Image URL</label><input name="featured_image_url" value="${esc(p.featured_image_url || "")}"></div>
        <div class="field"><label>Reading Time (minutes)</label><input type="number" min="1" name="reading_time_minutes" value="${p.reading_time_minutes || ""}"></div>
        <div class="field"><label>Status</label>
          <select name="status">
            <option value="draft" ${p.status === "draft" ? "selected" : ""}>Draft</option>
            <option value="published" ${p.status === "published" || !p.status ? "selected" : ""}>Published</option>
          </select>
        </div>
        <div class="field"><label>Published At</label><input type="datetime-local" name="published_at" value="${p.published_at ? p.published_at.slice(0,16) : ""}"></div>
      </div>
      <div class="field"><label>SEO Description</label><textarea name="seo_description" rows="2">${esc(p.seo_description || "")}</textarea></div>
      <div class="form-status" id="postFormStatus"></div>
      <button type="submit" class="btn btn-primary btn-block"><span class="btn-label">Save Post</span></button>
    </form>`;
}

function bindPostForm(existing) {
  const form = byId("postForm");
  const statusEl = byId("postFormStatus");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    const slug = slugify(form.slug.value.trim() || title);

    const payload = {
      title,
      slug,
      excerpt: form.excerpt.value.trim() || null,
      content: form.content.value,
      category: form.category.value.trim() || null,
      tags: toArrayField(form.tags.value),
      featured_image_url: form.featured_image_url.value.trim() || null,
      reading_time_minutes: form.reading_time_minutes.value ? Number(form.reading_time_minutes.value) : null,
      status: form.status.value,
      published_at: form.published_at.value ? new Date(form.published_at.value).toISOString() : new Date().toISOString(),
      seo_description: form.seo_description.value.trim() || null
    };

    try {
      if (existing && existing.id) {
        const { error } = await supabase.from(CONFIG.TABLES.BLOG_POSTS).update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(CONFIG.TABLES.BLOG_POSTS).insert([payload]);
        if (error) throw error;
      }
      closeModal();
      renderBlogPanel();
    } catch (err) {
      setFormStatus(statusEl, "error", friendlyErrorMessage(err.message));
    }
  });
}

async function renderBlogPanel() {
  const tbody = byId("postsTbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
  try {
    const posts = await fetchPosts();
    if (!posts.length) {
      tbody.innerHTML = `<tr><td colspan="5">No blog posts yet. Click "New Post" to add one.</td></tr>`;
      return;
    }
    tbody.innerHTML = posts
      .map(
        (p) => `
      <tr>
        <td>${esc(p.title)}</td>
        <td>${esc(p.category || "—")}</td>
        <td><span class="status-pill ${p.status === "published" ? "published" : "draft"}">${esc(p.status || "draft")}</span></td>
        <td>${p.published_at ? formatDate(p.published_at) : "—"}</td>
        <td class="flex gap-1">
          <button class="icon-action" data-edit-post="${p.id}" aria-label="Edit ${esc(p.title)}">✎</button>
          <button class="icon-action" data-delete-post="${p.id}" aria-label="Delete ${esc(p.title)}">✕</button>
        </td>
      </tr>`
      )
      .join("");

    qsa("[data-edit-post]", tbody).forEach((btn) =>
      btn.addEventListener("click", () => {
        const post = posts.find((p) => p.id === btn.dataset.editPost);
        openModal("Edit Blog Post", postFormHtml(post));
        bindPostForm(post);
      })
    );
    qsa("[data-delete-post]", tbody).forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this post permanently?")) return;
        const { error } = await supabase.from(CONFIG.TABLES.BLOG_POSTS).delete().eq("id", btn.dataset.deletePost);
        if (error) { alert(friendlyErrorMessage(error.message)); return; }
        renderBlogPanel();
      })
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">${esc(friendlyErrorMessage(err.message))}</td></tr>`;
  }
}

function initBlogPanel() {
  const newBtn = byId("newPostBtn");
  if (newBtn) newBtn.addEventListener("click", () => { openModal("New Blog Post", postFormHtml()); bindPostForm(null); });
  renderBlogPanel();
}

/* ────────────────────────────────────────────────────────────────────────
   TESTIMONIALS
   ──────────────────────────────────────────────────────────────────────── */

async function fetchTestimonials() {
  const { data, error } = await supabase
    .from(CONFIG.TABLES.TESTIMONIALS)
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

function testimonialFormHtml(t = {}) {
  return `
    <form id="testimonialForm" class="grid" style="gap:1rem;">
      <input type="hidden" name="id" value="${esc(t.id || "")}">
      <div class="field"><label>Quote <span class="required">*</span></label><textarea name="quote" required rows="3">${esc(t.quote || "")}</textarea></div>
      <div class="form-grid">
        <div class="field"><label>Author Name <span class="required">*</span></label><input name="author_name" required value="${esc(t.author_name || "")}"></div>
        <div class="field"><label>Author Role</label><input name="author_role" value="${esc(t.author_role || "")}"></div>
        <div class="field"><label>Company</label><input name="company" value="${esc(t.company || "")}"></div>
        <div class="field"><label>Rating (1-5)</label><input type="number" min="1" max="5" name="rating" value="${t.rating || 5}"></div>
        <div class="field"><label>Display Order</label><input type="number" name="display_order" value="${t.display_order || 0}"></div>
        <label class="flex items-center gap-1"><input type="checkbox" name="published" ${t.published !== false ? "checked" : ""}> Published</label>
      </div>
      <div class="form-status" id="testimonialFormStatus"></div>
      <button type="submit" class="btn btn-primary btn-block"><span class="btn-label">Save Testimonial</span></button>
    </form>`;
}

function bindTestimonialForm(existing) {
  const form = byId("testimonialForm");
  const statusEl = byId("testimonialFormStatus");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      quote: form.quote.value.trim(),
      author_name: form.author_name.value.trim(),
      author_role: form.author_role.value.trim() || null,
      company: form.company.value.trim() || null,
      rating: Number(form.rating.value) || 5,
      display_order: Number(form.display_order.value) || 0,
      published: form.published.checked
    };
    try {
      if (existing && existing.id) {
        const { error } = await supabase.from(CONFIG.TABLES.TESTIMONIALS).update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(CONFIG.TABLES.TESTIMONIALS).insert([payload]);
        if (error) throw error;
      }
      closeModal();
      renderTestimonialsPanel();
    } catch (err) {
      setFormStatus(statusEl, "error", friendlyErrorMessage(err.message));
    }
  });
}

async function renderTestimonialsPanel() {
  const tbody = byId("testimonialsTbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4">Loading…</td></tr>`;
  try {
    const items = await fetchTestimonials();
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="4">No testimonials yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map(
        (t) => `
      <tr>
        <td>${esc(t.author_name)}</td>
        <td>${esc(t.company || "—")}</td>
        <td><span class="status-pill ${t.published ? "published" : "draft"}">${t.published ? "Published" : "Hidden"}</span></td>
        <td class="flex gap-1">
          <button class="icon-action" data-edit-testimonial="${t.id}" aria-label="Edit ${esc(t.author_name)}">✎</button>
          <button class="icon-action" data-delete-testimonial="${t.id}" aria-label="Delete ${esc(t.author_name)}">✕</button>
        </td>
      </tr>`
      )
      .join("");

    qsa("[data-edit-testimonial]", tbody).forEach((btn) =>
      btn.addEventListener("click", () => {
        const t = items.find((i) => i.id === btn.dataset.editTestimonial);
        openModal("Edit Testimonial", testimonialFormHtml(t));
        bindTestimonialForm(t);
      })
    );
    qsa("[data-delete-testimonial]", tbody).forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this testimonial?")) return;
        const { error } = await supabase.from(CONFIG.TABLES.TESTIMONIALS).delete().eq("id", btn.dataset.deleteTestimonial);
        if (error) { alert(friendlyErrorMessage(error.message)); return; }
        renderTestimonialsPanel();
      })
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">${esc(friendlyErrorMessage(err.message))}</td></tr>`;
  }
}

function initTestimonialsPanel() {
  const newBtn = byId("newTestimonialBtn");
  if (newBtn) newBtn.addEventListener("click", () => { openModal("New Testimonial", testimonialFormHtml()); bindTestimonialForm(null); });
  renderTestimonialsPanel();
}

/* ────────────────────────────────────────────────────────────────────────
   FAQS
   ──────────────────────────────────────────────────────────────────────── */

async function fetchFaqs() {
  const { data, error } = await supabase
    .from(CONFIG.TABLES.FAQS)
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

function faqFormHtml(f = {}) {
  return `
    <form id="faqForm" class="grid" style="gap:1rem;">
      <input type="hidden" name="id" value="${esc(f.id || "")}">
      <div class="field"><label>Question <span class="required">*</span></label><input name="question" required value="${esc(f.question || "")}"></div>
      <div class="field"><label>Answer <span class="required">*</span></label><textarea name="answer" required rows="4">${esc(f.answer || "")}</textarea></div>
      <div class="form-grid">
        <div class="field"><label>Category</label><input name="category" value="${esc(f.category || "")}" placeholder="e.g. pricing, general"></div>
        <div class="field"><label>Display Order</label><input type="number" name="display_order" value="${f.display_order || 0}"></div>
        <label class="flex items-center gap-1"><input type="checkbox" name="published" ${f.published !== false ? "checked" : ""}> Published</label>
      </div>
      <div class="form-status" id="faqFormStatus"></div>
      <button type="submit" class="btn btn-primary btn-block"><span class="btn-label">Save FAQ</span></button>
    </form>`;
}

function bindFaqForm(existing) {
  const form = byId("faqForm");
  const statusEl = byId("faqFormStatus");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      question: form.question.value.trim(),
      answer: form.answer.value.trim(),
      category: form.category.value.trim() || null,
      display_order: Number(form.display_order.value) || 0,
      published: form.published.checked
    };
    try {
      if (existing && existing.id) {
        const { error } = await supabase.from(CONFIG.TABLES.FAQS).update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(CONFIG.TABLES.FAQS).insert([payload]);
        if (error) throw error;
      }
      closeModal();
      renderFaqsPanel();
    } catch (err) {
      setFormStatus(statusEl, "error", friendlyErrorMessage(err.message));
    }
  });
}

async function renderFaqsPanel() {
  const tbody = byId("faqsTbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4">Loading…</td></tr>`;
  try {
    const items = await fetchFaqs();
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="4">No FAQs yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map(
        (f) => `
      <tr>
        <td>${esc(f.question)}</td>
        <td>${esc(f.category || "—")}</td>
        <td><span class="status-pill ${f.published ? "published" : "draft"}">${f.published ? "Published" : "Hidden"}</span></td>
        <td class="flex gap-1">
          <button class="icon-action" data-edit-faq="${f.id}" aria-label="Edit FAQ">✎</button>
          <button class="icon-action" data-delete-faq="${f.id}" aria-label="Delete FAQ">✕</button>
        </td>
      </tr>`
      )
      .join("");

    qsa("[data-edit-faq]", tbody).forEach((btn) =>
      btn.addEventListener("click", () => {
        const f = items.find((i) => i.id === btn.dataset.editFaq);
        openModal("Edit FAQ", faqFormHtml(f));
        bindFaqForm(f);
      })
    );
    qsa("[data-delete-faq]", tbody).forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this FAQ?")) return;
        const { error } = await supabase.from(CONFIG.TABLES.FAQS).delete().eq("id", btn.dataset.deleteFaq);
        if (error) { alert(friendlyErrorMessage(error.message)); return; }
        renderFaqsPanel();
      })
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">${esc(friendlyErrorMessage(err.message))}</td></tr>`;
  }
}

function initFaqsPanel() {
  const newBtn = byId("newFaqBtn");
  if (newBtn) newBtn.addEventListener("click", () => { openModal("New FAQ", faqFormHtml()); bindFaqForm(null); });
  renderFaqsPanel();
}

/* ────────────────────────────────────────────────────────────────────────
   CONTACT MESSAGES (read / mark-read / delete only — created by the public form)
   ──────────────────────────────────────────────────────────────────────── */

async function fetchMessages() {
  const { data, error } = await supabase
    .from(CONFIG.TABLES.CONTACT_MESSAGES)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

function messageDetailHtml(m) {
  return `
    <div class="grid" style="gap:0.85rem;">
      <div><strong>Name:</strong> ${esc(m.name)}</div>
      <div><strong>Email:</strong> <a href="mailto:${esc(m.email)}">${esc(m.email)}</a></div>
      <div><strong>Company:</strong> ${esc(m.company || "—")}</div>
      <div><strong>Budget:</strong> ${esc(m.budget || "—")}</div>
      <div><strong>Project Type:</strong> ${esc(m.project_type || "—")}</div>
      <div><strong>Submitted:</strong> ${formatDate(m.created_at)}</div>
      <div><strong>Page:</strong> ${esc(m.page_url || "—")}</div>
      <div style="border-top:1px solid var(--border);padding-top:0.85rem;"><strong>Message:</strong><p style="white-space:pre-wrap;">${esc(m.message)}</p></div>
    </div>`;
}

async function renderMessagesPanel() {
  const tbody = byId("messagesTbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
  try {
    const items = await fetchMessages();
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="5">No messages yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map(
        (m) => `
      <tr>
        <td>${esc(m.name)}</td>
        <td>${esc(m.email)}</td>
        <td>${esc(m.project_type || "—")}</td>
        <td><span class="status-pill ${m.status === "read" ? "read" : "new"}">${m.status === "read" ? "Read" : "New"}</span></td>
        <td>${formatDate(m.created_at)}</td>
        <td class="flex gap-1">
          <button class="icon-action" data-view-message="${m.id}" aria-label="View message from ${esc(m.name)}">👁</button>
          <button class="icon-action" data-delete-message="${m.id}" aria-label="Delete message from ${esc(m.name)}">✕</button>
        </td>
      </tr>`
      )
      .join("");

    qsa("[data-view-message]", tbody).forEach((btn) =>
      btn.addEventListener("click", async () => {
        const m = items.find((i) => i.id === btn.dataset.viewMessage);
        openModal(`Message from ${m.name}`, messageDetailHtml(m));
        if (m.status !== "read") {
          await supabase.from(CONFIG.TABLES.CONTACT_MESSAGES).update({ status: "read" }).eq("id", m.id);
          renderMessagesPanel();
        }
      })
    );
    qsa("[data-delete-message]", tbody).forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this message permanently?")) return;
        const { error } = await supabase.from(CONFIG.TABLES.CONTACT_MESSAGES).delete().eq("id", btn.dataset.deleteMessage);
        if (error) { alert(friendlyErrorMessage(error.message)); return; }
        renderMessagesPanel();
      })
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">${esc(friendlyErrorMessage(err.message))}</td></tr>`;
  }
}

/* ────────────────────────────────────────────────────────────────────────
   Boot
   ──────────────────────────────────────────────────────────────────────── */

document.addEventListener("nexvora:admin-ready", () => {
  initTabs();
  initModal();
  initProjectsPanel();
  initBlogPanel();
  initTestimonialsPanel();
  initFaqsPanel();
  renderMessagesPanel();
});
