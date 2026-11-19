/* mensagens.js — Mensagens diretas (1:1).

   GET  /api/conversas                          minhas conversas
   POST /api/conversas {destinatario_id}        abre/reaproveita
   GET  /api/conversas/<id>/mensagens?depois=   novas (marca como lidas)
   POST /api/conversas/<id>/mensagens
   GET  /api/usuarios/contatos                  pessoas para iniciar conversa */

let conversaAtivaId = null;
let ultimaEm = null;
let timerMsgs = null;
let timerConversas = null;

document.addEventListener("DOMContentLoaded", () => {
  carregarConversas();
  configurarNovaConversa();
  configurarEnvio();
  timerConversas = setInterval(carregarConversas, 10000);
});

async function carregarConversas() {
  const box = document.getElementById("lista-conversas");
  try {
    const conversas = await apiFetch("/api/conversas");
    if (!conversas.length) { box.innerHTML = '<div class="notif-vazio">Nenhuma conversa. Clique em + para iniciar.</div>'; return; }
    box.innerHTML = conversas.map((c) => `
      <div class="conv-item ${c.id === conversaAtivaId ? "active" : ""}" data-id="${c.id}" data-nome="${escapeHtml(c.outro_nome)}" data-perfil="${c.outro_perfil}">
        <div class="conv-topo">
          <strong>${escapeHtml(c.outro_nome)}</strong>
          ${c.nao_lidas ? `<span class="conv-badge">${c.nao_lidas}</span>` : ""}
        </div>
        <p>${escapeHtml(c.ultima_mensagem || "Conversa iniciada")}</p>
      </div>`).join("");
    box.querySelectorAll(".conv-item").forEach((el) =>
      el.addEventListener("click", () => abrirConversa(el.dataset.id, el.dataset.nome, el.dataset.perfil)));
  } catch (e) {
    box.innerHTML = `<div class="notif-vazio">${escapeHtml(e.message)}</div>`;
  }
}

function abrirConversa(id, nome, perfil) {
  conversaAtivaId = id;
  ultimaEm = null;
  document.querySelectorAll(".conv-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === id);
    if (el.dataset.id === id) el.querySelector(".conv-badge")?.remove();
  });
  document.getElementById("conversa-header").innerHTML =
    `<h3>${escapeHtml(nome)}</h3><p>${rotuloPerfil(perfil)} · Mensagem direta</p>`;
  document.getElementById("conversa-input").disabled = false;
  document.getElementById("conversa-enviar").disabled = false;
  document.getElementById("conversa-mensagens").innerHTML = '<p class="td-vazio">Carregando...</p>';

  clearInterval(timerMsgs);
  buscarMensagens(true);
  timerMsgs = setInterval(() => buscarMensagens(false), 4000);
}

async function buscarMensagens(inicial) {
  if (!conversaAtivaId) return;
  const box = document.getElementById("conversa-mensagens");
  const idNaHora = conversaAtivaId;
  try {
    const q = ultimaEm ? `?depois=${encodeURIComponent(ultimaEm)}` : "";
    const msgs = await apiFetch(`/api/conversas/${idNaHora}/mensagens${q}`);
    if (idNaHora !== conversaAtivaId) return;

    if (inicial) box.innerHTML = msgs.length ? "" : '<p class="td-vazio">Inicie a conversa enviando uma mensagem.</p>';
    if (msgs.length) {
      if (box.querySelector(".td-vazio")) box.innerHTML = "";
      const meuId = getUsuario()?.id;
      box.insertAdjacentHTML("beforeend", msgs.map((m) => `
        <article class="msg ${m.autor_id === meuId ? "msg-minha" : ""}">
          <div class="msg-topo"><strong>${escapeHtml(m.autor_nome)}</strong><span>${formatarHora(m.criado_em)}</span></div>
          <p>${escapeHtml(m.texto)}</p>
        </article>`).join(""));
      ultimaEm = msgs[msgs.length - 1].criado_em;
      box.scrollTop = box.scrollHeight;
    }
  } catch (e) {
    if (inicial) box.innerHTML = `<p class="td-vazio">${escapeHtml(e.message)}</p>`;
  }
}

function configurarEnvio() {
  const input = document.getElementById("conversa-input");
  const btn = document.getElementById("conversa-enviar");
  const enviar = async () => {
    const texto = input.value.trim();
    if (!texto || !conversaAtivaId) return;
    input.value = "";
    try {
      await apiFetch(`/api/conversas/${conversaAtivaId}/mensagens`, { method: "POST", body: { texto } });
      buscarMensagens(false);
      carregarConversas();
    } catch (e) { toast(e.message, "erro"); input.value = texto; }
  };
  btn.addEventListener("click", enviar);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); enviar(); } });
}

function configurarNovaConversa() {
  const btnNova = document.getElementById("btn-nova-conversa");
  const painel = document.getElementById("painel-nova-conversa");
  const select = document.getElementById("select-novo-contato");
  const btnOk = document.getElementById("btn-confirmar-nova-conversa");

  btnNova.addEventListener("click", async () => {
    const abrir = painel.style.display === "none";
    painel.style.display = abrir ? "block" : "none";
    if (!abrir) return;
    select.innerHTML = "<option>Carregando...</option>";
    try {
      const contatos = await apiFetch("/api/usuarios/contatos");
      select.innerHTML = contatos.map((u) =>
        `<option value="${u.id}">${escapeHtml(u.nome)} (${rotuloPerfil(u.perfil)})</option>`).join("");
    } catch (e) { select.innerHTML = `<option>${escapeHtml(e.message)}</option>`; }
  });

  btnOk.addEventListener("click", async () => {
    const destinatario_id = select.value;
    if (!destinatario_id) return;
    try {
      const conv = await apiFetch("/api/conversas", { method: "POST", body: { destinatario_id } });
      painel.style.display = "none";
      await carregarConversas();
      abrirConversa(conv.id, conv.outro_nome, conv.outro_perfil);
    } catch (e) { toast(e.message, "erro"); }
  });
}
