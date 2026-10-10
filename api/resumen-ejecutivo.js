// ============================================================
// api/resumen-ejecutivo.js
// Genera el resumen ejecutivo de Dirección Comercial con IA
// (Claude), a partir de los datos YA calculados por el dashboard
// (no le mandamos las publicaciones crudas: le mandamos un resumen
// compacto, más barato y más confiable que dejar que el modelo
// recalcule promedios).
//
// Si falta la API key, si falla la llamada o si la respuesta no
// viene bien formada, devolvemos un error controlado: el frontend
// (ver js/executive.js) ya sabe usar el resumen por reglas como
// respaldo automático en ese caso.
// ============================================================

const MODELO = "claude-haiku-5-5";

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: "Falta ANTHROPIC_API_KEY en las variables de entorno." });
  }

  let payload;
  try {
    payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  } catch (error) {
    return response.status(400).json({ error: "Body inválido." });
  }

  if (!payload || !payload.periodo) {
    return response.status(400).json({ error: "Faltan datos del período." });
  }

  const prompt = construirPrompt(payload);

  try {
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const body = await claudeResponse.json();

    if (!claudeResponse.ok) {
      return response.status(502).json({ error: "Claude no pudo generar el resumen.", detalle: body });
    }

    const texto = (body.content || [])
      .filter((bloque) => bloque.type === "text")
      .map((bloque) => bloque.text)
      .join("\n")
      .trim();

    if (!texto) {
      return response.status(502).json({ error: "Claude devolvió una respuesta vacía." });
    }

    return response.status(200).json({ texto });
  } catch (error) {
    return response.status(502).json({ error: "No se pudo conectar con la API de Claude." });
  }
};

function construirPrompt(payload) {
  const { periodo, topAlcance, topShare, alertas, oportunidades } = payload;

  return `Sos un analista comercial que le escribe un resumen ejecutivo breve a la Dirección Comercial de una inmobiliaria (Finko Real Estate), sobre el rendimiento digital de sus publicaciones de Instagram en el último período.

Reglas:
- Escribí en español, tono profesional y directo, sin rodeos ni saludos.
- Entre 3 y 5 oraciones en total, en un solo párrafo (sin listas ni títulos).
- Basate ÚNICAMENTE en los datos de abajo. No inventes cifras ni publicaciones que no estén listadas.
- Priorizá lo accionable: si hay alertas u oportunidades, mencioná la más relevante y qué conviene hacer.

Datos del período:
${JSON.stringify(
  {
    publicaciones: periodo.publicaciones,
    alcanceTotal: periodo.alcanceTotal,
    alcanceAnterior: periodo.alcanceAnterior,
    variacionAlcancePct: periodo.diffAlcance,
    interaccionesTotal: periodo.interaccionesTotal,
    engagementPromedio: periodo.engagementPromedio,
    engagementAnterior: periodo.engagementAnterior,
    publicacionLiderEnAlcance: topAlcance,
    publicacionLiderEnCompartidos: topShare,
    alertas,
    oportunidades,
  },
  null,
  2
)}

Devolvé solo el párrafo del resumen, sin encabezados ni texto adicional.`;
}
