/* tema.js — Modo claro/escuro.
   Carregado no <head> (antes do CSS renderizar) para não "piscar" branco.
   O CSS aplica as variáveis do tema escuro quando <html> tem a classe dark-theme. */
(function aplicarTemaSalvo() {
  if (localStorage.getItem("schoolfix_theme") === "dark") {
    document.documentElement.classList.add("dark-theme");
  }
})();

window.alternarTema = function (ativarEscuro) {
  const escuro = ativarEscuro ?? !document.documentElement.classList.contains("dark-theme");
  document.documentElement.classList.toggle("dark-theme", escuro);
  localStorage.setItem("schoolfix_theme", escuro ? "dark" : "light");
  // Avisa quem desenha gráficos (Chart.js) para trocar as cores
  document.dispatchEvent(new CustomEvent("temaAlterado", { detail: { escuro } }));
};

window.temaEscuro = () => document.documentElement.classList.contains("dark-theme");

document.addEventListener("DOMContentLoaded", () => {
  const chk = document.getElementById("chk-tema");
  if (!chk) return;
  chk.checked = window.temaEscuro();
  chk.addEventListener("change", (e) => window.alternarTema(e.target.checked));
});
