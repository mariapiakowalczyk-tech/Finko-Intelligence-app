// ============================================================
// pages/login.js
// ============================================================

import { signIn, getSessionAndRole, PAGINA_POR_ROL } from "../auth.js";

async function redirigirSiYaHaySesion() {
  const { session, rol } = await getSessionAndRole();
  if (session && rol) {
    window.location.href = PAGINA_POR_ROL[rol];
  }
}
redirigirSiYaHaySesion();

const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");
const submitBtn = form.querySelector(".login-card__submit");

function mostrarError(mensaje) {
  errorEl.textContent = mensaje;
  errorEl.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.hidden = true;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  submitBtn.disabled = true;
  submitBtn.textContent = "Entrando…";

  try {
    await signIn(email, password);
    const { rol } = await getSessionAndRole();
    if (!rol) {
      throw new Error("Tu usuario no tiene un perfil asignado todavía. Contactá al administrador del sistema.");
    }
    window.location.href = PAGINA_POR_ROL[rol];
  } catch (err) {
    const mensaje =
      err.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos."
        : err.message || "No se pudo iniciar sesión.";
    mostrarError(mensaje);
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
  }
});
