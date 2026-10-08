// ============================================================
// executive.js
// Lógica para el dashboard de Dirección Comercial: estado general,
// "Requieren atención", "Oportunidades detectadas" y el resumen
// ejecutivo.
//
// Los umbrales usados están basados en mediana / percentiles del
// propio período (no en números arbitrarios), y están declarados
// como constantes acá arriba para que sean fáciles de ajustar.
//
// Cada alerta y cada oportunidad lleva un `codigo_situacion`: un
// identificador estable de QUÉ detectó el sistema (no cambia
// aunque cambien los textos). Es el mismo código que va en la
// columna `situacion` de la tabla `criterios_comerciales` — así
// el equipo puede definir ahí la decisión comercial real para
// cada código, y el dashboard la va a mostrar automáticamente
// (ver "Sistema de recomendaciones con IA — Plan de diseño").
// ============================================================

import {
  average,
  median,
  percentile,
  pctChange,
  extractCategoria,
  formatPct,
  formatInt,
} from "./metrics.js";

// Umbrales (documentados, ajustables)
const CAIDA_ENGAGEMENT_REVISION = -15; // % vs período anterior
const CAIDA_ENGAGEMENT_ATENCION = -5;
const PROPORCION_ALERTAS_REVISION = 0.3; // 30% de publicaciones con alerta
const PROPORCION_ALERTAS_ATENCION = 0.1;

// ---------------- Alertas: "Requieren atención" ----------------

export function buildAlerts(current) {
  if (!current || current.length < 3) return [];

  const alertas = [];
  const medEngagement = median(current, "engagement_rate");
  const p25Alcance = percentile(current, "alcance", 25);
  const p75Alcance = percentile(current, "alcance", 75);
  const medGuardados = median(current, "guardados");
  const medCompartidos = median(current, "compartidos");

  current.forEach((r) => {
    const motivos = [];

    if (p25Alcance != null && r.alcance <= p25Alcance) {
      motivos.push({
        codigo: "alcance_bajo",
        texto: `alcance (${formatInt(r.alcance)}) muy por debajo del promedio del período`,
      });
    }
    if (medEngagement != null && r.engagement_rate != null && r.engagement_rate < medEngagement * 0.5) {
      motivos.push({
        codigo: "engagement_muy_bajo",
        texto: `Engagement Rate significativamente bajo (${formatPct(r.engagement_rate)})`,
      });
    }
    if (
      p75Alcance != null &&
      medEngagement != null &&
      r.alcance >= p75Alcance &&
      r.engagement_rate != null &&
      r.engagement_rate < medEngagement
    ) {
      motivos.push({
        codigo: "alcance_alto_engagement_bajo",
        texto: "mucho alcance pero pocas interacciones en relación al resto",
      });
    }
    if (
      (r.guardados ?? 0) === 0 &&
      (r.compartidos ?? 0) === 0 &&
      ((medGuardados != null && medGuardados > 0) || (medCompartidos != null && medCompartidos > 0))
    ) {
      motivos.push({
        codigo: "sin_guardados_ni_compartidos",
        texto: "sin guardados ni compartidos, cuando publicaciones similares sí los tienen",
      });
    }

    if (motivos.length > 0) {
      const principal = motivos[0];
      alertas.push({
        titulo: r.titulo || "Publicación sin título",
        fecha_publicacion: r.fecha_publicacion,
        descripcion: `${principal.texto[0].toUpperCase()}${principal.texto.slice(1)}.`,
        codigo_situacion: principal.codigo,
        cantidadMotivos: motivos.length,
        row: r,
      });
    }
  });

  // Solo lo más relevante: hasta 2 motivos por publicación no suma más alertas
  return alertas.sort((a, b) => b.cantidadMotivos - a.cantidadMotivos).slice(0, 6);
}

// ---------------- Oportunidades detectadas ----------------

