// ============================================================
// dateFilter.js
// Selector de período reutilizable: 7 / 30 / 90 días o rango
// personalizado. Emite un CustomEvent "periodchange" con
// { detail: period } donde period es "7" | "30" | "90" | {start,end}.
// ============================================================

const PRESETS = [
  { key: "7", label: "7 días" },
  { key: "30", label: "30 días" },
  { key: "90", label: "90 días" },
];

/**
 * @param {string} initial - "7" | "30" | "90"
 * @returns {HTMLElement} contenedor con el filtro montado
 */
export function renderDateFilter(initial = "30") {
  const wrap = document.createElement("div");
  wrap.className = "date-filter";
  let current = initial;

  function emit(period) {
    wrap.dispatchEvent(new CustomEvent("periodchange", { detail: period, bubbles: true }));
  }

  function renderButtons() {
    wrap.querySelectorAll(".date-filter__opt").forEach((b) => b.remove());
    wrap.querySelectorAll(".date-filter__custom").forEach((b) => b.remove());

    PRESETS.forEach((preset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `date-filter__opt${current === preset.key ? " is-active" : ""}`;
      btn.textContent = preset.label;
      btn.addEventListener("click", () => {
        current = preset.key;
        renderButtons();
        emit(preset.key);
      });
      wrap.appendChild(btn);
    });

    const customBtn = document.createElement("button");
    customBtn.type = "button";
    customBtn.className = `date-filter__opt${typeof current === "object" ? " is-active" : ""}`;
    customBtn.textContent = "Personalizado";
    wrap.appendChild(customBtn);

    const customWrap = document.createElement("span");
    customWrap.className = "date-filter__custom";
    customWrap.style.display = typeof current === "object" ? "inline-flex" : "none";

    const startInput = document.createElement("input");
    startInput.type = "date";
    const endInput = document.createElement("input");
    endInput.type = "date";

    if (typeof current === "object") {
      startInput.value = toInputValue(current.start);
      endInput.value = toInputValue(current.end);
    }

    function applyCustom() {
      if (!startInput.value || !endInput.value) return;
      const range = { start: new Date(startInput.value), end: new Date(endInput.value) };
      current = range;
      emit(range);
    }

    startInput.addEventListener("change", applyCustom);
    endInput.addEventListener("change", applyCustom);

    customBtn.addEventListener("click", () => {
      customWrap.style.display = customWrap.style.display === "none" ? "inline-flex" : "none";
      if (!startInput.value) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        startInput.value = toInputValue(start);
        endInput.value = toInputValue(end);
      }
    });

    customWrap.append(startInput, endInput);
    wrap.appendChild(customWrap);
  }

  renderButtons();
  return wrap;
}

function toInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}
