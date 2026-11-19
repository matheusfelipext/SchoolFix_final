/* fale-direcao.js — "Fale com a Direção" (aluno e professor).

   É uma conversa 1:1 fixa com o diretor, sem escolher contato:
   GET  /api/usuarios/contatos                  acha o diretor
   POST /api/conversas {destinatario_id}        abre (ou reaproveita) a conversa
   GET  /api/conversas/<id>/mensagens?depois=   só o que é novo (marca como lidas)
   POST /api/conversas/<id>/mensagens

   Sem WebSocket: a cada 4 s pedimos só as mensagens novas (mesmo esquema do chat.js). */

let conversaId = null;
let ultimaEm = null;
let timer = null;

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
  configurarEnvio();
  const lista = document.getElementById("fd-contatos");
  try {
    const contatos = await apiFetch("/api/usuarios/contatos");
    const diretor = contatos.find((c) => c.perfil === "diretor");
    if (!diretor) {
      lista.innerHTML = '<div class="notif-vazio">Nenhum diretor cadastrado no momento.</div>';
      document.getElementById("fd-mensagens").innerHTML = '<p class="td-vazio">Canal indisponível.</p>';
      return;
    }
    const conv = await apiFetch("/api/conversas", { method: "POST", body: { destinatario_id: diretor.id } });
    conversaId = conv.id;

    lista.innerHTML = `
      <div class="conv-item active">
        <div class="conv-topo"><strong>Direção — ${escapeHtml(conv.outro_nome)}</strong></div>
        <p id="fd-ultima">${escapeHtml(conv.ultima_mensagem || "Conversa iniciada")}</p>
      </div>`;
    document.getElementById("fd-titulo").textContent = `Direção — ${conv.outro_nome}`;
    document.getElementById("fd-sub").textContent = `${rotuloPerfil(conv.outro_perfil)} · Mensagem direta`;
    document.getElementById("fd-input").disabled = false;
    document.getElementById("fd-enviar").disabled = false;

    await buscarMensagens(true);
    timer = setInterval(() => buscarMensagens(false), 4000);
  } catch (e) {
    lista.innerHTML = `<div class="notif-vazio">${escapeHtml(e.message)}</div>`;
  }
}

function boasVindas() {
  const nome = (getUsuario()?.nome || "").split(" ")[0];
  return `
    <article class="msg msg-boas-vindas">
      <div class="msg-topo"><strong>Direção</strong></div>
      <p>Olá${nome ? " " + escapeHtml(nome) : ""}. Como podemos ajudar? Suas mensagens neste canal são tratadas com total sigilo.</p>
    </article>`;
}

async function buscarMensagens(inicial) {
  if (!conversaId) return;
  const box = document.getElementById("fd-mensagens");
  try {
    const q = ultimaEm ? `?depois=${encodeURIComponent(ultimaEm)}` : "";
    const msgs = await apiFetch(`/api/conversas/${conversaId}/mensagens${q}`);

    if (inicial) box.innerHTML = "";                        // tira o "Carregando..."
    if (inicial && !msgs.length) { box.innerHTML = boasVindas(); return; }
    if (!msgs.length) return;

    box.querySelector(".msg-boas-vindas")?.remove();
    const meuId = getUsuario()?.id;
    box.insertAdjacentHTML("beforeend", msgs.map((m) => `
      <article class="msg ${m.autor_id === meuId ? "msg-minha" : ""}">
        <div class="msg-topo"><strong>${escapeHtml(m.autor_id === meuId ? "Você" : m.autor_nome)}</strong><span>${formatarHora(m.criado_em)}</span></div>
        <p>${escapeHtml(m.texto)}</p>
      </article>`).join(""));
    ultimaEm = msgs[msgs.length - 1].criado_em;
    const ultima = document.getElementById("fd-ultima");
    if (ultima) ultima.textContent = msgs[msgs.length - 1].texto;
    box.scrollTop = box.scrollHeight;
  } catch (e) {
    if (inicial) box.innerHTML = `<p class="td-vazio">${escapeHtml(e.message)}</p>`;
  }
}

function configurarEnvio() {
  const input = document.getElementById("fd-input");
  const btn = document.getElementById("fd-enviar");
  const enviar = async () => {
    const texto = input.value.trim();
    if (!texto || !conversaId) return;
    input.value = "";
    try {
      await apiFetch(`/api/conversas/${conversaId}/mensagens`, { method: "POST", body: { texto } });
      buscarMensagens(false);
    } catch (e) { toast(e.message, "erro"); input.value = texto; }
  };
  btn.addEventListener("click", enviar);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); enviar(); } });
}