export function buildOpportunities(current) {
  if (!current || current.length < 3) return [];

  const oportunidades = [];
  const medAlcance = median(current, "alcance");
  const p75Engagement = percentile(current, "engagement_rate", 75);
  const p75Share = percentile(current, "share_rate", 75);
  const p75Guardados = percentile(current, "guardados", 75);
  const avgEngagement = average(current, "engagement_rate");

  // Engagement alto, poco alcance
  const casoEngagementAlcance = current.find(
    (r) =>
      medAlcance != null &&
      p75Engagement != null &&
      r.alcance < medAlcance &&
      r.engagement_rate != null &&
      r.engagement_rate >= p75Engagement
  );
  if (casoEngagementAlcance) {
    oportunidades.push({
      titulo: casoEngagementAlcance.titulo || "Publicación sin título",
      observado: `Engagement Rate de ${formatPct(
        casoEngagementAlcance.engagement_rate
      )} (top 25% del período) con un alcance de solo ${formatInt(casoEngagementAlcance.alcance)}.`,
      recomendacion: "Evaluar invertir en difusión para este contenido: el mensaje funciona, falta alcance.",
      codigo_situacion: "engagement_alto_alcance_bajo",
    });
  }

  // Alto nivel de compartidos
  const casoShare = p75Share != null && current.find((r) => r.share_rate != null && r.share_rate >= p75Share && p75Share > 0);
  if (casoShare) {
    oportunidades.push({
      titulo: casoShare.titulo || "Publicación sin título",
      observado: `Share Rate de ${formatPct(casoShare.share_rate)}, el más alto del período.`,
      recomendacion: "Este formato de contenido tiene buena capacidad de difusión orgánica: considerar replicarlo.",
      codigo_situacion: "share_rate_alto",
    });
  }

  // Muchos guardados
  const casoGuardados =
    p75Guardados != null && p75Guardados > 0 && current.find((r) => r.guardados >= p75Guardados);
  if (casoGuardados) {
    oportunidades.push({
      titulo: casoGuardados.titulo || "Publicación sin título",
      observado: `${formatInt(casoGuardados.guardados)} guardados, muy por encima del resto de publicaciones.`,
      recomendacion: "Alto interés de guardado sugiere intención de consulta: dar seguimiento comercial a esta propiedad.",
      codigo_situacion: "guardados_altos",
    });
  }

  // Categoría con mejor desempeño consistente (VENTA vs ALQUILER vs Otro)
  if (avgEngagement != null) {
    const categorias = {};
    current.forEach((r) => {
      const cat = extractCategoria(r.titulo);
      if (!categorias[cat]) categorias[cat] = [];
      if (r.engagement_rate != null) categorias[cat].push(r.engagement_rate);
    });
    // "Otro" es un cajón de sastre (contenido institucional/varios), no una
    // categoría de negocio: no se recomienda como la de mejor desempeño.
    const entradas = Object.entries(categorias).filter(([cat, arr]) => cat !== "Otro" && arr.length >= 2);
    if (entradas.length >= 2) {
      const promedios = entradas.map(([cat, arr]) => [cat, arr.reduce((a, b) => a + b, 0) / arr.length]);
      promedios.sort((a, b) => b[1] - a[1]);
      const [mejorCat, mejorProm] = promedios[0];
      const [, segundoProm] = promedios[1];
      const diff = pctChange(mejorProm, segundoProm);
      if (diff != null && diff >= 15) {
        oportunidades.push({
          titulo: `Contenido de ${mejorCat}`,
          observado: `El contenido de ${mejorCat} tiene un Engagement Rate promedio ${diff.toFixed(
            0
          )}% superior al resto de las categorías en este período.`,
          recomendacion: `Priorizar publicaciones de ${mejorCat} muestra mayor capacidad de difusión y respuesta.`,
          codigo_situacion: "categoria_destacada",
        });
      }
    }
  }

  return oportunidades.slice(0, 4);
}

// ---------------- Estado general ----------------

/**
 * Calcula el estado (Positivo / Atención / Requiere revisión) a partir de:
 * - variación del Engagement Rate promedio vs. período anterior
 * - proporción de publicaciones marcadas con alerta
 * Ninguno de los dos criterios es arbitrario: ambos salen de la
 * comparación contra el propio historial del período.
 */
export function computeStatus(current, previous, alerts) {
  if (!current || current.length === 0) {
    return { nivel: "atencion", titulo: "Sin datos suficientes", descripcion: "No hay publicaciones en este período." };
  }

  const avgEngagement = average(current, "engagement_rate");
  const avgEngagementPrev = average(previous, "engagement_rate");
  const diffEngagement = pctChange(avgEngagement, avgEngagementPrev);
  const proporcionAlertas = alerts.length / current.length;

  const señales = [];
  if (diffEngagement != null) señales.push(diffEngagement);

  let nivel = "positivo";
  if (
    (diffEngagement != null && diffEngagement <= CAIDA_ENGAGEMENT_REVISION) ||
    proporcionAlertas >= PROPORCION_ALERTAS_REVISION
  ) {
    nivel = "revision";
  } else if (
    (diffEngagement != null && diffEngagement <= CAIDA_ENGAGEMENT_ATENCION) ||
    proporcionAlertas >= PROPORCION_ALERTAS_ATENCION
  ) {
    nivel = "atencion";
  }

  const textos = {
    positivo: {
      titulo: "Positivo",
      descripcion:
        diffEngagement != null
          ? `El engagement se mantiene estable o en alza (${diffEngagement >= 0 ? "+" : ""}${diffEngagement.toFixed(
              0
            )}% vs. período anterior).`
          : "El rendimiento del período no muestra señales de alerta.",
    },
    atencion: {
      titulo: "Atención",
      descripcion:
        diffEngagement != null && diffEngagement <= CAIDA_ENGAGEMENT_ATENCION
          ? `El Engagement Rate promedio cayó ${Math.abs(diffEngagement).toFixed(0)}% vs. el período anterior.`
          : `${alerts.length} de ${current.length} publicaciones requieren revisión.`,
    },
    revision: {
      titulo: "Requiere revisión",
      descripcion:
        diffEngagement != null && diffEngagement <= CAIDA_ENGAGEMENT_REVISION
          ? `Caída fuerte de engagement: ${Math.abs(diffEngagement).toFixed(0)}% respecto al período anterior.`
          : `${alerts.length} de ${current.length} publicaciones (${Math.round(
              proporcionAlertas * 100
            )}%) muestran un rendimiento por debajo de lo esperado.`,
    },
  };

  return { nivel, ...textos[nivel] };
}

