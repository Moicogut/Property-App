import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Usamos SERVICE_ROLE_KEY en el servidor para bypassear RLS si es necesario, 
// o al menos para asegurar conectividad sin depender del token de sesión del usuario
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[Server] ⚠️ Missing Supabase credentials in environment variables.");
}

export const supabaseServer = createClient(
  supabaseUrl || "https://lqagnlbygzurddkzbbwn.supabase.co",
  supabaseKey || ""
);
