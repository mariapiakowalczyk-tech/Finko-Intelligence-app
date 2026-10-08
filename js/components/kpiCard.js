// ============================================================
// kpiCard.js
// Tarjeta de KPI reutilizable: label + valor + variación vs.
// período anterior (opcional), o vs. un objetivo (opcional).
// ============================================================

/**
 * @param {{label:string, value:string|number, delta?:number|null, direction?:"up"|"down"|"flat", big?:boolean, target?:string|number, metaLabel?:string}} kpi
 */
export function renderKpiCard(kpi) {
  const el = document.createElement("div");
  el.className = `kpi-card${kpi.big ? " kpi-card--big" : ""}`;

  const deltaHtml =
    kpi.delta == null
      ? ""
      : `<span class="kpi-card__delta is-${kpi.direction || "flat"}">${
          kpi.direction === "up" ? "▲" : kpi.direction === "down" ? "▼" : "→"
        } ${Math.abs(kpi.delta).toFixed(1)}%</span>`;

  const targetHtml =
    kpi.target == null ? "" : `<span class="kpi-card__target">${kpi.metaLabel || "Meta"}: ${kpi.target}</span>`;

  el.innerHTML = `
    <span class="kpi-card__label">${kpi.label}</span>
    <span class="kpi-card__value">${kpi.value}</span>
    ${targetHtml}
    ${deltaHtml}
  `;
  return el;
}

export function renderKpiGrid(kpis, { compact = false } = {}) {
  const grid = document.createElement("div");
  grid.className = `kpi-grid${compact ? " kpi-grid--compact" : ""}`;
  kpis.forEach((kpi) => grid.appendChild(renderKpiCard(kpi)));
  return grid;
}
