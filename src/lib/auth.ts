import { supabase } from "./supabase";
import type { AppUser, UserRole } from "@/src/types/property";

/** Email del SuperAdmin global — único con acceso total al panel /admin */
export const SUPERADMIN_EMAIL = "rolangutiali.rg@gmail.com";

/**
 * Determina el rol del usuario basado en su email.
 * La regla de SuperAdmin se evalúa en el cliente; para entornos de alta seguridad
 * esta lógica debería reforzarse también en el servidor vía Service Role Key.
 */
export function resolveUserRole(email: string): UserRole {
  if (email === SUPERADMIN_EMAIL) return "superadmin";
  return "agent"; // Default para todos los demás usuarios registrados
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

  const role = resolveUserRole(email);
  const appUser: AppUser = {
    id: data.user.id,
    email: data.user.email ?? email,
    fullName,
    role,
  };

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

  const role = resolveUserRole(data.user.email ?? email);
  const appUser: AppUser = {
    id: data.user.id,
    email: data.user.email ?? email,
    fullName:
      (data.user.user_metadata?.full_name as string) ||
      data.user.email?.split("@")[0] ||
      "Usuario",
    role,
  };

  return { user: appUser, error: null };
}

/** Cierre de sesión */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Obtiene el usuario actual de la sesión activa (para rehidratación al recargar) */
export async function getCurrentUser(): Promise<AppUser | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const email = session.user.email ?? "";
  return {
    id: session.user.id,
    email,
    fullName:
      (session.user.user_metadata?.full_name as string) ||
      email.split("@")[0],
    role: resolveUserRole(email),
  };
}

/** Suscripción reactiva a cambios de sesión — usar en App.tsx */
export function onAuthStateChange(
  callback: (user: AppUser | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }
    const email = session.user.email ?? "";
    callback({
      id: session.user.id,
      email,
      fullName:
        (session.user.user_metadata?.full_name as string) ||
        email.split("@")[0],
      role: resolveUserRole(email),
    });
  });

  // Devuelve la función de unsubscribe para limpiar en useEffect
  return () => data.subscription.unsubscribe();
}
