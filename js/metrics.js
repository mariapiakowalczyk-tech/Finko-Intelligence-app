// ============================================================
// metrics.js
// Cálculos puros sobre las publicaciones: métricas derivadas,
// agregados (suma/promedio/mediana/percentil), filtros de período
// y comparación contra el período anterior.
//
// Ninguna función acá toca el DOM ni hace fetch: son funciones
// puras, fáciles de reutilizar desde Marketing y Dirección Comercial.
// ============================================================

/** División seguro: nunca devuelve NaN/Infinity, devuelve null si no se puede calcular. */
export function safeDiv(numerator, denominator) {
  if (numerator == null || denominator == null) return null;
  if (denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Agrega las métricas derivadas a una publicación cruda de Supabase.
 * Maneja alcance = 0 / NULL / datos incompletos sin romper la UI.
 */
export function computeDerived(row) {
  const alcance = num(row.alcance);
  const interacciones = num(row.interacciones);
  const guardados = num(row.guardados);
  const compartidos = num(row.compartidos);

  const engagement_rate = safeDiv(interacciones, alcance);
  const save_rate = safeDiv(guardados, alcance);
  const share_rate = safeDiv(compartidos, alcance);

  const per1000 = (valor) => {
    const r = safeDiv(valor, alcance);
    return r == null ? null : r * 1000;
  };

  return {
    ...row,
    alcance,
    interacciones,
    guardados,
    compartidos,
    fecha_publicacion: row.fecha_publicacion ? new Date(row.fecha_publicacion) : null,
    engagement_rate,
    save_rate,
    share_rate,
    interacciones_por_1000: per1000(interacciones),
    guardados_por_1000: per1000(guardados),
    compartidos_por_1000: per1000(compartidos),
  };
}

/** Prepara el dataset completo: agrega métricas derivadas a cada fila. */
export function prepareDataset(rawRows) {
  return rawRows.map(computeDerived);
}

// ---------------- Agregados ----------------

export function sum(rows, key) {
  return rows.reduce((acc, r) => acc + (r[key] == null ? 0 : r[key]), 0);
}

export function average(rows, key) {
  const valores = rows.map((r) => r[key]).filter((v) => v != null && Number.isFinite(v));
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

export function median(rows, key) {
  return percentile(rows, key, 50);
}

/** Percentil (0-100) sobre los valores no nulos de `key`. */
export function percentile(rows, key, p) {
  const valores = rows
    .map((r) => (typeof r === "number" ? r : r[key]))
    .filter((v) => v != null && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (valores.length === 0) return null;
  if (valores.length === 1) return valores[0];
  const idx = (p / 100) * (valores.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return valores[lo];
  return valores[lo] + (valores[hi] - valores[lo]) * (idx - lo);
}

/** % de cambio entre dos números; null si no se puede calcular (ej. base = 0). */
export function pctChange(actual, anterior) {
  if (actual == null || anterior == null || anterior === 0) return null;
  const r = ((actual - anterior) / Math.abs(anterior)) * 100;
  return Number.isFinite(r) ? r : null;
}

// ---------------- Filtro de período ----------------

/**
 * period: "7" | "30" | "90" | { start: Date, end: Date }
 * Referencia temporal: "hoy" (fecha real del sistema).
 * Devuelve { start, end } (Date, inclusive) para ese período.
 */
export function resolvePeriodRange(period, referenceDate = new Date()) {
  if (period && typeof period === "object" && period.start && period.end) {
    return { start: new Date(period.start), end: new Date(period.end) };
  }
  const days = Number(period) || 30;
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

/** Rango del período inmediatamente anterior, de igual longitud. */
export function previousPeriodRange({ start, end }) {
  const lengthMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - lengthMs);
  return { start: prevStart, end: prevEnd };
}

export function filterByRange(rows, range) {
  return rows.filter((r) => {
    if (!r.fecha_publicacion) return false;
    const t = r.fecha_publicacion.getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  });
}

/**
 * Dado el dataset completo y un período, devuelve { current, previous, range, previousRange }.
 */
export function splitByPeriod(rows, period, referenceDate = new Date()) {
  const range = resolvePeriodRange(period, referenceDate);
  const previousRange = previousPeriodRange(range);
  return {
    current: filterByRange(rows, range),
    previous: filterByRange(rows, previousRange),
    range,
    previousRange,
  };
}

// ---------------- KPIs ----------------

/**
 * Arma los datos de una KPI card: valor actual + variación vs. período anterior.
 * formatter: (n) => string
 */
export function buildKpi({ label, current, previous, key, formatter, higherIsBetter = true }) {
  const valorActual = key === "count" ? current.length : sum(current, key);
  const valorAnterior = key === "count" ? previous.length : sum(previous, key);
  const delta = pctChange(valorActual, valorAnterior);

  let direction = "flat";
  if (delta != null && Math.abs(delta) >= 0.5) {
    const subiendo = delta > 0;
    direction = subiendo === higherIsBetter ? "up" : "down";
    if (!higherIsBetter && !subiendo) direction = "up";
    if (!higherIsBetter && subiendo) direction = "down";
  }

  return {
    label,
    value: formatter ? formatter(valorActual) : valorActual,
    rawValue: valorActual,
    delta,
    direction,
  };
}

// ---------------- Formatters ----------------

export function formatInt(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("es-UY");
}

export function formatPct(n, decimals = 1) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(decimals)}%`;
}

export function formatPctPoints(n, decimals = 1) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

export function formatDate(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Primera palabra "significativa" del título (VENTA / ALQUILER / otro), usada para agrupar por categoría. */
export function extractCategoria(titulo) {
  if (!titulo) return "Otro";
  const primera = titulo.trim().split(/[\s.]+/)[0]?.toUpperCase();
  if (primera === "VENTA" || primera === "ALQUILER") return primera;
  return "Otro";
}
