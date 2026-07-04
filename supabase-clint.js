"use strict";


import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { CONFIG } from "./config.js";

let _client = null;

export function getSupabaseClient() {
  if (_client) return _client;

  _client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "nexvora-studio-auth"
    },
    global: {
      headers: {
        "x-application-name": "nexvora-studio-web"
      }
    }
  });

  return _client;
}

export const supabase = getSupabaseClient();
export default supabase;
