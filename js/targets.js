// ============================================================
// targets.js
// Objetivos del equipo de Marketing, definidos manualmente.
//
// Para actualizar una meta, alcanza con cambiar el número acá
// abajo (MONTHLY_TARGETS) — el dashboard la escala solo según
// la cantidad de días del período que esté seleccionado.
// ============================================================

/** Objetivos pensados sobre una base de 30 días. */
export const MONTHLY_TARGETS = {
  alcance: 8000,
  interacciones: 300,
  engagement_rate: 0.04, // 4%
  guardados: 15,
  compartidos: 80,
};

/**
 * Escala los objetivos mensuales a la cantidad de días del período
 * elegido en el dashboard. engagement_rate no se escala porque es
 * un promedio/ratio, no una cantidad acumulada.
 * @param {number} days
 */
export function scaleTargets(days) {
  const factor = (days || 30) / 30;
  return {
    alcance: Math.round(MONTHLY_TARGETS.alcance * factor),
    interacciones: Math.round(MONTHLY_TARGETS.interacciones * factor),
    engagement_rate: MONTHLY_TARGETS.engagement_rate,
    guardados: Math.round(MONTHLY_TARGETS.guardados * factor),
    compartidos: Math.round(MONTHLY_TARGETS.compartidos * factor),
  };
}
