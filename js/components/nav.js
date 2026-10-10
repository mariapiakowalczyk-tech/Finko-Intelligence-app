// ============================================================
// nav.js
// Barra de navegación compartida entre marketing / comercial.
// Muestra quién inició sesión y un botón para cerrarla.
// ============================================================

import { signOut } from "../auth.js";

const ROL_LABEL = {
  marketing: "Marketing",
  direccion_comercial: "Dirección Comercial",
};

/**
 * @param {"marketing"|"comercial"} active
 * @param {{ nombre?: string, rol?: string }} [auth]
 */
export function renderNav(active, auth = {}) {
  const nav = document.createElement("header");
  nav.className = "finko-nav";

  const usuarioLabel = auth.nombre || ROL_LABEL[auth.rol] || "";

  nav.innerHTML = `
    <div class="finko-nav__brand">
      <a href="/index.html" aria-label="Finko Intelligence">
        <img src="/assets/finko-logo-white.png" alt="Finko Real Estate" />
      </a>
    </div>
    <nav class="finko-nav__links">
      <a class="finko-nav__link ${active === "marketing" ? "is-active" : ""}" href="/marketing.html">Marketing</a>
      <a class="finko-nav__link ${active === "comercial" ? "is-active" : ""}" href="/comercial.html">Dirección Comercial</a>
    </nav>
    <div class="finko-nav__meta">
      ${usuarioLabel ? `<span class="finko-nav__user">${usuarioLabel}</span>` : ""}
      <button type="button" class="finko-nav__logout" id="finko-nav-logout">Cerrar sesión</button>
    </div>
  `;

  nav.querySelector("#finko-nav-logout").addEventListener("click", () => {
    signOut();
  });

  return nav;
}

export function mountNav(active, auth) {
  document.body.prepend(renderNav(active, auth));
}
