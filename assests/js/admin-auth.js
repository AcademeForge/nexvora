"use strict";

import { supabase } from "./supabase-client.js";
import { byId, isValidEmail, friendlyErrorMessage, setFormStatus, setButtonLoading } from "./utils.js";

/** Login page logic (admin/login.html). */
function initLoginForm() {
  const form = byId("loginForm");
  if (!form) return;
  const statusEl = byId("loginStatus");
  const submitBtn = byId("loginSubmitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!isValidEmail(email)) {
      setFormStatus(statusEl, "error", "Please enter a valid email address.");
      return;
    }
    if (!password) {
      setFormStatus(statusEl, "error", "Please enter your password.");
      return;
    }

    setButtonLoading(submitBtn, true, "Signing in…");
    setFormStatus(statusEl, "", "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setFormStatus(statusEl, "error", friendlyErrorMessage(error.message));
      setButtonLoading(submitBtn, false);
      return;
    }

    location.href = "/admin/dashboard.html";
  });
}

/** Session guard for admin/dashboard.html — redirects to login if unauthenticated. */
async function guardDashboard() {
  const shell = byId("adminShell");
  if (!shell) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.href = "/admin/login.html";
    return;
  }

  const emailEl = byId("adminUserEmail");
  if (emailEl) emailEl.textContent = session.user.email;

  supabase.auth.onAuthStateChange((_event, newSession) => {
    if (!newSession) location.href = "/admin/login.html";
  });

  document.dispatchEvent(new CustomEvent("nexvora:admin-ready", { detail: { session } }));
}

function initLogout() {
  const btn = byId("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.href = "/admin/login.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  guardDashboard();
  initLogout();
});
