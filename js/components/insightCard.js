// ============================================================
// insightCard.js
// Tarjeta de insight de contenido (Marketing).
// ============================================================

const ICONS = { positivo: "✓", neutral: "◆", alerta: "!" };

export function renderInsightCard(insight) {
  const el = document.createElement("div");
  el.className = `insight-card tone-${insight.tono || "neutral"}`;
  el.innerHTML = `
    <span class="insight-card__icon">${ICONS[insight.tono] || "◆"}</span>
    <div class="insight-card__body">
      <div class="insight-card__tag">${insight.tag || ""}</div>
      <p>${insight.mensaje}</p>
    </div>
  `;
  return el;
}

export function renderInsightList(insights) {
  const wrap = document.createElement("div");
  wrap.className = "stack";
  if (!insights || insights.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No se detectaron patrones destacables en este período.";
    wrap.appendChild(empty);
    return wrap;
  }
  insights.forEach((i) => wrap.appendChild(renderInsightCard(i)));
  return wrap;
}
