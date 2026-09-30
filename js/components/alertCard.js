// ============================================================
// alertCard.js
// Bloques "Requieren atención" y "Oportunidades detectadas" para
// el dashboard de Dirección Comercial.
// ============================================================

import { formatDate } from "../metrics.js";

export function renderAlertList(alerts) {
  const wrap = document.createElement("div");
  wrap.className = "stack";

  if (!alerts || alerts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No se detectaron publicaciones que requieran atención en este período.";
    wrap.appendChild(empty);
    return wrap;
  }

  alerts.forEach((a) => {
    const el = document.createElement("div");
    el.className = "alert-card";
    el.innerHTML = `
      <p class="label" style="color:var(--danger); margin:0 0 4px;">${formatDate(a.fecha_publicacion)}</p>
      <p class="alert-card__title">${escapeHtml(a.titulo)}</p>
      <p class="alert-card__desc">${escapeHtml(a.descripcion)}</p>
    `;
    wrap.appendChild(el);
  });

  return wrap;
}

export function renderOpportunityList(opportunities) {
  const wrap = document.createElement("div");
  wrap.className = "stack";

  if (!opportunities || opportunities.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No se detectaron oportunidades destacables en este período.";
    wrap.appendChild(empty);
    return wrap;
  }

  opportunities.forEach((o) => {
    const el = document.createElement("div");
    el.className = "opportunity-card";
    el.innerHTML = `
      <p class="opportunity-card__label" style="color:var(--positive);">${escapeHtml(o.titulo)}</p>
      <p class="opportunity-card__observado"><strong>Observado:</strong> ${escapeHtml(o.observado)}</p>
      <p class="opportunity-card__recomendacion"><strong>Recomendación:</strong> ${escapeHtml(o.recomendacion)}</p>
    `;
    wrap.appendChild(el);
  });

  return wrap;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
