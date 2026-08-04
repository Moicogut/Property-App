import { createClient } from "@supabase/supabase-js";

// Híbrido seguro Node.js (process.env) + Vite SPA (import.meta.env)
const envUrl =
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL : "") ||
  ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) || "");

const envAnonKey =
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY : "") ||
  ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || "");

const supabaseUrl = envUrl || "https://lqagnlbygzurddkzbbwn.supabase.co";
// 🔥 BYPASS RLS EN MODO DESARROLLO FORZADO:
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxYWdubGJ5Z3p1cmRka3piYnduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUyOTg1NywiZXhwIjoyMTAxMTA1ODU3fQ.mvePXJG1TXankAhz0ZgevrX4iVkYgmb47VDB01A28OY";

if (!envAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_ANON_KEY not set. " +
    "Auth features may not work. Add this variable to Vercel Environment Variables."
  );
}

// Singleton Supabase client — used across the entire React SPA & Express Server for Auth + DB queries.
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: { persistSession: false }, // Ignora localStorage antiguo
    global: { headers: { Authorization: `Bearer ${supabaseAnonKey}` } } // Fuerza el JWT del Service Role
  }
);

export default supabase;
