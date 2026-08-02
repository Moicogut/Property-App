import { createClient } from "@supabase/supabase-js";

// Híbrido seguro Node.js (process.env) + Vite SPA (import.meta.env)
const envUrl =
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL : "") ||
  ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) || "");

const envAnonKey =
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY : "") ||
  ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || "");

const supabaseUrl = envUrl || "https://lqagnlbygzurddkzbbwn.supabase.co";
const supabaseAnonKey =
  envAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxYWdubGJ5Z3p1cmRka3piYnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1Mjk4NTcsImV4cCI6MjEwMTEwNTg1N30.5_1f3DSmzM1tf58FUeVcFDtp3eTORFy-iFggFqXv2pI";

if (!envAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_ANON_KEY not set. " +
    "Auth features may not work. Add this variable to Vercel Environment Variables."
  );
}

// Singleton Supabase client — used across the entire React SPA & Express Server for Auth + DB queries.
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabase;
