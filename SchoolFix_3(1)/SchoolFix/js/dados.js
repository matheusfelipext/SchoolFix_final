/* ============================================================================
   dados.js — BANCO LOCAL (localStorage). Substitui a API: tudo é salvo no navegador.

   Quando o site é aberto direto do arquivo (file://) ou com ?demo=1, este
   arquivo assume o papel da API Flask: responde às mesmas rotas (/api/...)
   com dados de exemplo guardados no localStorage do navegador.

   Serve para apresentar o sistema em qualquer computador, mesmo sem internet
   e sem o back-end rodando. Com o site publicado (https://...), este arquivo
   não faz nada e o api.js fala com o Flask normalmente.

   Para zerar os dados da demonstração: botão "Reiniciar demonstração" no login
   ou, no console, localStorage.removeItem("schoolfix_demo_db").
   ========================================================================== */
(function () {


  const CHAVE = "schoolfix_demo_db";
  const agora = () => new Date().toISOString();
  const diasAtras = (d, h = 9) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
  const id = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
  const copia = (o) => JSON.parse(JSON.stringify(o));

  const PREFS = { notificacoes: { chamados_urgentes: true, status_chamados: true, respostas: true, mensagens_diretas: true },
                  idioma: "pt-BR", fuso_horario: "America/Sao_Paulo", formato_exportacao: "csv", tema: "claro" };

  // ---------------------------------------------------------------------------
  // Dados iniciais (mesmas contas do seed.py + exemplos do Portal do Aluno)
  // ---------------------------------------------------------------------------
  function dadosIniciais() {
    // matrícula: RA (aluno) ou registro funcional (demais) — pode ser usada no login no lugar do e-mail
    const u = (idU, nome, email, perfil, area_id = null, area_nome = null, matricula = null) =>
      ({ id: idU, nome, email, matricula, senha: "123456", perfil, area_id, area_nome, ativo: true, preferencias: copia(PREFS), criado_em: diasAtras(60) });
    const areas = [
      { id: "a-infra", nome: "Infraestrutura", gestor_id: "u-ginfra", gestor_nome: "Carlos Lima" },
      { id: "a-limp", nome: "Limpeza", gestor_id: "u-glimp", gestor_nome: "Ana Paula Ribeiro" },
      { id: "a-alim", nome: "Alimentação", gestor_id: null, gestor_nome: null },
      { id: "a-coord", nome: "Coordenação", gestor_id: null, gestor_nome: null },
      { id: "a-seg", nome: "Segurança", gestor_id: null, gestor_nome: null },
      { id: "a-ti", nome: "TI", gestor_id: "u-gti", gestor_nome: "Roberto Nunes" },
      { id: "a-geral", nome: "Geral", gestor_id: null, gestor_nome: null },
    ];
    const usuarios = [
      u("u-dir", "Matheus Felipe", "diretor@schoolfix.com", "diretor", null, null, "10001"),
      u("u-coord", "Marcos Souza", "coordenador@schoolfix.com", "coordenador"),
      u("u-ginfra", "Carlos Lima", "gestor.infra@schoolfix.com", "gestor", "a-infra", "Infraestrutura"),
      u("u-glimp", "Ana Paula Ribeiro", "gestor.limpeza@schoolfix.com", "gestor", "a-limp", "Limpeza"),
      u("u-gti", "Roberto Nunes", "gestor.ti@schoolfix.com", "gestor", "a-ti", "TI"),
      u("u-prof", "Alberto Silva", "professor@schoolfix.com", "professor", null, null, "10045"),
      u("u-aluno", "Lucas Andrade", "aluno@schoolfix.com", "aluno", null, null, "20200123"),
      u("u-aluna", "Mariana Costa", "mariana@schoolfix.com", "aluno", null, null, "20200124"),
    ];
    const c = (idC, titulo, descricao, categoria, area, status, prioridade, autor, dias, extra = {}) => {
      const ar = areas.find((a) => a.id === area), au = usuarios.find((x) => x.id === autor);
      return { id: idC, titulo, descricao, categoria, area_id: ar.id, area_nome: ar.nome, status, prioridade,
               anonimo: !!extra.anonimo, autor_id: au.id, autor_nome: au.nome, autor_perfil: au.perfil, imagem: null,
               canal_prioridade_pedagogica: !!extra.pedagogico, respostas: extra.respostas || [],
               criado_em: diasAtras(dias), atualizado_em: diasAtras(Math.max(dias - 1, 0)) };
    };
    const r = (autor, texto, dias) => { const au = usuarios.find((x) => x.id === autor);
      return { id: id(), autor_id: au.id, autor_nome: au.nome, autor_perfil: au.perfil, texto, criado_em: diasAtras(dias) }; };
    const chamados = [
      c("c-1", "Infiltração no teto do Laboratório de Química", "Durante as chuvas de ontem formou-se uma goteira acima da bancada principal.", "Infraestrutura", "a-infra", "pendente", "urgente", "u-prof", 1),
      c("c-2", "Projetor da Sala 12 com defeito", "O projetor fica desligando sozinho após 10 minutos de uso. A lâmpada pisca em vermelho.", "TI", "a-ti", "em_analise", "alta", "u-aluno", 2,
        { respostas: [r("u-gti", "Solicitação recebida. A equipe de TI irá inspecionar o equipamento no final do turno.", 1)] }),
      c("c-3", "Vazamento no banheiro masculino", "Torneira da terceira pia não fecha e o chão fica alagado.", "Infraestrutura", "a-infra", "pendente", "alta", "u-aluno", 4),
      c("c-4", "Ar-condicionado sujo na Sala 04", "O filtro do ar-condicionado está com mofo e cheiro forte há duas semanas.", "Limpeza", "a-limp", "resolvido", "media", "u-aluno", 7,
        { respostas: [r("u-glimp", "Filtro higienizado e substituído. Chamado encerrado.", 5)] }),
      c("c-5", "Conflito recorrente no intervalo", "Alunos do 2º ano relatam provocações constantes no pátio durante o intervalo.", "Convivência", "a-coord", "pendente", "alta", "u-aluna", 3, { anonimo: true }),
      c("c-6", "Cardápio repetido na cantina", "O mesmo lanche foi servido cinco dias seguidos; pedimos mais variedade.", "Alimentação", "a-alim", "pendente", "baixa", "u-aluna", 5),
      c("c-7", "Material didático desatualizado", "A apostila de História ainda usa a edição de 2015; solicitamos atualização.", "Pedagógico", "a-coord", "em_analise", "media", "u-prof", 6, { pedagogico: true }),
      c("c-8", "Lâmpada queimada na biblioteca", "Duas lâmpadas da ala de leitura estão queimadas.", "Infraestrutura", "a-infra", "resolvido", "baixa", "u-aluno", 12,
        { respostas: [r("u-ginfra", "Lâmpadas trocadas pela manutenção.", 10)] }),
    ];
    const canais = [
      { id: "k-geral", nome: "geral", descricao: "Avisos e discussões gerais", privado: false, perfis_permitidos: [] },
      { id: "k-infra", nome: "infraestrutura", descricao: "Manutenção e instalações", privado: false, perfis_permitidos: [] },
      { id: "k-ped", nome: "pedagogico", descricao: "Assuntos acadêmicos", privado: false, perfis_permitidos: [] },
      { id: "k-gestao", nome: "gestao", descricao: "Exclusivo da administração", privado: true, perfis_permitidos: ["diretor", "coordenador", "gestor"] },
    ];
    const m = (canal_id, autor, texto, dias, h) => { const au = usuarios.find((x) => x.id === autor);
      return { id: id(), canal_id, autor_id: au.id, autor_nome: au.nome, autor_perfil: au.perfil, texto, criado_em: diasAtras(dias, h) }; };
    const mensagens_canal = [
      m("k-geral", "u-dir", "Bem-vindos ao chat do SchoolFix! Use este canal para avisos gerais.", 3, 8),
      m("k-geral", "u-aluna", "Alguém sabe se o laboratório de informática estará aberto à tarde?", 0, 10),
      m("k-geral", "u-prof", "Olá Mariana, sim! O laboratório estará aberto até às 17h para estudos livres.", 0, 10),
      m("k-geral", "u-aluno", "Excelente, obrigado pelas informações!", 0, 10),
      m("k-gestao", "u-dir", "Reunião de gestão sexta às 14h para revisar os chamados urgentes.", 1, 9),
    ];
    const conversas = [
      { id: "v-1", participantes: ["u-aluno", "u-dir"], nomes: { "u-aluno": "Lucas Andrade", "u-dir": "Matheus Felipe" }, perfis: { "u-aluno": "aluno", "u-dir": "diretor" },
        ultima_mensagem: "Olá Lucas. Como podemos ajudar? Suas mensagens neste canal são tratadas com total sigilo.", ultima_mensagem_em: diasAtras(1, 14) },
      { id: "v-2", participantes: ["u-dir", "u-ginfra"], nomes: { "u-dir": "Matheus Felipe", "u-ginfra": "Carlos Lima" }, perfis: { "u-dir": "diretor", "u-ginfra": "gestor" },
        ultima_mensagem: "Diretor, o técnico já terminou a vistoria do teto do laboratório.", ultima_mensagem_em: diasAtras(0, 8) },
    ];
    const mensagens_diretas = [
      { id: id(), conversa_id: "v-1", autor_id: "u-dir", autor_nome: "Matheus Felipe", texto: conversas[0].ultima_mensagem, lida: true, criado_em: diasAtras(1, 14) },
      { id: id(), conversa_id: "v-2", autor_id: "u-ginfra", autor_nome: "Carlos Lima", texto: conversas[1].ultima_mensagem, lida: false, criado_em: diasAtras(0, 8) },
    ];
    const notificacoes = [
      { id: id(), usuario_id: "u-dir", tipo: "novo_chamado", chamado_id: "c-1", titulo: "URGENTE em Infraestrutura: Infiltração no teto do Laboratório de Química", lida: false, criado_em: diasAtras(1) },
      { id: id(), usuario_id: "u-dir", tipo: "nova_mensagem", chamado_id: null, titulo: "Nova mensagem de Carlos Lima", lida: false, criado_em: diasAtras(0, 8) },
      { id: id(), usuario_id: "u-ginfra", tipo: "novo_chamado", chamado_id: "c-1", titulo: "Novo chamado (urgente) em Infraestrutura: Infiltração no teto do Laboratório de Química", lida: false, criado_em: diasAtras(1) },
      { id: id(), usuario_id: "u-aluno", tipo: "nova_resposta", chamado_id: "c-2", titulo: 'Seu chamado "Projetor da Sala 12 com defeito" recebeu uma resposta oficial.', lida: false, criado_em: diasAtras(1) },
      { id: id(), usuario_id: "u-aluno", tipo: "status_atualizado", chamado_id: "c-2", titulo: 'Seu chamado "Projetor da Sala 12 com defeito" mudou para: Em análise', lida: true, criado_em: diasAtras(1) },
    ];
    const configuracoes = { nome_escola: "Centro Universitário Salesiano de São Paulo", endereco: "Rua Baronesa Geraldo de Resende, 330 — Campinas/SP",
                            telefone: "(19) 3744-6000", email_contato: "contato@schoolfix.com" };
    return { usuarios, areas, chamados, canais, mensagens_canal, conversas, mensagens_diretas, notificacoes, configuracoes };
  }

  let db;
  function carregar() {
    try { db = JSON.parse(localStorage.getItem(CHAVE)); } catch { db = null; }
    if (!db || !db.usuarios) { db = dadosIniciais(); salvar(); }
  }
  function salvar() { localStorage.setItem(CHAVE, JSON.stringify(db)); }
  function reiniciar() { localStorage.removeItem(CHAVE); carregar(); }

  // ---------------------------------------------------------------------------
  // Utilitários de "resposta"
  // ---------------------------------------------------------------------------
  class ErroApi extends Error { constructor(msg, status) { super(msg); this.status = status; } }
  const erro = (msg, status = 400) => { throw new ErroApi(msg, status); };
  const PERFIS_GESTAO = ["gestor", "coordenador", "diretor"];
  const ROTULO_STATUS = { pendente: "Pendente", em_analise: "Em análise", resolvido: "Resolvido" };

  const usuarioParaApi = (u) => { const { senha, ...resto } = u; return resto; };
  const chamadoParaApi = (c, completo = false) => {
    const d = { ...c, tipo: c.tipo ?? "reclamacao", protocolo: c.id.slice(-8).toUpperCase().padStart(8, "0"), area: c.area_nome, tem_imagem: !!c.imagem,
                total_respostas: (c.respostas || []).length };
    if (c.anonimo) { d.autor_id = null; d.autor_nome = "Anônimo"; d.autor_perfil = null; }
    if (!completo) { delete d.imagem; delete d.respostas; }
    return d;
  };
  const pref = (u, chave) => (u.preferencias?.notificacoes?.[chave] !== false);
  function notificar(usuario_id, tipo, titulo, chamado_id = null) {
    const u = db.usuarios.find((x) => x.id === usuario_id);
    if (!u) return;
    const chave = { nova_mensagem: "mensagens_diretas", status_atualizado: "status_chamados", nova_resposta: "respostas", novo_chamado_urgente: "chamados_urgentes" }[tipo];
    if (chave && !pref(u, chave)) return;
    db.notificacoes.push({ id: id(), usuario_id, tipo: tipo === "novo_chamado_urgente" ? "novo_chamado" : tipo, chamado_id, titulo, lida: false, criado_em: agora() });
  }
  const podeGerenciar = (c, u) => u.perfil === "diretor" || u.perfil === "coordenador" || (u.perfil === "gestor" && c.area_id === u.area_id);
  const visiveis = (u) => db.chamados.filter((c) => PERFIS_GESTAO.includes(u.perfil) ? podeGerenciar(c, u) || u.perfil !== "gestor" : c.autor_id === u.id)
                              .filter((c) => u.perfil !== "gestor" || c.area_id === u.area_id)
                              .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));

  // ---------------------------------------------------------------------------
  // Roteador: (método, caminho) → resposta
  // ---------------------------------------------------------------------------
  function tratar(metodo, caminho, body, token) {
    const [rota, qs] = caminho.split("?");
    const q = Object.fromEntries(new URLSearchParams(qs || ""));
    const partes = rota.replace(/^\/api\//, "").split("/");
    const atual = token ? db.usuarios.find((u) => "demo-" + u.id === token) : null;
    const exigirLogin = () => { if (!atual) erro("Token de acesso ausente. Faça login.", 401); return atual; };
    const exigirDiretor = () => { exigirLogin(); if (atual.perfil !== "diretor") erro("Você não tem permissão para acessar este recurso.", 403); return atual; };

    // --- auth ---
    if (partes[0] === "auth") {
      if (partes[1] === "login" && metodo === "POST") {
        // aceita e-mail OU matrícula (RA) no mesmo campo
        const chave = (body.email || "").trim().toLowerCase();
        const u = db.usuarios.find((x) => x.email === chave || (x.matricula && x.matricula === chave));
        if (!u || u.senha !== body.senha) erro("E-mail ou senha inválidos.", 401);
        if (!u.ativo) erro("Este usuário está inativo. Fale com a diretoria.", 403);
        return { access_token: "demo-" + u.id, usuario: usuarioParaApi(u) };
      }
      const u = exigirLogin();
      if (partes[1] === "me" && !partes[2]) {
        if (metodo === "PUT") { if ((body.nome || "").trim().length < 2) erro("Informe um nome válido."); u.nome = body.nome.trim(); salvar(); }
        return usuarioParaApi(u);
      }
      if (partes[2] === "senha") {
        if (body.senha_atual !== u.senha) erro("Senha atual incorreta.");
        if ((body.nova_senha || "").length < 6) erro("A nova senha deve ter pelo menos 6 caracteres.");
        u.senha = body.nova_senha; salvar(); return { mensagem: "Senha alterada com sucesso." };
      }
      if (partes[2] === "preferencias") {
        if (metodo === "PUT") {
          if (body.notificacoes) Object.assign(u.preferencias.notificacoes, body.notificacoes);
          for (const k of ["idioma", "fuso_horario", "formato_exportacao", "tema"]) if (k in body) u.preferencias[k] = body[k];
          salvar();
        }
        return u.preferencias;
      }
    }

    // --- chamados ---
    if (partes[0] === "chamados") {
      const u = exigirLogin();
      if (!partes[1]) {
        if (metodo === "POST") {
          const titulo = (body.titulo || "").trim(), descricao = (body.descricao || "").trim();
          if (titulo.length < 3) erro("Informe um título com pelo menos 3 caracteres.");
          if (descricao.length < 10) erro("Informe uma descrição com pelo menos 10 caracteres.");
          const tipo = body.tipo ?? "reclamacao";
          if (!["reclamacao", "sugestao"].includes(tipo)) erro("Selecione um tipo de postagem válido.");
          const prio = (body.prioridade || "media").toLowerCase().replace("média", "media");
          const mapa = { Infraestrutura: "Infraestrutura", Limpeza: "Limpeza", Convivência: "Coordenação", Pedagógico: "Coordenação", Alimentação: "Alimentação", Segurança: "Segurança", TI: "TI", Outros: "Geral" };
          const area = db.areas.find((a) => a.nome === (mapa[body.categoria] || body.categoria)) || db.areas.find((a) => a.nome === "Geral");
          const c = { id: "c-" + id().slice(0, 10), titulo, descricao, tipo, categoria: body.categoria || "Outros", area_id: area.id, area_nome: area.nome,
                      status: "pendente", prioridade: prio, anonimo: !!body.anonimo, autor_id: u.id, autor_nome: u.nome, autor_perfil: u.perfil,
                      imagem: body.imagem || null, canal_prioridade_pedagogica: !!body.canal_prioridade_pedagogica && u.perfil === "professor",
                      respostas: [], criado_em: agora(), atualizado_em: agora() };
          db.chamados.push(c);
          if (area.gestor_id) notificar(area.gestor_id, "novo_chamado", `Novo chamado (${prio}) em ${area.nome}: ${titulo}`, c.id);
          if (prio === "urgente") db.usuarios.filter((x) => ["diretor", "coordenador"].includes(x.perfil) && x.id !== area.gestor_id)
            .forEach((x) => notificar(x.id, "novo_chamado_urgente", `URGENTE em ${area.nome}: ${titulo}`, c.id));
          salvar(); return chamadoParaApi(c);
        }
        let lista = visiveis(u);
        if (q.status) lista = lista.filter((c) => c.status === q.status);
        if (q.categoria) lista = lista.filter((c) => c.categoria === q.categoria);
        if (q.busca) { const b = q.busca.toLowerCase(); lista = lista.filter((c) => c.titulo.toLowerCase().includes(b) || c.descricao.toLowerCase().includes(b)); }
        if (q.limite) lista = lista.slice(0, Number(q.limite));
        return lista.map((c) => chamadoParaApi(c));
      }
      if (partes[1] === "estatisticas") {
        const lista = visiveis(u), cont = (f) => lista.filter(f).length, cats = {};
        lista.forEach((c) => (cats[c.categoria] = (cats[c.categoria] || 0) + 1));
        const ordenadas = Object.fromEntries(Object.entries(cats).sort((a, b) => b[1] - a[1]));
        return { total: lista.length,
                 por_status: { pendente: cont((c) => c.status === "pendente"), em_analise: cont((c) => c.status === "em_analise"), resolvido: cont((c) => c.status === "resolvido") },
                 por_prioridade: { baixa: cont((c) => c.prioridade === "baixa"), media: cont((c) => c.prioridade === "media"), alta: cont((c) => c.prioridade === "alta"), urgente: cont((c) => c.prioridade === "urgente") },
                 por_categoria: ordenadas, taxa_resolucao: lista.length ? Math.round(cont((c) => c.status === "resolvido") / lista.length * 1000) / 10 : 0,
                 urgentes_abertos: cont((c) => c.prioridade === "urgente" && c.status !== "resolvido"),
                 categoria_mais_frequente: Object.keys(ordenadas)[0] || null };
      }
      const c = db.chamados.find((x) => x.id === partes[1]);
      if (!c) erro("Chamado não encontrado.", 404);
      if (!partes[2]) {
        if (metodo === "DELETE") { exigirDiretor(); db.chamados = db.chamados.filter((x) => x.id !== c.id); salvar(); return null; }
        if (!(podeGerenciar(c, u) || c.autor_id === u.id)) erro("Você não tem acesso a este chamado.", 403);
        return chamadoParaApi(c, true);
      }
      if (partes[2] === "status") {
        if (!PERFIS_GESTAO.includes(u.perfil)) erro("Sem permissão para atualizar status.", 403);
        if (!podeGerenciar(c, u)) erro("Você só pode atualizar chamados da sua área.", 403);
        const s = (body.status || "").toLowerCase().replace(/em an[aá]lise/, "em_analise");
        if (!ROTULO_STATUS[s]) erro("status inválido.");
        if (s !== c.status) { c.status = s; c.atualizado_em = agora(); notificar(c.autor_id, "status_atualizado", `Seu chamado "${c.titulo}" mudou para: ${ROTULO_STATUS[s]}`, c.id); salvar(); }
        return chamadoParaApi(c);
      }
      if (partes[2] === "respostas") {
        if (!PERFIS_GESTAO.includes(u.perfil) || !podeGerenciar(c, u)) erro("Apenas a gestão responsável pode responder este chamado.", 403);
        if (!(body.texto || "").trim()) erro("texto é obrigatório.");
        const r = { id: id(), autor_id: u.id, autor_nome: u.nome, autor_perfil: u.perfil, texto: body.texto.trim(), criado_em: agora() };
        c.respostas.push(r); c.atualizado_em = agora();
        notificar(c.autor_id, "nova_resposta", `Seu chamado "${c.titulo}" recebeu uma resposta oficial.`, c.id); salvar(); return r;
      }
    }

    // --- canais ---
    if (partes[0] === "canais") {
      const u = exigirLogin();
      const permite = (k) => !k.privado || k.perfis_permitidos.includes(u.perfil);
      if (!partes[1]) return db.canais.filter(permite);
      const k = db.canais.find((x) => x.id === partes[1]);
      if (!k) erro("Canal não encontrado.", 404);
      if (!permite(k)) erro("Você não tem acesso a este canal.", 403);
      if (metodo === "POST") {
        if (!(body.texto || "").trim()) erro("texto é obrigatório.");
        const msg = { id: id(), canal_id: k.id, autor_id: u.id, autor_nome: u.nome, autor_perfil: u.perfil, texto: body.texto.trim(), criado_em: agora() };
        db.mensagens_canal.push(msg); salvar(); return msg;
      }
      return db.mensagens_canal.filter((x) => x.canal_id === k.id && (!q.depois || x.criado_em > q.depois)).sort((a, b) => (a.criado_em > b.criado_em ? 1 : -1));
    }

    // --- conversas ---
    if (partes[0] === "conversas") {
      const u = exigirLogin();
      const paraApi = (v) => { const outro = v.participantes.find((p) => p !== u.id);
        return { id: v.id, participantes: v.participantes, outro_id: outro, outro_nome: v.nomes[outro], outro_perfil: v.perfis[outro],
                 ultima_mensagem: v.ultima_mensagem, ultima_mensagem_em: v.ultima_mensagem_em,
                 nao_lidas: db.mensagens_diretas.filter((m) => m.conversa_id === v.id && m.autor_id !== u.id && !m.lida).length }; };
      if (!partes[1]) {
        if (metodo === "POST") {
          const d = db.usuarios.find((x) => x.id === body.destinatario_id);
          if (!d || d.id === u.id) erro("Informe um destinatário válido (diferente de você).");
          let v = db.conversas.find((x) => x.participantes.includes(u.id) && x.participantes.includes(d.id));
          if (!v) { v = { id: "v-" + id().slice(0, 8), participantes: [u.id, d.id], nomes: { [u.id]: u.nome, [d.id]: d.nome }, perfis: { [u.id]: u.perfil, [d.id]: d.perfil }, ultima_mensagem: null, ultima_mensagem_em: null }; db.conversas.push(v); salvar(); }
          return paraApi(v);
        }
        return db.conversas.filter((v) => v.participantes.includes(u.id)).sort((a, b) => ((a.ultima_mensagem_em || "") < (b.ultima_mensagem_em || "") ? 1 : -1)).map(paraApi);
      }
      const v = db.conversas.find((x) => x.id === partes[1]);
      if (!v) erro("Conversa não encontrada.", 404);
      if (!v.participantes.includes(u.id)) erro("Você não participa desta conversa.", 403);
      if (metodo === "POST") {
        if (!(body.texto || "").trim()) erro("texto é obrigatório.");
        const msg = { id: id(), conversa_id: v.id, autor_id: u.id, autor_nome: u.nome, texto: body.texto.trim(), lida: false, criado_em: agora() };
        db.mensagens_diretas.push(msg); v.ultima_mensagem = msg.texto; v.ultima_mensagem_em = msg.criado_em;
        notificar(v.participantes.find((p) => p !== u.id), "nova_mensagem", `Nova mensagem de ${u.nome}`); salvar(); return msg;
      }
      const msgs = db.mensagens_diretas.filter((m) => m.conversa_id === v.id && (!q.depois || m.criado_em > q.depois)).sort((a, b) => (a.criado_em > b.criado_em ? 1 : -1));
      msgs.forEach((m) => { if (m.autor_id !== u.id) m.lida = true; }); salvar();
      return msgs;
    }

    // --- usuários ---
    if (partes[0] === "usuarios") {
      if (partes[1] === "contatos") { const u = exigirLogin(); return db.usuarios.filter((x) => x.ativo && x.id !== u.id).map((x) => ({ id: x.id, nome: x.nome, perfil: x.perfil })); }
      const dir = exigirDiretor();
      if (!partes[1]) {
        if (metodo === "POST") {
          if (!body.nome || !body.email) erro("nome e email são obrigatórios.");
          if ((body.senha || "").length < 6) erro("Informe uma senha com pelo menos 6 caracteres.");
          if (db.usuarios.some((x) => x.email === body.email.toLowerCase())) erro("Já existe um usuário com esse e-mail.", 409);
          const area = body.perfil === "gestor" ? db.areas.find((a) => a.id === body.area_id) : null;
          if (body.perfil === "gestor" && !area) erro("Gestor precisa de uma area_id.");
          if (body.matricula && db.usuarios.some((x) => x.matricula === String(body.matricula))) erro("Já existe um usuário com essa matrícula.", 409);
          const n = { id: "u-" + id().slice(0, 8), nome: body.nome.trim(), email: body.email.toLowerCase(), matricula: body.matricula ? String(body.matricula) : null, senha: body.senha, perfil: body.perfil,
                      area_id: area?.id || null, area_nome: area?.nome || null, ativo: body.ativo !== false, preferencias: copia(PREFS), criado_em: agora() };
          db.usuarios.push(n); salvar(); return usuarioParaApi(n);
        }
        return db.usuarios.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(usuarioParaApi);
      }
      const x = db.usuarios.find((y) => y.id === partes[1]);
      if (!x) erro("Usuário não encontrado.", 404);
      if (metodo === "DELETE") { if (x.id === dir.id) erro("Você não pode remover a própria conta."); x.ativo = false; salvar(); return null; }
      if ("nome" in body) x.nome = body.nome.trim();
      if ("email" in body) x.email = body.email.toLowerCase();
      if ("matricula" in body) x.matricula = body.matricula ? String(body.matricula) : null;
      if ("perfil" in body) x.perfil = body.perfil;
      if ("ativo" in body) { if (x.id === dir.id && !body.ativo) erro("Você não pode desativar a própria conta."); x.ativo = !!body.ativo; }
      if (x.perfil === "gestor") { const a = db.areas.find((a) => a.id === (body.area_id ?? x.area_id)); if (!a) erro("Gestor precisa de uma area_id."); x.area_id = a.id; x.area_nome = a.nome; }
      else { x.area_id = null; x.area_nome = null; }
      if (body.senha) x.senha = body.senha;
      salvar(); return usuarioParaApi(x);
    }

    if (partes[0] === "areas") { exigirLogin(); return db.areas; }

    // --- notificações ---
    if (partes[0] === "notificacoes") {
      const u = exigirLogin();
      const minhas = db.notificacoes.filter((n) => n.usuario_id === u.id);
      if (!partes[1]) return minhas.sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1)).slice(0, 50);
      if (partes[1] === "nao-lidas") return { total: minhas.filter((n) => !n.lida).length };
      if (partes[1] === "ler-todas") { minhas.forEach((n) => (n.lida = true)); salvar(); return { mensagem: "Todas as notificações foram marcadas como lidas." }; }
      const n = minhas.find((x) => x.id === partes[1]); if (!n) erro("Notificação não encontrada.", 404);
      n.lida = true; salvar(); return n;
    }

    // --- configurações ---
    if (partes[0] === "configuracoes") {
      exigirLogin();
      if (metodo === "PUT") { exigirDiretor(); Object.assign(db.configuracoes, body); salvar(); }
      return db.configuracoes;
    }

    if (partes[0] === "health") return { status: "ok", banco: "demo" };
    erro("Recurso não encontrado.", 404);
  }

  // ---------------------------------------------------------------------------
  // Ponte para o api.js: mesma assinatura de chamarApi(path, options)
  // ---------------------------------------------------------------------------
  carregar();
  window.API_DEMO = {
    ativo: true,
    reiniciar,
    async chamar(path, options = {}) {
      await new Promise((r) => setTimeout(r, 120));           // pequena latência para parecer real
      const metodo = (options.method || "GET").toUpperCase();
      let body = options.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const token = localStorage.getItem("schoolfix_token");
      try { return copia(tratar(metodo, path, body || {}, token) ?? null); }
      catch (e) {
        if (e instanceof ErroApi) { if (e.status === 401 && !path.includes("/auth/login") && window.logout) window.logout(false); throw new Error(e.message); }
        console.error("[demo]", e); throw new Error("Erro interno da demonstração.");
      }
    },
  };
})();
