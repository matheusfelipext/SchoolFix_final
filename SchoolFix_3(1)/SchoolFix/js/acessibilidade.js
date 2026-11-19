/* ============================================================================
   acessibilidade.js — leitura em voz alta com a voz do navegador (Web Speech API).
   Carregado em todas as páginas (login e os quatro portais), sempre por último.
   Ligado na barra ♿ ("Ler em voz alta"): o que está sob o mouse ou sob o foco do
   teclado é lido em português. "Ler a página inteira" lê o <main> do início ao fim.
   ========================================================================== */
(function () {
  const CHAVE = "schoolfix_voz";
  const sintese = window.speechSynthesis;
  const chk = document.getElementById("acess-voz");
  const btnTudo = document.getElementById("acess-ler-pagina");
  if (!sintese || !chk) { chk?.closest("label")?.remove(); btnTudo?.remove(); return; }

  let ultimo = null, timer = null;
  const SELETOR = "h1, h2, h3, p, li, td, th, label, button, a, summary, .kpi-value, .stat-value, .badge, .toast";

  function falar(texto, cancelar = true) {
    if (!texto) return;
    if (cancelar) sintese.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR"; u.rate = 1.05;
    const voz = sintese.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("pt"));
    if (voz) u.voice = voz;
    sintese.speak(u);
  }
  function textoDe(el) {
    if (el.matches("input, select, textarea")) {
      const rotulo = el.labels?.[0]?.textContent || el.getAttribute("aria-label") || el.placeholder || "";
      return `${rotulo.trim()}. ${el.value ? "Valor: " + el.value : "campo vazio"}`;
    }
    const alvo = el.closest(SELETOR) || el;
    return (alvo.getAttribute("aria-label") || alvo.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300);
  }
  function aoPassar(e) {
    const el = e.target.closest(SELETOR + ", input, select, textarea");
    if (!el || el === ultimo) return;
    ultimo = el; clearTimeout(timer);
    timer = setTimeout(() => chk.checked && falar(textoDe(el)), 180);
  }
  function aoFocar(e) { ultimo = e.target; if (chk.checked) falar(textoDe(e.target)); }
  function ligar(ativo) {
    chk.checked = ativo; localStorage.setItem(CHAVE, ativo ? "1" : "0");
    document[ativo ? "addEventListener" : "removeEventListener"]("mouseover", aoPassar);
    document[ativo ? "addEventListener" : "removeEventListener"]("focusin", aoFocar);
    if (ativo) falar("Leitura em voz alta ligada. Passe o mouse ou use Tab para ouvir."); else sintese.cancel();
  }
  chk.addEventListener("change", () => ligar(chk.checked));
  if (localStorage.getItem(CHAVE) === "1") ligar(true);

  btnTudo?.addEventListener("click", () => {
    if (sintese.speaking) { sintese.cancel(); btnTudo.classList.remove("ativo"); return; }
    const main = document.querySelector("main") || document.body;
    const partes = [...main.querySelectorAll("h1, h2, h3, p, li, td, th, label, .kpi-label, .kpi-value")]
      .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()).filter((t) => t.length > 1);
    sintese.cancel(); btnTudo.classList.add("ativo");
    partes.forEach((p, i) => falar(p, i === 0));
    const fim = setInterval(() => { if (!sintese.speaking) { btnTudo.classList.remove("ativo"); clearInterval(fim); } }, 500);
  });

  // Esc fecha o painel de notificações
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { const p = document.getElementById("notif-painel"); if (p) p.style.display = "none"; } });
})();
