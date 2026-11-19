/* perfil.js — Perfil (perfil.html) e Editar dados pessoais (perfil-editar.html)
   de aluno e professor.

   - Nome, e-mail, matrícula/RA e cargo vêm da CONTA (login) — preenchidos pelo app.js
     através dos atributos data-usuario="..." do HTML.
   - Dados de contato editáveis (nome social, telefone, e-mail alternativo, endereço)
     ficam no localStorage, uma chave por usuário: schoolfix_perfil_<id>.
     Campos que a conta não tem (CPF, RG, curso...) continuam como texto do HTML. */

const CAMPOS_EXTRAS = ["social", "telefone", "email2", "endereco"];

function chaveExtras() { return `schoolfix_perfil_${getUsuario()?.id || "anon"}`; }
function lerExtras() {
  try { return JSON.parse(localStorage.getItem(chaveExtras()) || "{}"); } catch { return {}; }
}
function salvarExtras(dados) { localStorage.setItem(chaveExtras(), JSON.stringify(dados)); }

/** (19) 98876-6422 — aplica a máscara enquanto digita (10 ou 11 dígitos). */
function mascaraTelefone(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("form-perfil")) configurarEdicao();
  else mostrarPerfil();
});

// ---------------------------------------------------------------------------
// perfil.html — só leitura
// ---------------------------------------------------------------------------
function mostrarPerfil() {
  const extras = lerExtras();
  const primeiroNome = (getUsuario()?.nome || "").split(" ")[0];
  document.querySelectorAll("[data-extra]").forEach((el) => {
    const chave = el.dataset.extra;
    const valor = extras[chave] || (chave === "social" ? primeiroNome : "");
    if (valor) el.textContent = valor;
    else if (chave === "email2") el.textContent = "—";   // opcional: sem valor, não inventa nada
  });
}

// ---------------------------------------------------------------------------
// perfil-editar.html — formulário
// ---------------------------------------------------------------------------
function configurarEdicao() {
  const u = getUsuario() || {};
  const $ = (id) => document.getElementById(id);
  const extras = lerExtras();

  // Bloqueados (só a secretaria altera): vêm da conta
  $("nome").value = u.nome || "";
  $("matricula").value = u.matricula || "";
  $("email").value = u.email || "";

  // Editáveis: o que foi salvo antes; senão o valor que já está no HTML (exemplo)
  $("social").value = extras.social ?? (u.nome || "").split(" ")[0];   // sem nada salvo: primeiro nome
  if (extras.telefone != null) $("telefone").value = extras.telefone;
  if (extras.email2 != null) $("email2").value = extras.email2;
  if (extras.endereco != null) $("endereco").value = extras.endereco;

  $("telefone").addEventListener("input", (e) => { e.target.value = mascaraTelefone(e.target.value); });

  $("form-perfil").addEventListener("submit", (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(CAMPOS_EXTRAS.map((c) => [c, $(c).value.trim()]));

    if (dados.telefone && dados.telefone.replace(/\D/g, "").length < 10) return toast("Informe o telefone com DDD (10 ou 11 dígitos).", "erro");
    if (dados.email2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email2)) return toast("O e-mail alternativo parece inválido.", "erro");
    if (dados.social.length > 60) return toast("O nome social pode ter no máximo 60 caracteres.", "erro");

    salvarExtras(dados);
    toast("Dados atualizados!", "sucesso");
    setTimeout(() => (window.location.href = "perfil.html"), 800);
  });
}
