// ============================================================
// postTable.js
// Tabla moderna de publicaciones: orden por columna, búsqueda,
// y un estado de rendimiento calculado (alto/medio/bajo) en base
// a la mediana del Engagement Rate del propio dataset mostrado.
// El post_id nunca se muestra: solo se guarda internamente en la fila.
// ============================================================

import { median, formatInt, formatPct, formatDate } from "../metrics.js";

const COLUMNS = [
  { key: "fecha_publicacion", label: "Fecha", type: "date" },
  { key: "titulo", label: "Título", type: "text", className: "col-title" },
  { key: "alcance", label: "Alcance", type: "number" },
  { key: "interacciones", label: "Interacciones", type: "number" },
  { key: "engagement_rate", label: "Engagement", type: "pct" },
  { key: "guardados", label: "Guardados", type: "number" },
  { key: "compartidos", label: "Compartidos", type: "number" },
  { key: "save_rate", label: "Save Rate", type: "pct" },
  { key: "share_rate", label: "Share Rate", type: "pct" },
  { key: "estado", label: "Rendimiento", type: "estado" },
];

function estadoDe(row, medEngagement) {
  if (row.engagement_rate == null || medEngagement == null) return { nivel: "medio", label: "Sin datos" };
  if (row.engagement_rate >= medEngagement * 1.2) return { nivel: "alto", label: "Alto" };
  if (row.engagement_rate <= medEngagement * 0.6) return { nivel: "bajo", label: "Bajo" };
  return { nivel: "medio", label: "Medio" };
}

function formatCell(row, col, medEngagement) {
  switch (col.type) {
    case "date":
      return formatDate(row.fecha_publicacion);
    case "number":
      return formatInt(row[col.key]);
    case "pct":
      return formatPct(row[col.key]);
    case "estado": {
      const e = estadoDe(row, medEngagement);
      return `<span class="perf-pill is-${e.nivel}">${e.label}</span>`;
    }
    default:
      return escapeHtml(row[col.key] ?? "—");
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function renderPostTable(rows) {
  const wrap = document.createElement("div");

  const toolbar = document.createElement("div");
  toolbar.className = "table-toolbar";
  toolbar.innerHTML = `
    <input type="search" class="table-search" placeholder="Buscar publicación…" />
    <span class="text-muted" style="font-size:12.5px;"></span>
  `;
  const searchInput = toolbar.querySelector("input");
  const countLabel = toolbar.querySelector("span");

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";

  const medEngagement = median(rows, "engagement_rate");

  let sortKey = "fecha_publicacion";
  let sortDir = -1;
  let query = "";

  function getFiltered() {
    const q = query.trim().toLowerCase();
    let data = rows;
    if (q) {
      data = data.filter((r) => (r.titulo || "").toLowerCase().includes(q));
    }
    data = [...data].sort((a, b) => {
      let av = sortKey === "estado" ? (a.engagement_rate ?? -Infinity) : a[sortKey];
      let bv = sortKey === "estado" ? (b.engagement_rate ?? -Infinity) : b[sortKey];
      if (av instanceof Date) av = av.getTime();
      if (bv instanceof Date) bv = bv.getTime();
      if (av == null) av = sortDir === 1 ? Infinity : -Infinity;
      if (bv == null) bv = sortDir === 1 ? Infinity : -Infinity;
      if (typeof av === "string") return sortDir * av.localeCompare(bv);
      return sortDir * ((av > bv) - (av < bv));
    });
    return data;
  }

  function draw() {
    const data = getFiltered();
    countLabel.textContent = `${data.length} publicaci${data.length === 1 ? "ón" : "ones"}`;

    const table = document.createElement("table");
    table.className = "post-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    COLUMNS.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col.label + (sortKey === col.key ? (sortDir === 1 ? " ↑" : " ↓") : "");
      if (sortKey === col.key) th.classList.add("is-sorted");
      th.addEventListener("click", () => {
        if (sortKey === col.key) {
          sortDir *= -1;
        } else {
          sortKey = col.key;
          sortDir = col.type === "text" ? 1 : -1;
        }
        draw();
      });
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement("tbody");
    if (data.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = COLUMNS.length;
      td.className = "empty-state";
      td.textContent = "No hay publicaciones que coincidan con la búsqueda.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      data.forEach((row) => {
        const tr = document.createElement("tr");
        COLUMNS.forEach((col) => {
          const td = document.createElement("td");
          if (col.className) td.className = col.className;
          td.innerHTML = formatCell(row, col, medEngagement);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    table.append(thead, tbody);

    tableWrap.innerHTML = "";
    tableWrap.appendChild(table);
  }

  searchInput.addEventListener("input", (e) => {
    query = e.target.value;
    draw();
  });

  draw();

  wrap.append(toolbar, tableWrap);
  return wrap;
}
