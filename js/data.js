// ============================================================
// data.js
// Única puerta de entrada a los datos de Supabase para todo el
// dashboard. Reutiliza el endpoint /api/publicaciones que ya
// existe (que a su vez usa SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY
// del lado del servidor). No se crea ningún cliente de Supabase
// nuevo ni se llama a Supabase directo desde el navegador.
//
// Cachea la respuesta en memoria durante la vida de la página,
// para que Marketing y Dirección Comercial (o varios componentes
// dentro de la misma página) no disparen la misma consulta varias
// veces.
// ============================================================

let _cache = null;
let _inflight = null;

/**
 * Trae las publicaciones desde /api/publicaciones.
 * Si ya se pidieron en esta carga de página, devuelve la copia en caché.
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function fetchPublicaciones(opts = {}) {
  if (_cache && !opts.force) return _cache;
  if (_inflight && !opts.force) return _inflight;

  _inflight = (async () => {
    const respuesta = await fetch("/api/publicaciones");
    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudieron cargar las publicaciones.");
    }

    const data = Array.isArray(resultado.data) ? resultado.data : [];
    _cache = data;
    return data;
  })();

  try {
    return await _inflight;
  } finally {
    _inflight = null;
  }
}
