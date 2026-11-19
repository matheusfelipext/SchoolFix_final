/* reclamacoes.js — Lista de chamados + painel de detalhes.

   GET  /api/chamados                 (lista; o Flask já filtra pelo perfil)
   GET  /api/chamados/<id>            (detalhe com respostas e imagem)
   PUT  /api/chamados/<id>/status     (gestão)
   POST /api/chamados/<id>/respostas  (gestão)

   Filtro por status e busca são feitos no navegador sobre a lista carregada
   (a lista é pequena; evita uma requisição a cada tecla). */

let lista = [];
let selecionadoId = null;
let filtroStatus = "";
let filtroTipo = "";
let pagina = 1;            // página atual
const POR_PAGINA = 10;     // itens por página
let chartStatus = null;

const PERFIS_GESTAO = ["gestor", "coordenador", "diretor"];
// A gestão vê a coluna "Autor" (7 colunas); aluno/professor só veem as próprias reclamações (6 colunas)
const comAutor = () => PERFIS_GESTAO.includes(getUsuario()?.perfil);
const colunasTabela = () => (comAutor() ? 7 : 6);

document.addEventListener("DOMContentLoaded", async () => {
  configurarFiltros();
  configurarAcoesDetalhe();
  document.addEventListener("temaAlterado", desenharGrafico);
  await carregarLista();

  // Veio de uma notificação / dashboard com ?id=... → abre direto
  const id = new URLSearchParams(location.search).get("id");
  if (id) {
    const postagem = lista.find((item) => item.id === id);
    if (postagem && filtroTipo) selecionarTipo(tipoPostagem(postagem));
    abrirDetalhes(id);
  }
});

const tipoPostagem = (item) => item.tipo ?? "reclamacao";
const rotuloTipo = (item) => tipoPostagem(item) === "sugestao" ? "Sugestão" : "Reclamação";

function selecionarTipo(tipo) {
  filtroTipo = tipo;
  pagina = 1;
  document.querySelectorAll("#filtros-tipo button").forEach((botao) => {
    const ativo = botao.dataset.tipo === tipo;
    botao.classList.toggle("active", ativo);
    botao.setAttribute("aria-pressed", String(ativo));
  });
}

// ---------------------------------------------------------------------------
async function carregarLista() {
  const tbody = document.getElementById("tabela-reclamacoes");
  try {
    lista = await apiFetch("/api/chamados");
    renderizarTabela();
    desenharGrafico();
  } catch (e) {
    tbody.innerHTML = linhaVazia(colunasTabela(), e.message);
  }
}

function renderizarTabela() {
  const tbody = document.getElementById("tabela-reclamacoes");
  const contagem = document.getElementById("contagem-reclamacoes");
  const termo = (document.getElementById("busca-reclamacoes").value || "").toLowerCase();

  const filtradas = lista.filter((c) => {
    const okStatus = !filtroStatus || c.status === filtroStatus;
    const texto = `${c.titulo} ${c.autor_nome || ""} ${c.protocolo} ${c.categoria}`.toLowerCase();
    return okStatus && (!filtroTipo || tipoPostagem(c) === filtroTipo) && texto.includes(termo);
  });

  // paginação: recorta só a fatia da página atual
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  if (pagina > totalPaginas) pagina = totalPaginas;      // o filtro encolheu a lista? volta para a última válida
  const inicio = (pagina - 1) * POR_PAGINA;              // página 1 → 0, página 2 → 10, ...
  const visiveis = filtradas.slice(inicio, inicio + POR_PAGINA);
  renderizarPaginacao(totalPaginas);

  const unidade = filtroTipo ? "postagens" : "ocorrências";
  const vazio = filtroTipo ? "Nenhuma postagem encontrada." : "Nenhuma ocorrência encontrada.";
  contagem.textContent = filtradas.length
    ? `Exibindo ${inicio + 1}-${inicio + visiveis.length} de ${filtradas.length} ${unidade}`
    : "";
  if (!visiveis.length) { tbody.innerHTML = linhaVazia(colunasTabela(), vazio); return; }

  tbody.innerHTML = visiveis.map((c) => `
    <tr class="${c.id === selecionadoId ? "linha-selecionada" : ""}">
      <td><strong>${escapeHtml(c.titulo)}</strong><br><small class="text-muted">#${c.protocolo}${comAutor() ? ` · ${rotuloTipo(c)}` : ""}</small></td>
      <td>${escapeHtml(c.categoria)}</td>
      <td>${badgePrioridade(c.prioridade)}</td>
      ${comAutor() ? `<td>${escapeHtml(c.autor_nome || "—")}</td>` : ""}
      <td>${badgeStatus(c.status)}</td>
      <td>${formatarData(c.criado_em)}</td>
      <td style="text-align:center">
        <button type="button" class="btn-tbl btn-tbl-edit" onclick="abrirDetalhes('${c.id}')" title="Ver detalhes">
          <i class="ti ti-eye"></i> Ver
        </button>
      </td>
    </tr>`).join("");
}

