// ============================================================
// alertCard.js
// Bloques "Requieren atención" y "Oportunidades detectadas" para
// el dashboard de Dirección Comercial.
//
// Si se pasa `criteriosPorCodigo` (un Map código -> criterio,
// ver js/criteria.js) y la alerta/oportunidad tiene un criterio
// comercial activo definido para su `codigo_situacion`, se
// muestra además la decisión real de la empresa, citando quién
// la definió y desde cuándo. Si no hay criterio (hoy, al
// empezar, no hay ninguno todavía), la tarjeta se ve exactamente
// igual que antes.
// ============================================================

import { formatDate } from "../metrics.js";

export function renderAlertList(alerts, criteriosPorCodigo) {
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
      ${criterioHtml(a, criteriosPorCodigo)}
    `;
    wrap.appendChild(el);
  });

  return wrap;
}

export function renderOpportunityList(opportunities, criteriosPorCodigo) {
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
      ${criterioHtml(o, criteriosPorCodigo)}
    `;
    wrap.appendChild(el);
  });

  return wrap;
}

function criterioHtml(item, criteriosPorCodigo) {
  if (!criteriosPorCodigo || !item.codigo_situacion) return "";
  const criterio = criteriosPorCodigo.get(item.codigo_situacion);
  if (!criterio || !criterio.decision_esperada) return "";

  const fuente = [
    criterio.definido_por ? escapeHtml(criterio.definido_por) : null,
    criterio.vigente_desde ? `vigente desde ${formatDateOnly(criterio.vigente_desde)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `
    <p class="criterio-comercial">
      <strong>Según criterio de Finko:</strong> ${escapeHtml(criterio.decision_esperada)}
      ${fuente ? `<span class="criterio-comercial__fuente">${fuente}</span>` : ""}
    </p>
  `;
}

// vigente_desde es una columna `date` (sin hora, ej. "2026-09-01"): no se
// pasa por `new Date(...)` porque eso la interpreta como medianoche UTC y,
// en una zona horaria detrás de UTC (como Uruguay, UTC-3), formatDate()
// la mostraría un día antes. Se reordena el string directamente.
function formatDateOnly(isoDate) {
  const [y, m, d] = String(isoDate).slice(0, 10).split("-");
  if (!y || !m || !d) return String(isoDate);
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
