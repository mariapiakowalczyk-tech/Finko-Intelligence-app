// ============================================================
// pages/comercial.js
// Orquesta el dashboard de Dirección Comercial: vista ejecutiva,
// pensada para entenderse en 20-30 segundos.
// ============================================================

import { mountNav } from "../components/nav.js";
import { fetchPublicaciones } from "../data.js";
import { prepareDataset, splitByPeriod, buildKpi, formatInt, percentile } from "../metrics.js";
import { renderKpiGrid } from "../components/kpiCard.js";
import { renderDateFilter } from "../components/dateFilter.js";
import { renderRankingCard } from "../components/rankingCard.js";
import { renderAlertList, renderOpportunityList } from "../components/alertCard.js";
import { renderExecSummary } from "../components/execSummary.js";
import { buildAlerts, buildOpportunities, computeStatus, generateExecutiveSummary } from "../executive.js";

mountNav("comercial");

const root = document.getElementById("app");
let dataset = [];
let period = "30";

async function init() {
  root.innerHTML = '<div class="loading-state">Cargando publicaciones…</div>';
  try {
    const raw = await fetchPublicaciones();
    dataset = prepareDataset(raw);
    render();
  } catch (err) {
    root.innerHTML = `<div class="empty-state">No se pudieron cargar las publicaciones. ${err.message || ""}</div>`;
    console.error(err);
  }
}

function render() {
  root.innerHTML = "";

  const header = document.createElement("div");
  header.className = "page-header";
  header.innerHTML = `
    <div>
      <h1>Dirección Comercial</h1>
    </div>
  `;
  const filterEl = renderDateFilter(period);
  header.appendChild(filterEl);
  filterEl.addEventListener("periodchange", (e) => {
    period = e.detail;
    renderBody();
  });
  root.appendChild(header);

  const body = document.createElement("div");
  body.id = "comercial-body";
  root.appendChild(body);

  renderBody();
}

async function renderBody() {
  const body = document.getElementById("comercial-body");
  if (!body) return;
  body.innerHTML = "";

  if (dataset.length === 0) {
    body.innerHTML = '<div class="empty-state">Todavía no hay publicaciones guardadas.</div>';
    return;
  }

  const { current, previous } = splitByPeriod(dataset, period);

  if (current.length === 0) {
    body.innerHTML = '<div class="empty-state">No hay publicaciones en el período seleccionado.</div>';
    return;
  }

  const alerts = buildAlerts(current);
  const opportunities = buildOpportunities(current);
  const status = computeStatus(current, previous, alerts);

  const p75Engagement = percentile(current, "engagement_rate", 75);
  const destacadas = current.filter(
    (r) => p75Engagement != null && r.engagement_rate != null && r.engagement_rate >= p75Engagement
  ).length;

  // ---- KPIs ----
  const kpiSection = document.createElement("div");
  kpiSection.className = "section";
  kpiSection.appendChild(
    renderKpiGrid(
      [
        { ...buildKpi({ label: "Alcance total", current, previous, key: "alcance", formatter: formatInt }), big: true },
        {
          ...buildKpi({ label: "Interacciones", current, previous, key: "interacciones", formatter: formatInt }),
          big: true,
        },
        { label: "Publicaciones del período", value: formatInt(current.length), big: true },
        { label: "Publicaciones destacadas", value: formatInt(destacadas), big: true },
        { label: "Publicaciones con alerta", value: formatInt(alerts.length), big: true },
      ],
      { compact: true }
    )
  );
  body.appendChild(kpiSection);

  // ---- Estado de performance ----
  const statusSection = document.createElement("div");
  statusSection.className = "section";
  statusSection.innerHTML = `<div class="section__head"><h2>Estado de performance</h2></div>`;
  const banner = document.createElement("div");
  banner.className = `status-banner is-${status.nivel}`;
  banner.innerHTML = `
    <span class="status-banner__dot"></span>
    <div>
      <div class="status-banner__title">${status.titulo}</div>
      <div class="status-banner__desc">${status.descripcion}</div>
    </div>
  `;
  statusSection.appendChild(banner);
  body.appendChild(statusSection);

  // ---- Requieren atención / Oportunidades ----
  const twoColSection = document.createElement("div");
  twoColSection.className = "section grid-2col";

  const attentionCol = document.createElement("div");
  attentionCol.innerHTML = `<div class="section__head"><h2>Requieren atención</h2></div>`;
  attentionCol.appendChild(renderAlertList(alerts));

  const opportunityCol = document.createElement("div");
  opportunityCol.innerHTML = `<div class="section__head"><h2>Oportunidades detectadas</h2></div>`;
  opportunityCol.appendChild(renderOpportunityList(opportunities));

  twoColSection.append(attentionCol, opportunityCol);
  body.appendChild(twoColSection);

  // ---- Ranking ejecutivo ----
  const rankSection = document.createElement("div");
  rankSection.className = "section";
  rankSection.innerHTML = `<div class="section__head"><h2>Ranking ejecutivo</h2></div>`;
  const rankGrid = document.createElement("div");
  rankGrid.className = "grid-2col";
  rankGrid.append(
    renderRankingCard({ titulo: "Top 5 por alcance", rows: current, key: "alcance", formatter: formatInt, limit: 5 }),
    renderRankingCard({
      titulo: "Top 5 por interacciones",
      rows: current,
      key: "interacciones",
      formatter: formatInt,
      limit: 5,
    }),
    renderRankingCard({
      titulo: "Top 5 por compartidos",
      rows: current,
      key: "compartidos",
      formatter: formatInt,
      limit: 5,
    }),
    renderRankingCard({
      titulo: "Top 5 por eficiencia (Engagement Rate)",
      rows: current,
      key: "engagement_rate",
      formatter: (v) => `${(v * 100).toFixed(1)}%`,
      limit: 5,
    })
  );
  rankSection.appendChild(rankGrid);
  body.appendChild(rankSection);

  // ---- Resumen ejecutivo ----
  const summarySection = document.createElement("div");
  summarySection.className = "section";
  summarySection.innerHTML = `<div class="section__head"><h2>Resumen ejecutivo</h2></div>`;
  summarySection.appendChild(renderLoadingSummary());
  body.appendChild(summarySection);

  const summary = await generateExecutiveSummary({ current, previous, alerts, opportunities });
  summarySection.removeChild(summarySection.lastChild);
  summarySection.appendChild(renderExecSummary(summary));
}

function renderLoadingSummary() {
  const el = document.createElement("div");
  el.className = "loading-state";
  el.textContent = "Generando resumen…";
  return el;
}

init();