/* Desenha os botões ‹ 1 2 3 › no rodapé da tabela e liga o clique */
function renderizarPaginacao(totalPaginas) {
  const nav = document.getElementById("paginacao-reclamacoes");
  if (!nav) return;
  if (totalPaginas <= 1) { nav.innerHTML = ""; return; }   // uma página só: não mostra nada
  const botao = (p, rotulo, ativo = false, desabilitado = false) =>
    `<button type="button" class="pagina ${ativo ? "ativo" : ""}" data-pagina="${p}" ${desabilitado ? "disabled" : ""} ${ativo ? 'aria-current="page"' : ""}>${rotulo}</button>`;
  let html = botao(pagina - 1, "‹", false, pagina === 1);
  for (let p = 1; p <= totalPaginas; p++) html += botao(p, p, p === pagina);
  html += botao(pagina + 1, "›", false, pagina === totalPaginas);
  nav.innerHTML = html;
  nav.querySelectorAll("button:not([disabled])").forEach((b) =>
    b.addEventListener("click", () => { pagina = Number(b.dataset.pagina); renderizarTabela(); }));
}

function configurarFiltros() {
  if (document.getElementById("filtros-tipo")) selecionarTipo("reclamacao");
  document.querySelectorAll("#filtros-tipo button").forEach((botao) => {
    botao.addEventListener("click", () => {
      selecionarTipo(botao.dataset.tipo);
      selecionadoId = null;
      document.getElementById("painel-detalhes").style.display = "none";
      document.getElementById("painel-vazio").style.display = "flex";
      renderizarTabela();
    });
  });
  document.getElementById("busca-reclamacoes").addEventListener("input", () => { pagina = 1; renderizarTabela(); });
  document.querySelectorAll("#filtros-status .filter-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#filtros-status .filter-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filtroStatus = btn.dataset.status || "";
      pagina = 1;              // mudou o filtro: volta para a primeira página
      renderizarTabela();
    });
  });
}