// ---------------- Resumen ejecutivo ----------------

/**
 * Punto de integración para un modelo de IA a futuro.
 * Hoy devuelve null (no hay integración configurada); cuando se
 * conecte un modelo, esta función debe devolver el texto generado
 * y `generateExecutiveSummary` lo va a usar en lugar de la versión
 * basada en reglas.
 */
async function generateExecutiveSummaryWithAI(/* payload */) {
  // TODO: conectar acá un modelo de IA (ej. llamar a un endpoint propio
  // tipo /api/resumen-ejecutivo que a su vez llame a un LLM con estos
  // mismos datos ya calculados). Mientras no exista esa integración,
  // se devuelve null y se usa el resumen determinístico de abajo.
  return null;
}

/**
 * Resumen ejecutivo armado a partir de los datos reales del período
 * (no es una respuesta de IA simulada: es texto generado por reglas,
 * con la arquitectura lista para reemplazarlo por una llamada a un
 * modelo cuando exista esa integración).
 */
export async function generateExecutiveSummary({ current, previous, alerts, opportunities }) {
  const iaTexto = await generateExecutiveSummaryWithAI({ current, previous, alerts, opportunities });
  if (iaTexto) return { texto: iaTexto, generadoPorIA: true, highlights: [] };

  if (!current || current.length === 0) {
    return {
      texto: "Todavía no hay publicaciones registradas en este período para generar un resumen.",
      generadoPorIA: false,
      highlights: [],
    };
  }

  const totalAlcance = current.reduce((a, r) => a + (r.alcance || 0), 0);
  const totalAlcancePrev = previous.reduce((a, r) => a + (r.alcance || 0), 0);
  const diffAlcance = pctChange(totalAlcance, totalAlcancePrev);

  const topAlcance = [...current].sort((a, b) => b.alcance - a.alcance)[0];
  const topShare = [...current]
    .filter((r) => r.share_rate != null)
    .sort((a, b) => b.share_rate - a.share_rate)[0];

  const medEngagement = median(current, "engagement_rate");
  const bajoRendimiento =
    medEngagement != null
      ? current.filter((r) => r.engagement_rate != null && r.engagement_rate < medEngagement * 0.5)
      : [];

  const categorias = {};
  current.forEach((r) => {
    const cat = extractCategoria(r.titulo);
    if (!categorias[cat]) categorias[cat] = [];
    if (r.engagement_rate != null) categorias[cat].push(r.engagement_rate);
  });
  const entradasCategoria = Object.entries(categorias).filter(([cat, arr]) => cat !== "Otro" && arr.length >= 2);
  let fraseCategoria = "";
  if (entradasCategoria.length >= 2) {
    const promedios = entradasCategoria.map(([cat, arr]) => [cat, arr.reduce((a, b) => a + b, 0) / arr.length]);
    promedios.sort((a, b) => b[1] - a[1]);
    fraseCategoria = ` El contenido relacionado con ${promedios[0][0]} muestra una mayor capacidad de difusión que el resto.`;
  }

  const frases = [];
  frases.push(
    diffAlcance != null
      ? `Durante el período analizado, el alcance total ${diffAlcance >= 0 ? "aumentó" : "cayó"} un ${Math.abs(
          diffAlcance
        ).toFixed(0)}% respecto al período anterior (${formatInt(totalAlcancePrev)} → ${formatInt(totalAlcance)}).`
      : `Durante el período analizado, el alcance total fue de ${formatInt(totalAlcance)} cuentas.`
  );
  if (topAlcance) {
    frases.push(
      `"${topAlcance.titulo || "Sin título"}" lideró en alcance${
        topShare && topShare !== topAlcance ? `, mientras que "${topShare.titulo || "Sin título"}" obtuvo la mayor tasa de compartidos` : ""
      }.`
    );
  }
  if (bajoRendimiento.length > 0) {
    frases.push(
      `Se ${bajoRendimiento.length === 1 ? "detectó una publicación" : `detectaron ${bajoRendimiento.length} publicaciones`} con rendimiento significativamente inferior a la mediana del período.`
    );
  }
  frases.push(`${fraseCategoria}`.trim());

  const texto = frases.filter(Boolean).join(" ");

  return {
    texto,
    generadoPorIA: false,
    highlights: [
      { label: "Alcance total", value: formatInt(totalAlcance) },
      { label: "Publicación líder", value: topAlcance ? topAlcance.titulo || "—" : "—" },
      { label: "Publicaciones en alerta", value: String(alerts.length) },
      { label: "Oportunidades detectadas", value: String(opportunities.length) },
    ],
  };
}
