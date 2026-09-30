// ============================================================
// nav.js
// Barra de navegación compartida entre index / marketing / comercial.
// ============================================================

/**
 * @param {"landing"|"marketing"|"comercial"} active
 */
export function renderNav(active) {
  const nav = document.createElement("header");
  nav.className = "finko-nav";

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
    <div class="finko-nav__meta">Finko Intelligence</div>
  `;

  return nav;
}

export function mountNav(active) {
  document.body.prepend(renderNav(active));
}
