// ============================================================
// kpiCard.js
// Tarjeta de KPI reutilizable: label + valor + variación vs.
// período anterior (opcional).
// ============================================================

/**
 * @param {{label:string, value:string|number, delta?:number|null, direction?:"up"|"down"|"flat", big?:boolean}} kpi
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

  el.innerHTML = `
    <span class="kpi-card__label">${kpi.label}</span>
    <span class="kpi-card__value">${kpi.value}</span>
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
