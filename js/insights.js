// ============================================================
// insights.js
// "Insights de contenido" para el dashboard de Marketing.
// Toda conclusión sale de los datos (mediana / percentiles /
// comparación contra el promedio del período), nunca de frases
// genéricas fijas.
// ============================================================

import { average, median, percentile, pctChange, formatPct, formatInt } from "./metrics.js";

const MAX_INSIGHTS = 6;

function tituloCorto(row) {
  return row.titulo ? row.titulo.trim() : "Publicación sin título";
}

/**
 * Genera insights de contenido a partir del dataset del período actual
 * (ya filtrado) y, si está disponible, del período anterior (para
 * detectar tendencia).
 */
export function buildContentInsights(current, previous = []) {
  if (!current || current.length === 0) return [];

  const insights = [];

  const avgEngagement = average(current, "engagement_rate");
  const avgShare = average(current, "share_rate");
  const avgSave = average(current, "save_rate");
  const medEngagement = median(current, "engagement_rate");
  const p75Alcance = percentile(current, "alcance", 75);
  const p25Alcance = percentile(current, "alcance", 25);
  const p75Engagement = percentile(current, "engagement_rate", 75);

  // 1) Engagement muy superior al promedio
  if (avgEngagement != null) {
    const mejor = [...current]
      .filter((r) => r.engagement_rate != null)
      .sort((a, b) => b.engagement_rate - a.engagement_rate)[0];
    if (mejor && mejor.engagement_rate > avgEngagement * 1.3) {
      const diff = pctChange(mejor.engagement_rate, avgEngagement);
      insights.push({
        tono: "positivo",
        tag: "Engagement destacado",
        mensaje: `"${tituloCorto(mejor)}" obtuvo un Engagement Rate de ${formatPct(
          mejor.engagement_rate
        )}, un ${diff.toFixed(0)}% superior al promedio del período (${formatPct(avgEngagement)}).`,
        magnitud: diff,
      });
    }
  }

  // 2) Alto nivel de compartidos
  if (avgShare != null && avgShare > 0) {
    const mejor = [...current]
      .filter((r) => r.share_rate != null)
      .sort((a, b) => b.share_rate - a.share_rate)[0];
    if (mejor && mejor.share_rate > avgShare * 1.5) {
      const diff = pctChange(mejor.share_rate, avgShare);
      insights.push({
        tono: "positivo",
        tag: "Alto nivel de compartidos",
        mensaje: `"${tituloCorto(mejor)}" tuvo un Share Rate ${diff.toFixed(
          0
        )}% superior al promedio de las publicaciones del período.`,
        magnitud: diff,
      });
    }
  }

  // 3) Alto nivel de guardados
  if (avgSave != null && avgSave > 0) {
    const mejor = [...current]
      .filter((r) => r.save_rate != null)
      .sort((a, b) => b.save_rate - a.save_rate)[0];
    if (mejor && mejor.save_rate > avgSave * 1.5) {
      const diff = pctChange(mejor.save_rate, avgSave);
      insights.push({
        tono: "positivo",
        tag: "Alto nivel de guardados",
        mensaje: `"${tituloCorto(mejor)}" fue guardada muy por encima del resto: Save Rate ${diff.toFixed(
          0
        )}% superior al promedio del período.`,
        magnitud: diff,
      });
    }
  }

  // 4) Alcance alto pero engagement bajo
  if (p75Alcance != null && medEngagement != null) {
    const caso = current.find(
      (r) => r.alcance >= p75Alcance && r.engagement_rate != null && r.engagement_rate < medEngagement
    );
    if (caso) {
      insights.push({
        tono: "alerta",
        tag: "Alcance alto, engagement bajo",
        mensaje: `"${tituloCorto(caso)}" alcanzó a ${formatInt(
          caso.alcance
        )} cuentas (top 25% del período) pero su Engagement Rate (${formatPct(
          caso.engagement_rate
        )}) está por debajo de la mediana (${formatPct(medEngagement)}). El contenido llegó, pero no generó interacción proporcional.`,
        magnitud: 50,
      });
    }
  }

  // 5) Alcance bajo pero engagement alto
  if (p25Alcance != null && p75Engagement != null) {
    const caso = current.find(
      (r) => r.alcance <= p25Alcance && r.engagement_rate != null && r.engagement_rate >= p75Engagement
    );
    if (caso) {
      insights.push({
        tono: "neutral",
        tag: "Oportunidad de alcance",
        mensaje: `"${tituloCorto(caso)}" tuvo poco alcance (${formatInt(
          caso.alcance
        )}) pero un Engagement Rate en el top 25% del período (${formatPct(
          caso.engagement_rate
        )}). Podría rendir mejor con más inversión en difusión.`,
        magnitud: 40,
      });
    }
  }

  // 6) Tendencia vs. período anterior
  if (previous && previous.length > 0) {
    const avgEngagementPrev = average(previous, "engagement_rate");
    if (avgEngagement != null && avgEngagementPrev != null) {
      const diff = pctChange(avgEngagement, avgEngagementPrev);
      if (diff != null && Math.abs(diff) >= 8) {
        insights.push({
          tono: diff > 0 ? "positivo" : "alerta",
          tag: diff > 0 ? "Crecimiento de rendimiento" : "Caída de rendimiento",
          mensaje: `El Engagement Rate promedio ${diff > 0 ? "subió" : "cayó"} un ${Math.abs(diff).toFixed(
            0
          )}% respecto al período anterior (${formatPct(avgEngagementPrev)} → ${formatPct(avgEngagement)}).`,
          magnitud: Math.abs(diff),
        });
      }
    }
  }

  // 7) Publicación que se diferencia claramente de la media (outlier genérico por alcance)
  const avgAlcance = average(current, "alcance");
  if (avgAlcance != null && avgAlcance > 0) {
    const outlier = [...current].sort((a, b) => b.alcance - a.alcance)[0];
    if (outlier && outlier.alcance > avgAlcance * 2 && current.length >= 4) {
      const diff = pctChange(outlier.alcance, avgAlcance);
      insights.push({
        tono: "positivo",
        tag: "Publicación atípica",
        mensaje: `"${tituloCorto(outlier)}" alcanzó ${formatInt(
          outlier.alcance
        )} cuentas, muy por encima del resto de publicaciones del período (${diff.toFixed(0)}% sobre el promedio).`,
        magnitud: diff,
      });
    }
  }

  return insights.sort((a, b) => b.magnitud - a.magnitud).slice(0, MAX_INSIGHTS);
}
