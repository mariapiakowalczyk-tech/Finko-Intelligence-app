// ============================================================
// execSummary.js
// Resumen ejecutivo de Dirección Comercial: lo primero que se
// lee en la página. Combina el estado general (color, según el
// mismo cálculo que antes mostraba "Estado de performance") con
// el texto del resumen y los números clave, para que se entienda
// de un vistazo sin tener que leer todo el texto.
// ============================================================

const ICONOS_POR_NIVEL = {
  positivo: "✓",
  atencion: "!",
  revision: "✕",
};

export function renderExecSummary(summary, status = {}) {
  const nivel = status.nivel || "positivo";
  const el = document.createElement("div");
  el.className = `exec-hero is-${nivel}`;

  const badge = summary.generadoPorIA
    ? "Generado por IA"
    : "Resumen automático · basado en datos del período";

  const highlightsHtml = (summary.highlights || [])
    .map(
      (h) => `
        <div class="exec-hero__stat">
          <div class="exec-hero__stat-value">${h.value}</div>
          <div class="exec-hero__stat-label">${h.label}</div>
        </div>`
    )
    .join("");

  el.innerHTML = `
    <div class="exec-hero__icon">${ICONOS_POR_NIVEL[nivel] || ICONOS_POR_NIVEL.positivo}</div>
    <div class="exec-hero__body">
      <div class="exec-hero__top">
        <div>
          <span class="exec-hero__eyebrow">Resumen ejecutivo</span>
          <h2 class="exec-hero__estado">${status.titulo || ""}</h2>
        </div>
        <span class="exec-hero__badge">${badge}</span>
      </div>
      <p class="exec-hero__text">${summary.texto}</p>
      ${highlightsHtml ? `<div class="exec-hero__stats">${highlightsHtml}</div>` : ""}
    </div>
  `;

  return el;
}
