import { supabase } from "./supabase";
import type { AppUser, UserRole } from "@/src/types/property";

/** Email del SuperAdmin global — único con acceso total al panel /admin */
export const SUPERADMIN_EMAIL = "rolangutiali.rg@gmail.com";

/**
 * Consulta y sincroniza el perfil del usuario en la tabla 'users'
 * incluyendo su rol y la organización a la que pertenece.
 */
export async function fetchUserDbProfile(
  authUserId: string,
  email: string,
  fullNameFallback: string
): Promise<AppUser> {
  const isSuper = email.toLowerCase().trim() === SUPERADMIN_EMAIL.toLowerCase().trim();

  try {
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("id, role, organization_id, user_type, organizations(id, name)")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.warn("[Auth] Error consultando tabla users:", error);
    }

    if (dbUser) {
      const orgData = Array.isArray(dbUser.organizations) ? dbUser.organizations[0] : dbUser.organizations;
      const role: UserRole = isSuper ? "superadmin" : (dbUser.role as UserRole) || "agency_admin";

      return {
        id: authUserId,
        email,
        fullName: fullNameFallback,
        role,
        organizationId: dbUser.organization_id || undefined,
        organizationName: orgData?.name || undefined,
        userType: dbUser.user_type || "INDEPENDENT_AGENT",
      };
    }

    // Si el usuario no existe aún en la tabla 'users', buscar primera organización o vincular
    const { data: orgs } = await supabase.from("organizations").select("id, name").limit(1);
    const defaultOrg = orgs?.[0];

    const initialRole: UserRole = isSuper ? "superadmin" : "agency_admin";

    const { data: newUser } = await supabase
      .from("users")
      .upsert({
        email,
        full_name: fullNameFallback,
        role: initialRole,
        organization_id: defaultOrg?.id || null,
        user_type: "INDEPENDENT_AGENT",
      }, { onConflict: "email" })
      .select("id, role, organization_id, user_type")
      .single();

    return {
      id: authUserId,
      email,
      fullName: fullNameFallback,
      role: initialRole,
      organizationId: newUser?.organization_id || defaultOrg?.id || undefined,
      organizationName: defaultOrg?.name || "Organización Principal",
      userType: "INDEPENDENT_AGENT",
    };
  } catch (err) {
    console.error("[Auth] Error inesperado resolviendo perfil DB:", err);
    return {
      id: authUserId,
      email,
      fullName: fullNameFallback,
      role: isSuper ? "superadmin" : "agency_admin",
    };
  }
}

/** Registro de nuevo usuario con email y contraseña */
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ user: AppUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: "No se pudo crear el usuario." };

  const appUser = await fetchUserDbProfile(data.user.id, data.user.email ?? email, fullName);
  return { user: appUser, error: null };
}

/** Login con email y contraseña */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: AppUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: "Credenciales incorrectas." };

  const fullName = (data.user.user_metadata?.full_name as string) ||
    data.user.email?.split("@")[0] ||
    "Usuario";

  const appUser = await fetchUserDbProfile(data.user.id, data.user.email ?? email, fullName);
  return { user: appUser, error: null };
}

/** Cierre de sesión */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Obtiene el usuario actual de la sesión activa */
export async function getCurrentUser(): Promise<AppUser | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const email = session.user.email ?? "";
  const fullName = (session.user.user_metadata?.full_name as string) ||
    email.split("@")[0];

  return await fetchUserDbProfile(session.user.id, email, fullName);
}

/** Suscripción reactiva a cambios de sesión */
export function onAuthStateChange(
  callback: (user: AppUser | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }
    const email = session.user.email ?? "";
    const fullName = (session.user.user_metadata?.full_name as string) ||
      email.split("@")[0];

    const appUser = await fetchUserDbProfile(session.user.id, email, fullName);
    callback(appUser);
  });

  return () => data.subscription.unsubscribe();
}

