module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Método no permitido" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({
      error: "Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en las variables de entorno.",
    });
  }

  try {
    const supabaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/criterios_comerciales?select=*&activo=is.true&order=vigente_desde.desc`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    const body = await supabaseResponse.json();

    if (!supabaseResponse.ok) {
      // La tabla puede no existir todavía (antes de correr sql/001_recomendaciones_ia.sql).
      // No rompemos el dashboard por esto: devolvemos una lista vacía.
      return response.status(200).json({ data: [], aviso: "No se pudieron leer los criterios comerciales.", detalle: body });
    }

    return response.status(200).json({ data: body });
  } catch (error) {
    return response.status(200).json({ data: [], aviso: "No se pudo conectar con Supabase para los criterios." });
  }
};
