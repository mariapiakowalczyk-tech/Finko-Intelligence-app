// ============================================================
// auth.js
// Cliente de Supabase Auth del lado del navegador + helpers de
// sesión y rol. Es el único módulo que sabe cómo iniciar/cerrar
// sesión y a qué página corresponde cada rol.
//
// El cliente se arma con la URL y la clave pública que devuelve
// /api/config (la misma clave publishable que ya usan los demás
// endpoints: segura para exponer en el navegador).
// ============================================================

const SUPABASE_JS_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

export const PAGINA_POR_ROL = {
  marketing: "/marketing.html",
  direccion_comercial: "/comercial.html",
};

let _client = null;
let _clientPromise = null;

async function getConfig() {
  const respuesta = await fetch("/api/config");
  const body = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(body.error || "No se pudo obtener la configuración de Supabase.");
  }
  return body;
}

export async function getSupabaseClient() {
  if (_client) return _client;
  if (!_clientPromise) {
    _clientPromise = (async () => {
      const [{ createClient }, { supabaseUrl, supabaseAnonKey }] = await Promise.all([
        import(SUPABASE_JS_URL),
        getConfig(),
      ]);
      _client = createClient(supabaseUrl, supabaseAnonKey);
      return _client;
    })();
  }
  return _clientPromise;
}

export async function signIn(email, password) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  try {
    const client = await getSupabaseClient();
    await client.auth.signOut();
  } finally {
    window.location.href = "/login.html";
  }
}

/**
 * Devuelve la sesión actual (si existe) y el rol asociado, leyendo
 * la tabla `perfiles`. rol es null si no hay sesión o si el usuario
 * no tiene un perfil asignado todavía.
 */
export async function getSessionAndRole() {
  const client = await getSupabaseClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session) return { session: null, rol: null, nombre: null };

  const { data: perfil } = await client
    .from("perfiles")
    .select("rol, nombre")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return { session, rol: perfil?.rol || null, nombre: perfil?.nombre || null };
}

/**
 * Exige sesión iniciada y el rol correcto para la página actual.
 * - Sin sesión -> redirige a /login.html
 * - Con sesión pero rol distinto (o sin perfil) -> redirige a la
 *   página que sí le corresponde (o a login si no tiene ninguna)
 * - Con el rol correcto -> devuelve { session, rol, nombre }
 *
 * Mientras redirige, devuelve null: quien llama debe cortar la
 * ejecución (return) para no llegar a pintar el dashboard.
 * @param {"marketing"|"direccion_comercial"} rolEsperado
 */
export async function requireRole(rolEsperado) {
  const { session, rol, nombre } = await getSessionAndRole();

  if (!session) {
    window.location.href = "/login.html";
    return null;
  }
  if (rol !== rolEsperado) {
    window.location.href = PAGINA_POR_ROL[rol] || "/login.html";
    return null;
  }
  return { session, rol, nombre };
}
