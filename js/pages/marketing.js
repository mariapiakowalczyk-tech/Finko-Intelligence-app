// ============================================================
// pages/marketing.js
// Orquesta el dashboard de Marketing.
// ============================================================

import { mountNav } from "../components/nav.js";
import { fetchPublicaciones } from "../data.js";
import {
  prepareDataset,
  splitByPeriod,
  buildKpi,
  buildAverageKpi,
  formatInt,
  formatPct,
  sum,
} from "../metrics.js";
import { scaleTargets } from "../targets.js";
import { renderKpiGrid } from "../components/kpiCard.js";
import { renderDateFilter } from "../components/dateFilter.js";
import { renderRankingCard } from "../components/rankingCard.js";
import { renderEvolutionChart } from "../components/metricChart.js";
import { renderPostTable } from "../components/postTable.js";
import { renderInsightList } from "../components/insightCard.js";
import { buildContentInsights } from "../insights.js";

mountNav("marketing");

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
      <h1>Rendimiento de las Publicaciones</h1>
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
  body.id = "marketing-body";
  root.appendChild(body);

  renderBody();
}

function renderBody() {
  const body = document.getElementById("marketing-body");
  if (!body) return;
  body.innerHTML = "";

  if (dataset.length === 0) {
    body.innerHTML = '<div class="empty-state">Todavía no hay publicaciones guardadas.</div>';
    return;
  }

  const { current, previous, range } = splitByPeriod(dataset, period);

  if (current.length === 0) {
    body.innerHTML = '<div class="empty-state">No hay publicaciones en el período seleccionado.</div>';
    return;
  }

  // ---- KPIs (variación vs. período anterior + objetivo del equipo) ----
  const days = Math.round((range.end.getTime() - range.start.getTime()) / 86400000) + 1;
  const targets = scaleTargets(days);

  // Agrega el objetivo ("Alcance esperado: 8.267") como dato informativo,
  // sin tocar el delta del KPI (que sigue siendo vs. el período anterior).
  const withTarget = (kpi, targetValue, metaLabel, formatter) => ({
    ...kpi,
    target: formatter ? formatter(targetValue) : targetValue,
    metaLabel,
  });

  const kpiSection = document.createElement("div");
  kpiSection.className = "section";
  kpiSection.appendChild(
    renderKpiGrid([
      buildKpi({ label: "Publicaciones analizadas", current, previous, key: "count", formatter: formatInt }),
      withTarget(
        buildKpi({ label: "Alcance total", current, previous, key: "alcance", formatter: formatInt }),
        targets.alcance,
        "Alcance esperado",
        formatInt
      ),
      withTarget(
        buildKpi({ label: "Interacciones totales", current, previous, key: "interacciones", formatter: formatInt }),
        targets.interacciones,
        "Interacciones totales esperadas",
        formatInt
      ),
      withTarget(
        buildAverageKpi({ label: "Engagement Rate", current, previous, key: "engagement_rate", formatter: formatPct }),
        targets.engagement_rate,
        "Engagement Rate esperado",
        formatPct
      ),
      withTarget(
        buildKpi({ label: "Guardados", current, previous, key: "guardados", formatter: formatInt }),
        targets.guardados,
        "Guardados esperados",
        formatInt
      ),
      withTarget(
        buildKpi({ label: "Compartidos", current, previous, key: "compartidos", formatter: formatInt }),
        targets.compartidos,
        "Compartidos esperados",
        formatInt
      ),
    ])
  );
  body.appendChild(kpiSection);

  // ---- Evolución temporal ----
  const evoSection = document.createElement("div");
  evoSection.className = "section";
  evoSection.innerHTML = `<div class="section__head"><h2>Evolución temporal</h2></div>`;
  evoSection.appendChild(renderEvolutionChart(current));
  body.appendChild(evoSection);

  // ---- Rankings ----
  const rankSection = document.createElement("div");
  rankSection.className = "section";
  rankSection.innerHTML = `<div class="section__head"><h2>Rankings</h2></div>`;
  const rankGrid = document.createElement("div");
  rankGrid.className = "grid-3";
  rankGrid.append(
    renderRankingCard({ titulo: "Top por alcance", rows: current, key: "alcance", formatter: formatInt }),
    renderRankingCard({ titulo: "Top por interacciones", rows: current, key: "interacciones", formatter: formatInt }),
    renderRankingCard({ titulo: "Top por Engagement Rate", rows: current, key: "engagement_rate", formatter: formatPct }),
    renderRankingCard({ titulo: "Top por guardados", rows: current, key: "guardados", formatter: formatInt }),
    renderRankingCard({ titulo: "Top por compartidos", rows: current, key: "compartidos", formatter: formatInt }),
    renderRankingCard({ titulo: "Top por Share Rate", rows: current, key: "share_rate", formatter: formatPct })
  );
  rankSection.appendChild(rankGrid);
  body.appendChild(rankSection);

  // ---- Insights de contenido ----
  const insightSection = document.createElement("div");
  insightSection.className = "section";
  insightSection.innerHTML = `<div class="section__head"><h2>Insights de contenido</h2></div>`;
  insightSection.appendChild(renderInsightList(buildContentInsights(current, previous)));
  body.appendChild(insightSection);

  // ---- Tabla de publicaciones ----
  const tableSection = document.createElement("div");
  tableSection.className = "section";
  tableSection.innerHTML = `<div class="section__head"><h2>Análisis de publicaciones</h2></div>`;
  tableSection.appendChild(renderPostTable(current));
  body.appendChild(tableSection);
}


init();
