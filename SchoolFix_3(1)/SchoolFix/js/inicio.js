/* inicio.js — Dashboard (index.html).
   Usa /api/chamados/estatisticas para os cards e barras e
   /api/chamados?limite=5 para a tabela de recentes. */

const CORES_CATEGORIA = ["--danger", "--info", "--warning", "--success", "--primary", "--navy"];

document.addEventListener("DOMContentLoaded", carregarDashboard);

async function carregarDashboard() {
  try {
    const [stats, recentes] = await Promise.all([
      apiFetch("/api/chamados/estatisticas"),
      apiFetch("/api/chamados?limite=5"),
    ]);
    renderizarKpis(stats);
    renderizarRecentes(recentes);
    renderizarCategorias(stats.por_categoria, stats.total);
  } catch (e) {
    toast(e.message, "erro");
    document.getElementById("tabela-recentes").innerHTML = linhaVazia(4, "Erro ao carregar dados.");
  }
}

function renderizarKpis(s) {
  // Painel do gestor: data de hoje e cartão "aguardando atenção" (só existem nessa página)
  const dataEl = document.getElementById("data-hoje");
  if (dataEl) dataEl.textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  const at = document.getElementById("atencao-titulo");
  if (at) {
    const n = s.por_status.pendente;
    at.textContent = n ? `Você tem ${n} ${n === 1 ? "reclamação aguardando" : "reclamações aguardando"} atenção` : "Nenhuma reclamação pendente — tudo em dia!";
    document.getElementById("atencao-card")?.classList.toggle("atencao-ok", !n);
  }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("kpi-total", s.total);
  set("kpi-pendentes", s.por_status.pendente);
  set("kpi-analise", s.por_status.em_analise);
  set("kpi-resolvidas", s.por_status.resolvido);
}

function renderizarRecentes(lista) {
  const tbody = document.getElementById("tabela-recentes");
  // Rodapé da tabela (só existe nas páginas de aluno/professor)
  const rodape = document.getElementById("rodape-recentes");
  if (rodape) rodape.textContent = !lista.length ? "" : lista.length === 1 ? "Mostrando a reclamação mais recente" : `Mostrando as ${lista.length} mais recentes`;
  if (!lista.length) { tbody.innerHTML = linhaVazia(4, "Nenhuma ocorrência registrada ainda."); return; }
  tbody.innerHTML = lista.map((c) => `
    <tr class="linha-clicavel" onclick="location.href='${paginaReclamacoes()}?id=${c.id}'">
      <td><strong>${escapeHtml(c.titulo)}</strong></td>
      <td>${escapeHtml(c.categoria)}</td>
      <td>${badgeStatus(c.status)}</td>
      <td>${formatarData(c.criado_em)}</td>
    </tr>`).join("");
}

function renderizarCategorias(porCategoria, total) {
  const box = document.getElementById("mapa-categorias");
  if (!box) return;
  const entradas = Object.entries(porCategoria || {});
  if (!entradas.length) { box.innerHTML = '<p class="td-vazio">Sem dados.</p>'; return; }

  box.innerHTML = entradas.map(([cat, qtd], i) => {
    const pct = total ? Math.round((qtd / total) * 100) : 0;
    const cor = `var(${CORES_CATEGORIA[i % CORES_CATEGORIA.length]})`;
    return `
      <div class="bar-row">
        <div class="bar-label-row">
          <span>${escapeHtml(cat)}</span>
          <span class="count">${qtd} ${qtd === 1 ? "ocorrência" : "ocorrências"} (${pct}%)</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${cor}"></div></div>
      </div>`;
  }).join("");
}
