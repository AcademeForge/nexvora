"use strict";

/** Shared DOM + validation utilities used across the site. */

export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function byId(id) {
  return document.getElementById(id);
}

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function debounce(fn, wait = 250) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function formatDate(dateString) {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return dateString;
  }
}

export function readingTime(text = "") {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}

/**
 * Translate a raw error (Supabase/Postgres error message, network error, etc.)
 * into a safe, user-facing message. Never leak raw DB/server internals.
 */
export function friendlyErrorMessage(rawMessage, fallbackEmail = "hello@nexvorastudio.com") {
  const msg = String(rawMessage || "").toLowerCase();

  if (!msg || /failed to fetch|networkerror|load failed|network request failed/.test(msg)) {
    return "We couldn't reach the server. Please check your internet connection and try again.";
  }
  if (/duplicate key|already exists/.test(msg)) {
    return "It looks like this already exists. Please double-check and try again.";
  }
  if (/rate limit|too many requests/.test(msg)) {
    return "You're submitting too quickly. Please wait a moment and try again.";
  }
  if (/invalid login credentials/.test(msg)) {
    return "Incorrect email or password.";
  }
  if (/jwt|token|not authenticated|permission denied|row-level security/.test(msg)) {
    return "Your session has expired or you don't have permission to do this. Please sign in again.";
  }
  return `We couldn't process your request. Please double-check the fields and try again, or email ${fallbackEmail} for help.`;
}

export function setFormStatus(el, type, message) {
  if (!el) return;
  el.className = `form-status ${type}`;
  el.textContent = message;
}

export function setButtonLoading(btn, loading, loadingLabel = "Submitting…") {
  if (!btn) return;
  const label = btn.querySelector(".btn-label");
  btn.disabled = loading;
  if (!btn.dataset.defaultLabel && label) btn.dataset.defaultLabel = label.textContent;
  if (label) label.textContent = loading ? loadingLabel : btn.dataset.defaultLabel;
  btn.classList.toggle("is-loading", loading);
}
