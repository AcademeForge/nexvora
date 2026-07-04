"use strict";

const ENV = (typeof window !== "undefined" && window.__NEXVORA_ENV__) || {};

export const CONFIG = Object.freeze({
  SUPABASE_URL: ENV.SUPABASE_URL || "https://afooyyydhlwngzssgqih.supabase.co",
  SUPABASE_ANON_KEY:
    ENV.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb295eXlkaGx3bmd6c3NncWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDQxMjgsImV4cCI6MjA5NDIyMDEyOH0.KG0XO0oP_2MpewHoIwTtbrKg5FkyOYRUtVzLH1MSJiE",

  
  CONTACT_FUNCTION_URL: ENV.CONTACT_FUNCTION_URL || null, 

  
  SITE_NAME: "Nexvora Studio",
  SITE_URL: ENV.SITE_URL || "https://nexvorastudio.academeforge.in",
  SITE_DESCRIPTION:
    "Nexvora Studio designs and develops premium websites, SaaS products, mobile apps, AI solutions and enterprise dashboards.",
  CONTACT_EMAIL: "hello@nexvorastudio.com",

  TABLES: Object.freeze({
    PROJECTS: "nx_projects",
    BLOG_POSTS: "nx_blog_posts",
    TESTIMONIALS: "nx_testimonials",
    FAQS: "nx_faqs",
    CONTACT_MESSAGES: "nx_contact_messages",
    PRICING_PLANS: "nx_pricing_plans"
  }),

  STORAGE: Object.freeze({
    PROJECTS_BUCKET: "nx-project-images",
    BLOG_BUCKET: "nx-blog-images"
  })
});

CONFIG.CONTACT_FUNCTION_URL =
  CONFIG.CONTACT_FUNCTION_URL || `${CONFIG.SUPABASE_URL}/functions/v1/nx-contact-form`;

export default CONFIG;
