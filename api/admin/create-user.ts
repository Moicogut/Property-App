import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://lqagnlbygzurddkzbbwn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, fullName, role, organizationId } = req.body;

    if (!email || !password || !organizationId) {
      return res.status(400).json({ error: "Faltan campos obligatorios (email, password, organizationId)." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName?.trim() || "Administrador Inmobiliario";
    const userRole = role || "agency_admin";

    let authUserId: string | null = null;

    // 1. Intentar crear usuario en Supabase Auth Admin (Bypass email confirmation & rate limit)
    try {
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          role: userRole,
          organization_id: organizationId,
        },
      });

      if (createError) {
        // Si el usuario ya existe, actualizar su contraseña y metadata
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const found = (existingUsers?.users as any[])?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
        if (found) {
          authUserId = found.id;
          await supabaseAdmin.auth.admin.updateUserById(found.id, {
            password: password.trim(),
            email_confirm: true,
            user_metadata: {
              full_name: cleanName,
              role: userRole,
              organization_id: organizationId,
            },
          });
        } else {
          console.warn("[Admin API] Error creando en Auth Admin:", createError);
        }
      } else if (createdUser?.user) {
        authUserId = createdUser.user.id;
      }
    } catch (authErr) {
      console.warn("[Admin API] Fallo al invocar auth.admin:", authErr);
    }

    // 2. Registrar / Upsert en la tabla 'users' vinculada a la organización
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          ...(authUserId ? { id: authUserId } : {}),
          email: cleanEmail,
          full_name: cleanName,
          role: userRole,
          organization_id: organizationId,
          user_type: "REAL_ESTATE_AGENCY",
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (dbError) {
      console.error("[Admin API] Error en tabla users:", dbError);
      return res.status(500).json({ error: `Error en BD: ${dbError.message}` });
    }

    return res.json({
      success: true,
      message: `Usuario ${cleanEmail} creado exitosamente para la organización.`,
      user: {
        id: dbUser.id,
        email: cleanEmail,
        fullName: cleanName,
        role: userRole,
        organizationId,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[Admin API] Error general:", msg);
    return res.status(500).json({ error: msg });
  }
}
