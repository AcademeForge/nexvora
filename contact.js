"use strict";

import { CONFIG } from "./config.js";
import { supabase } from "./supabase-client.js";
import {
  byId,
  isValidEmail,
  friendlyErrorMessage,
  setFormStatus,
  setButtonLoading
} from "./utils.js";

const FIELD_RULES = {
  name: { min: 2, max: 120 },
  company: { max: 160 },
  message: { min: 20, max: 4000 }
};

const BUDGET_OPTIONS = [
  { value: "", label: "Select a budget range" },
  { value: "under_5k", label: "Under $5,000" },
  { value: "5k_15k", label: "$5,000 – $15,000" },
  { value: "15k_50k", label: "$15,000 – $50,000" },
  { value: "50k_plus", label: "$50,000+" },
  { value: "not_sure", label: "Not sure yet" }
];

const PROJECT_TYPE_OPTIONS = [
  { value: "", label: "Select a project type" },
  { value: "website", label: "Website Development" },
  { value: "web_app", label: "Web Application" },
  { value: "saas", label: "SaaS Product" },
  { value: "mobile_app", label: "Mobile Application" },
  { value: "ai_solution", label: "AI Solution" },
  { value: "ui_ux", label: "UI/UX Design" },
  { value: "dashboard", label: "Dashboard Development" },
  { value: "crm_erp", label: "CRM / ERP System" },
  { value: "api", label: "API Development" },
  { value: "cloud", label: "Cloud Solutions" },
  { value: "consulting", label: "Product Consulting" },
  { value: "other", label: "Other" }
];

function populateSelect(select, options) {
  if (!select) return;
  select.innerHTML = options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
}

function fieldError(form, fieldName, message) {
  const field = form.querySelector(`[data-field="${fieldName}"]`);
  if (!field) return;
  field.classList.add("invalid");
  const errorEl = field.querySelector(".error-text");
  if (errorEl) errorEl.textContent = message;
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field.invalid").forEach((f) => f.classList.remove("invalid"));
}

function validate(form) {
  clearFieldErrors(form);
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  const projectType = form.project_type.value;
  let firstInvalid = null;
  let ok = true;

  if (name.length < FIELD_RULES.name.min) {
    fieldError(form, "name", `Please enter your full name (at least ${FIELD_RULES.name.min} characters).`);
    ok = false; firstInvalid = firstInvalid || form.name;
  }
  if (!email || !isValidEmail(email)) {
    fieldError(form, "email", "Please enter a valid email address so we can respond to you.");
    ok = false; firstInvalid = firstInvalid || form.email;
  }
  if (!projectType) {
    fieldError(form, "project_type", "Please select a project type.");
    ok = false; firstInvalid = firstInvalid || form.project_type;
  }
  if (message.length < FIELD_RULES.message.min) {
    fieldError(form, "message", `Please tell us a bit more — at least ${FIELD_RULES.message.min} characters.`);
    ok = false; firstInvalid = firstInvalid || form.message;
  }

  if (!ok && firstInvalid) firstInvalid.focus();
  return ok;
}

/**
 * Primary path: POST to the `nx-contact-form` Supabase Edge Function, which
 * re-validates server-side, inserts into nx_contact_messages with the
 * service role (bypassing RLS safely from the server), and returns JSON.
 * Handles CORS itself (see supabase/functions/nx-contact-form/index.ts).
 */
async function submitContactForm(payload) {
  const response = await fetch(CONFIG.CONTACT_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": CONFIG.SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(payload)
  });

  let body = null;
  try { body = await response.json(); } catch { /* non-JSON response */ }

  if (!response.ok) {
    throw new Error((body && body.error) || `Request failed with status ${response.status}`);
  }
  return body;
}

function initContactForm() {
  const form = byId("contactForm");
  const statusEl = byId("contactFormStatus");
  const submitBtn = byId("contactSubmitBtn");
  if (!form || !submitBtn) return;

  populateSelect(form.budget, BUDGET_OPTIONS);
  populateSelect(form.project_type, PROJECT_TYPE_OPTIONS);

  const prefillType = new URLSearchParams(location.search).get("type");
  if (prefillType && form.project_type.querySelector(`option[value="${prefillType}"]`)) {
    form.project_type.value = prefillType;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate(form)) return;

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim() || null,
      budget: form.budget.value || null,
      project_type: form.project_type.value,
      message: form.message.value.trim(),
      page_url: location.href,
      source: "website_contact_form"
    };

    setButtonLoading(submitBtn, true, "Sending…");
    setFormStatus(statusEl, "", "");

    try {
      await submitContactForm(payload);
      setFormStatus(
        statusEl,
        "success",
        "Thanks! Your message has been sent. Our team will get back to you within one business day."
      );
      form.reset();
      populateSelect(form.budget, BUDGET_OPTIONS);
      populateSelect(form.project_type, PROJECT_TYPE_OPTIONS);
    } catch (err) {
      console.error("[nexvora] contact form submission failed:", err);
      
      try {
        const { error: insertError } = await supabase.from(CONFIG.TABLES.CONTACT_MESSAGES).insert([payload]);
        if (insertError) throw insertError;
        setFormStatus(
          statusEl,
          "success",
          "Thanks! Your message has been sent. Our team will get back to you within one business day."
        );
        form.reset();
        populateSelect(form.budget, BUDGET_OPTIONS);
        populateSelect(form.project_type, PROJECT_TYPE_OPTIONS);
      } catch (fallbackErr) {
        setFormStatus(statusEl, "error", friendlyErrorMessage(fallbackErr.message, CONFIG.CONTACT_EMAIL));
      }
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", initContactForm);
