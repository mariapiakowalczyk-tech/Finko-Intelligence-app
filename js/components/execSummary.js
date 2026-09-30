// ============================================================
// execSummary.js
// Bloque "Resumen ejecutivo" para Dirección Comercial.
// ============================================================

export function renderExecSummary(summary) {
  const el = document.createElement("div");
  el.className = "card exec-summary";

  const badge = summary.generadoPorIA
    ? "Generado por IA"
    : "Resumen automático · basado en datos del período";

  const highlightsHtml = (summary.highlights || [])
    .map(
      (h) => `<div class="exec-summary__highlight"><strong>${h.value}</strong>${h.label}</div>`
    )
    .join("");

  el.innerHTML = `
    <span class="exec-summary__badge">${badge}</span>
    <p class="exec-summary__text">${summary.texto}</p>
    <div class="exec-summary__highlights">${highlightsHtml}</div>
  `;

  return el;
}
