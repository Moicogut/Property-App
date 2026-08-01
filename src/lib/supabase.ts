import { createClient } from "@supabase/supabase-js";

// Vite injects VITE_* variables at build time via import.meta.env.
// Optional chaining prevents runtime crash if import.meta.env is undefined in production.
const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL || "https://lqagnlbygzurddkzbbwn.supabase.co";
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_ANON_KEY not set. " +
    "Auth features may not work. Add this variable to Vercel Environment Variables."
  );
}

// Singleton Supabase client — used across the entire React SPA for Auth + DB queries.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
