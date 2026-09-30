// ============================================================
// metricChart.js
// Gráfico de línea de evolución temporal con selector de métrica.
// Usa Chart.js (cargado por <script> en el HTML, variable global `Chart`).
// ============================================================

const METRIC_OPTIONS = [
  { key: "alcance", label: "Alcance" },
  { key: "interacciones", label: "Interacciones" },
  { key: "engagement_rate", label: "Engagement" },
  { key: "guardados", label: "Guardados" },
  { key: "compartidos", label: "Compartidos" },
];

/**
 * @param {Array<object>} rows - dataset del período, con fecha_publicacion (Date) y métricas.
 */
export function renderEvolutionChart(rows) {
  const card = document.createElement("div");
  card.className = "card chart-card";

  const toggle = document.createElement("div");
  toggle.className = "metric-toggle";
  toggle.style.marginBottom = "14px";

  const canvasWrap = document.createElement("div");
  const canvas = document.createElement("canvas");
  canvasWrap.appendChild(canvas);

  let activeMetric = "alcance";
  let chartInstance = null;

  function dataForMetric(metricKey) {
    const ordenadas = [...rows]
      .filter((r) => r.fecha_publicacion)
      .sort((a, b) => a.fecha_publicacion - b.fecha_publicacion);
    return {
      labels: ordenadas.map((r) =>
        r.fecha_publicacion.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit" })
      ),
      values: ordenadas.map((r) => (r[metricKey] == null ? null : metricKey === "engagement_rate" ? r[metricKey] * 100 : r[metricKey])),
    };
  }

  function draw(metricKey) {
    const { labels, values } = dataForMetric(metricKey);
    const label = METRIC_OPTIONS.find((m) => m.key === metricKey)?.label || metricKey;

    if (chartInstance) {
      chartInstance.destroy();
    }

    if (typeof Chart === "undefined") {
      canvasWrap.innerHTML = '<div class="empty-state">No se pudo cargar la librería de gráficos.</div>';
      return;
    }

    chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            borderColor: "#192743",
            backgroundColor: "rgba(25, 39, 67, 0.08)",
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: "#192743",
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#eef0f3" },
            ticks: {
              callback: (v) => (metricKey === "engagement_rate" ? `${v}%` : v),
            },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  METRIC_OPTIONS.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `metric-toggle__opt${opt.key === activeMetric ? " is-active" : ""}`;
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      activeMetric = opt.key;
      toggle.querySelectorAll(".metric-toggle__opt").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      draw(activeMetric);
    });
    toggle.appendChild(btn);
  });

  card.append(toggle, canvasWrap);

  // Dibuja en el próximo tick para asegurarse que el canvas ya está en el DOM (tiene ancho real).
  requestAnimationFrame(() => draw(activeMetric));

  return card;
}
