// ============================================================
// criteria.js
// Trae los criterios comerciales activos (tabla
// criterios_comerciales) desde /api/criterios, y arma un mapa
// código de situación -> criterio para que el dashboard pueda
// mostrar "según criterio" junto a cada alerta/oportunidad.
//
// Si la tabla todavía no existe o está vacía, devuelve un mapa
// vacío y el dashboard sigue funcionando exactamente como hasta
// ahora (sin la línea de "según criterio").
// ============================================================

let _cache = null;
let _inflight = null;

/** @returns {Promise<Array<object>>} */
export async function fetchCriterios(opts = {}) {
  if (_cache && !opts.force) return _cache;
  if (_inflight && !opts.force) return _inflight;

  _inflight = (async () => {
    try {
      const respuesta = await fetch("/api/criterios");
      const resultado = await respuesta.json().catch(() => ({}));
      const data = Array.isArray(resultado.data) ? resultado.data : [];
      _cache = data;
      return data;
    } catch {
      _cache = [];
      return [];
    }
  })();

  try {
    return await _inflight;
  } finally {
    _inflight = null;
  }
}

/**
 * Arma un mapa código de situación -> criterio activo más reciente
 * (si hay más de un criterio activo para el mismo código, se usa
 * el de vigente_desde más nueva).
 * @param {Array<object>} criterios
 * @returns {Map<string, object>}
 */
export function buildCriteriosPorSituacion(criterios) {
  const mapa = new Map();
  (criterios || []).forEach((c) => {
    if (!c || !c.situacion) return;
    const existente = mapa.get(c.situacion);
    if (!existente || (c.vigente_desde || "") > (existente.vigente_desde || "")) {
      mapa.set(c.situacion, c);
    }
  });
  return mapa;
}
