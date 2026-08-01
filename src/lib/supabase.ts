import { createClient } from "@supabase/supabase-js";

// Vite injects VITE_* variables at build time via import.meta.env.
// Optional chaining prevents runtime crash if import.meta.env is undefined in production.
const meta = import.meta as unknown as { env?: Record<string, string> };
const supabaseUrl =
  meta.env?.VITE_SUPABASE_URL || "https://lqagnlbygzurddkzbbwn.supabase.co";
const supabaseAnonKey =
  meta.env?.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_ANON_KEY not set. " +
    "Auth features may not work. Add this variable to Vercel Environment Variables."
  );
}

// Singleton Supabase client — used across the entire React SPA for Auth + DB queries.
export const supabase = createClient(
  supabaseUrl || "https://lqagnlbygzurddkzbbwn.supabase.co",
  supabaseAnonKey
);

export default supabase;