// ---------------------------------------------------------------------------
async function abrirDetalhes(id) {
  selecionadoId = id;
  renderizarTabela();

  const painel = document.getElementById("painel-detalhes");
  const vazio = document.getElementById("painel-vazio");
  painel.style.display = "block";
  vazio.style.display = "none";

  try {
    const c = await apiFetch(`/api/chamados/${id}`);
    if (selecionadoId !== id) return;
    const set = (elId, txt) => { const el = document.getElementById(elId); if (el) el.textContent = txt; };
    const podeGerir = PERFIS_GESTAO.includes(getUsuario()?.perfil);

    set("detalhe-protocolo", `${rotuloTipo(c)} · #${c.protocolo}`);
    set("detalhe-titulo", c.titulo);
    set("detalhe-meta", podeGerir
      ? `Por ${c.autor_nome || "—"} • ${c.categoria} • Área: ${c.area || "—"} • ${formatarData(c.criado_em, true)}`
      : `Categoria: ${c.categoria} • Setor responsável: ${c.area || "—"} • ${formatarData(c.criado_em, true)}`);
    set("detalhe-descricao", c.descricao);
    document.getElementById("detalhe-badge-prioridade").innerHTML = badgePrioridade(c.prioridade);
    const selStatus = document.getElementById("detalhe-status");
    if (selStatus) selStatus.value = c.status;
    const badgeAtual = document.getElementById("detalhe-badge-status");   // "Status atual" (aluno/professor)
    if (badgeAtual) badgeAtual.innerHTML = badgeStatus(c.status);

    const img = document.getElementById("detalhe-imagem");
    if (img) { img.style.display = c.imagem ? "block" : "none"; if (c.imagem) img.src = c.imagem; }

    renderizarRespostas(c.respostas);
    if (painel.hasAttribute("tabindex") && matchMedia("(max-width: 1024px)").matches) painel.focus();

    // Quem não é da gestão só lê
    // aluno/professor só leem: esconde status e resposta oficial
    ["detalhe-status", "btn-atualizar-status", "texto-resposta", "btn-enviar-resposta"].forEach((id) => {
      const el = document.getElementById(id); if (!el) return;
      el.style.display = podeGerir ? "" : "none";
      const rotulo = el.previousElementSibling; if (rotulo?.classList.contains("section-label")) rotulo.style.display = podeGerir ? "" : "none";
    });
  } catch (e) {
    toast(e.message, "erro");
  }
}

function renderizarRespostas(respostas) {
  const box = document.getElementById("lista-respostas");
  if (!respostas?.length) {
    box.innerHTML = '<p class="td-vazio" style="padding:8px 0">Nenhum feedback enviado ainda.</p>';
    return;
  }
  box.innerHTML = respostas.map((r) => `
    <div class="resposta-item">
      <div class="resposta-meta">
        <strong>${escapeHtml(r.autor_nome)} <span class="text-muted">(${rotuloPerfil(r.autor_perfil)})</span></strong>
        <span>${formatarData(r.criado_em, true)}</span>
      </div>
      <p>${escapeHtml(r.texto)}</p>
    </div>`).join("");
}

function configurarAcoesDetalhe() {
  document.getElementById("btn-atualizar-status")?.addEventListener("click", async () => {
    if (!selecionadoId) return;
    const status = document.getElementById("detalhe-status").value;
    try {
      const atualizado = await apiFetch(`/api/chamados/${selecionadoId}/status`, { method: "PUT", body: { status } });
      const idx = lista.findIndex((c) => c.id === atualizado.id);
      if (idx >= 0) lista[idx] = atualizado;
      renderizarTabela();
      desenharGrafico();
      toast("Status atualizado!", "sucesso");
    } catch (e) { toast(e.message, "erro"); }
  });

  document.getElementById("btn-enviar-resposta")?.addEventListener("click", async () => {
    if (!selecionadoId) return;
    const ta = document.getElementById("texto-resposta");
    const texto = ta.value.trim();
    if (!texto) return toast("Escreva a resposta antes de enviar.", "erro");
    try {
      await apiFetch(`/api/chamados/${selecionadoId}/respostas`, { method: "POST", body: { texto } });
      ta.value = "";
      toast("Resposta enviada!", "sucesso");
      abrirDetalhes(selecionadoId);   // recarrega o histórico
    } catch (e) { toast(e.message, "erro"); }
  });
}

// ---------------------------------------------------------------------------
function desenharGrafico() {
  const canvas = document.getElementById("graficoStatus");
  if (!canvas || typeof Chart === "undefined") return;
  const cont = (s) => lista.filter((c) => c.status === s).length;
  const css = getComputedStyle(document.documentElement);
  const cor = (v) => css.getPropertyValue(v).trim();

  if (chartStatus) chartStatus.destroy();
  chartStatus = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Pendente", "Em Análise", "Resolvido"],
      datasets: [{
        data: [cont("pendente"), cont("em_analise"), cont("resolvido")],
        backgroundColor: [cor("--danger"), cor("--warning"), cor("--success")],
        borderColor: cor("--bg-card"),
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: { legend: { position: "bottom", labels: { color: cor("--text-secondary"), font: { family: "Inter" } } } },
    },
  });
}

window.abrirDetalhes = abrirDetalhes;
