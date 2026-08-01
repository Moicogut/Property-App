import { createClient } from "@supabase/supabase-js";

// Vite injects VITE_* variables at build time via import.meta.env.
// The type assertion satisfies tsc without requiring additional lib entries.
// In Vercel: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Environment Variables.
const meta = import.meta as unknown as { env: Record<string, string> };
const supabaseUrl = meta.env["VITE_SUPABASE_URL"] ?? "";
const supabaseAnonKey = meta.env["VITE_SUPABASE_ANON_KEY"] ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. " +
    "Auth features will use mock mode. Add these variables to your .env file."
  );
}

// Singleton Supabase client — used across the entire React SPA for Auth + DB queries.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export default supabase;
