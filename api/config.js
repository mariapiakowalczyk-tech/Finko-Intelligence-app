// ============================================================
// api/config.js
// Expone al navegador la URL y la clave pública (anon/publishable)
// de Supabase, necesarias para que el cliente de Supabase Auth
// funcione del lado del cliente. Es seguro exponer esta clave:
// es la misma que ya usan los demás endpoints de /api, pensada
// para ser pública y protegida por las políticas de Row Level
// Security (nunca la clave de servicio).
// ============================================================

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Método no permitido" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response.status(500).json({
      error: "Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en las variables de entorno.",
    });
  }

  return response.status(200).json({ supabaseUrl, supabaseAnonKey });
};
