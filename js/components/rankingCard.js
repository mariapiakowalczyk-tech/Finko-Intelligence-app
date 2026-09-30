// ============================================================
// rankingCard.js
// Top-5 compacto con barras horizontales.
// ============================================================

/**
 * @param {{titulo:string, rows:Array<object>, key:string, formatter:(n:number)=>string, limit?:number}} opts
 */
export function renderRankingCard({ titulo, rows, key, formatter, limit = 5 }) {
  const el = document.createElement("div");
  el.className = "card ranking-card";

  const ordenadas = [...rows]
    .filter((r) => r[key] != null && Number.isFinite(r[key]))
    .sort((a, b) => b[key] - a[key])
    .slice(0, limit);

  const max = ordenadas.length ? ordenadas[0][key] : 0;

  el.innerHTML = `<h3>${titulo}</h3>`;

  if (ordenadas.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Sin datos suficientes en este período.";
    el.appendChild(empty);
    return el;
  }

  ordenadas.forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "ranking-row";
    const pct = max > 0 ? Math.max(4, (r[key] / max) * 100) : 0;
    row.innerHTML = `
      <span class="ranking-row__rank">${i + 1}</span>
      <span class="ranking-row__main">
        <span class="ranking-row__title" title="${escapeHtml(r.titulo || "Sin título")}">${escapeHtml(
      r.titulo || "Sin título"
    )}</span>
        <span class="ranking-row__bar-track"><span class="ranking-row__bar-fill" style="width:${pct}%"></span></span>
      </span>
      <span class="ranking-row__value">${formatter(r[key])}</span>
    `;
    el.appendChild(row);
  });

  return el;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
