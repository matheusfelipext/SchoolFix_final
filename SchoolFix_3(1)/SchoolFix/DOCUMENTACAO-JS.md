# SchoolFix — Documentação detalhada do JavaScript
### Versão local (dados no navegador) · 16 arquivos · 1.964 linhas

> Objetivo deste documento: você abrir qualquer arquivo de `js/` e saber **o que cada função
> faz, o que recebe, o que devolve e quem a chama**. As linhas indicadas são aproximadas (mudam
> se o Prettier formatar o arquivo).

---

## 0. Mapa geral

```
                 ┌──────────────┐
  tema.js ──────►│  <head>      │  aplica modo escuro antes de pintar
                 └──────────────┘
  dados.js ─────► window.API_DEMO      "servidor" no navegador (localStorage)
  app.js ───────► apiFetch(), sessão, cabeçalho, menu, sininho, preferências, utilitários
  acessibilidade.js ► ler em voz alta, Esc fecha painéis
  <tela>.js ────► só a lógica daquela página (ids do HTML dela)
```

Ordem de carregamento em toda página do diretor/gestor: `tema.js` (head) → `dados.js` → `app.js`
→ `<tela>.js` → `acessibilidade.js`. **Aluno e professor seguem a mesma ordem** (antes carregavam só `acessibilidade.js`).

**Fluxo de qualquer ação:**
`clique → <tela>.js monta o pedido → apiFetch("/api/...") → API_DEMO.chamar() → tratar() lê/grava
o localStorage → devolve um objeto → <tela>.js redesenha`.

**Convenções:** funções começam com verbo em português (`carregarLista`, `renderizarTabela`);
`async function` = faz pedido e usa `await`; `window.x = ...` = a função é usada num `onclick=""`
do HTML e por isso precisa ficar global.

---

## 1. `dados.js` (376 linhas) — o banco de dados local

Substitui o Flask. Um objeto `db` com as listas `usuarios`, `areas`, `chamados`, `canais`,
`mensagens_canal`, `conversas`, `mensagens_diretas`, `notificacoes` e o objeto `configuracoes`,
gravado em `localStorage["schoolfix_demo_db"]`.

| Linha | Função | Recebe | Devolve | O que faz |
|---|---|---|---|---|
| 19 | `agora()` | — | texto ISO | data/hora atual, ex.: `"2026-10-27T14:00:00.000Z"` |
| 20 | `diasAtras(d, h)` | dias, hora | texto ISO | data `d` dias atrás às `h` horas — usada nos exemplos |
| 21 | `id()` | — | texto | id aleatório (hex) para registros novos |
| 22 | `copia(o)` | objeto | objeto | cópia profunda (`JSON.parse(JSON.stringify())`) para a tela não alterar o `db` por engano |
| 30 | `dadosIniciais()` | — | objeto `db` | **os dados pré-prontos**: 8 usuários (6 contas de teste + gestor TI + aluna), 7 áreas, 8 chamados com descrição e respostas, 4 canais, mensagens do #geral, 2 conversas, 5 notificações, dados da escola. Para mudar um exemplo, edite aqui |
| 113 | `carregar()` | — | — | lê o `db` da gaveta; se não existir, chama `dadosIniciais()` e `salvar()` |
| 117 | `salvar()` | — | — | `localStorage.setItem(CHAVE, JSON.stringify(db))` — chamada após **toda** gravação |
| 118 | `reiniciar()` | — | — | apaga a gaveta e recria os dados iniciais |
| 124 | `erro(msg, status)` | mensagem, código HTTP | lança `ErroApi` | interrompe a rota com erro (vira o aviso vermelho na tela) |
| 128 | `usuarioParaApi(u)` | usuário do `db` | objeto sem `senha` | nunca devolve a senha para a tela |
| 129 | `chamadoParaApi(c, completo)` | chamado, booleano | objeto | adiciona `protocolo`, `area`, `tem_imagem`, `total_respostas`; se `anonimo`, troca o autor por "Anônimo"; só inclui `imagem` e `respostas` quando `completo = true` (detalhe) — a lista fica leve |
| 136 | `pref(u, chave)` | usuário, chave | booleano | lê `u.preferencias.notificacoes[chave]` (padrão `true`) |
| 137 | `notificar(usuario_id, tipo, titulo, chamado_id)` | — | — | cria notificação **se** a preferência do destinatário permitir: `nova_mensagem`→`mensagens_diretas`, `status_atualizado`→`status_chamados`, `nova_resposta`→`respostas`, `novo_chamado_urgente`→`chamados_urgentes` |
| 144 | `podeGerenciar(c, u)` | chamado, usuário | booleano | diretor e coordenador: sempre; gestor: só se `c.area_id === u.area_id` |
| 145 | `visiveis(u)` | usuário | lista | diretor/coordenador: todos; gestor: só da área; aluno/professor: só os que criou. Ordenados do mais novo ao mais antigo |
| 152 | `tratar(metodo, caminho, body, token)` | `"PUT"`, `"/api/chamados/c-2/status"`, `{status:"resolvido"}`, `"demo-u-dir"` | objeto da resposta | **o roteador**. Descobre o usuário pelo token (`"demo-" + id`), quebra o caminho em partes e entra num bloco por assunto (abaixo) |
| ~370 | `window.API_DEMO.chamar(path, options)` | caminho, `{method, body}` | `Promise` do objeto | ponte que o `app.js` usa; espera 120 ms, chama `tratar`, devolve uma `copia()` |

**Blocos de `tratar()` (procure por `partes[0] === "..."`):**

| Bloco | Rotas | Regras |
|---|---|---|
| `auth` | `login`, `me`, `me/senha`, `me/preferencias` | login aceita e-mail **ou** matrícula no mesmo campo; usuário inativo não entra |
| `chamados` | lista (`?status`, `?categoria`, `?busca`, `?limite`), `estatisticas`, `<id>`, `<id>/status`, `<id>/respostas`, `DELETE <id>` (rota existe; botão na tela ainda não) | criar: título ≥ 3, descrição ≥ 10; roteia para a área pela categoria e chama `notificar` do gestor (e de diretor/coordenador se urgente); status/resposta: só gestão com `podeGerenciar`; excluir: só diretor |
| `canais` | lista, `<id>/mensagens` (`?depois=`) | canal privado só para os perfis permitidos |
| `conversas` | lista, criar, `<id>/mensagens` | só participantes; ao ler, mensagens recebidas viram `lida`; ao enviar, `notificar` o outro |
| `usuarios` | `contatos`, lista, criar, `PUT <id>`, `DELETE <id>` | só diretor (menos `contatos`); senha ≥ 6; e-mail e matrícula únicos; `DELETE` só marca `ativo=false` |
| `areas` | lista | — |
| `notificacoes` | lista, `nao-lidas`, `<id>/lida`, `ler-todas` | só as do próprio usuário |
| `configuracoes` | `GET`, `PUT` | `PUT` só diretor |

---

## 2. `app.js` (315 linhas) — o que toda tela usa

| Linha | Função | Recebe | Devolve | O que faz |
|---|---|---|---|---|
| 23 | `API_BASE_URL` | — | texto | constante; na versão local não é usada para nada (fica para a versão online) |
| 37–43 | `getToken()`, `setToken(t)`, `getUsuario()`, `setUsuario(u)` | — | — | leem/gravam `schoolfix_token` e `schoolfix_usuario` no `localStorage` |
| 45 | `logout(perguntar)` | booleano | — | confirma (se `perguntar`), apaga a sessão e vai para `../index.html` |
| 53 | `exigirLogin()` | — | booleano | sem token ou usuário → `location.replace("../index.html")` |
| 73 | `apiFetch(path, options)` | `"/api/..."`, `{method, body}` | `Promise` | **a única porta para os dados**. Aqui só repassa para `API_DEMO.chamar`. Erro → `throw new Error(mensagem)` |
| 108 | `escapeHtml(valor)` | texto | texto | troca `& < > " '` por entidades. **Obrigatória** antes de pôr texto do usuário em `innerHTML` |
| 119 | `obterPreferencias()` | — | objeto | preferências do usuário salvo, mescladas com o padrão (`PREFERENCIAS_PADRAO`) |
| 123 | `salvarPreferencias(parcial)` | `{tema:"escuro"}` | `Promise` prefs | `PUT /api/auth/me/preferencias`, atualiza o usuário salvo e aplica o tema |
| 130 | `formatarData(iso, comHora)` | texto ISO, booleano | `"27/10/2026"` ou com hora | usa idioma e fuso das preferências |
| 140 | `formatarHora(iso)` | texto ISO | `"14:00"` | idem |
| 151 | `badgeStatus(status)` | `"em_analise"` | HTML | `<span class="badge badge-analise">Em Análise</span>` |
| 157 | `badgePrioridade(p)` | `"alta"` | HTML | etiqueta colorida da prioridade |
| 162 | `rotuloPerfil(p)` | `"gestor"` | `"Gestor"` | |
| 165 | `toast(msg, tipo, ms)` | texto, `"sucesso"\|"erro"\|"info"` | — | aviso flutuante no canto; some sozinho |
| 181 | `linhaVazia(colunas, texto)` | número, texto | HTML | `<tr>` com uma célula ocupando a tabela toda |
| 194 | `preencherHeader()` | — | — | nome, cargo e inicial do avatar (`#user-nome`, `#user-role`, `#user-avatar`) e a saudação. Também preenche qualquer elemento com `data-usuario="nome\|primeiro-nome\|inicial\|email\|matricula\|perfil"` (usado nas páginas de aluno/professor; sem valor mostra "—") |
| 205 | `paginaReclamacoes()` | — | texto | `"minhas-reclamacoes.html"` para aluno/professor, `"reclamacoes.html"` para a gestão — usada nos links do sininho, do dashboard e do redirecionamento depois de criar um chamado |
| 205 | `ajustarSidebar()` | — | — | marca `.active` no item cujo `href` é o arquivo atual; esconde `usuarios.html` (só diretor) e `relatorios.html` (gestão) pelo perfil |
| 217 | `carregarNomeEscola()` | — | — | `GET /api/configuracoes` → `#header-escola` (cache de 1 h) |
| 227 | `atualizarBadgeNotificacoes()` | — | — | `GET /api/notificacoes/nao-lidas` → número no sininho |
| 237 | `abrirNotificacoes()` | — | — | monta o painel: lista, "marcar todas", clique leva ao chamado |
| 282 | `configurarNotificacoes()` | — | — | liga o clique do sino, fecha ao clicar fora, atualiza o badge a cada 60 s |
| ~320 | `DOMContentLoaded` | — | — | se `<body data-publica>` (login) não faz nada; senão: `exigirLogin`, `preencherHeader`, `ajustarSidebar`, tema das preferências, `configurarNotificacoes`, `carregarNomeEscola`, revalida `/api/auth/me` a cada 5 min |
| fim | `Object.assign(window, {...})` | — | — | expõe as funções para os `onclick` do HTML e para os outros scripts |

---

## 3. `tema.js` (25 linhas)
| Linha | Função | O que faz |
|---|---|---|
| 1–8 | (imediato) | se `localStorage.schoolfix_theme === "dark"`, põe `dark-theme` no `<html>` **antes** de a página pintar |
| 10 | `window.alternarTema(ligar)` | troca a classe, grava a escolha e dispara `document.dispatchEvent(new CustomEvent("temaAlterado"))` — gráficos escutam |
| 18 | `window.temaEscuro()` | devolve `true/false` |

## 4. `acessibilidade.js` (62 linhas)
| Linha | Função | O que faz |
|---|---|---|
| 17 | `falar(texto, cancelar)` | cria `SpeechSynthesisUtterance` em `pt-BR`, escolhe uma voz em português se houver, fala |
| 26 | `textoDe(el)` | campo de formulário → "Rótulo. Valor: …"; outro elemento → `aria-label` ou texto (até 300 caracteres) |
| 34 | `aoPassar(e)` | `mouseover`: acha o elemento falável mais próximo e agenda `falar` em 180 ms (não lê tudo por onde o mouse corre) |
| 40 | `aoFocar(e)` | `focusin` (Tab): fala na hora |
| 41 | `ligar(ativo)` | marca o checkbox `#acess-voz`, grava `schoolfix_voz`, liga/desliga os dois ouvintes |
| ~50 | botão `#acess-ler-pagina` | junta `h1 h2 h3 p li td th label` do `<main>` e fala em sequência; segundo clique para |
| fim | `keydown` Esc | fecha `#notif-painel` |

## 5. `login.js` (47 linhas)
| Linha | O que faz |
|---|---|
| 3–8 | `?sair=1` na URL → apaga a sessão (link de saída antigo dos portais sem JS; hoje o botão "Sair" de todos os portais chama `logout()` do `app.js`) |
| 10 | já tem sessão → `location.replace(portalDe(perfil))` |
| 16 | `mostrarErro(msg)` escreve em `#login-erro` |
| 18–40 | `submit` do `#login-form`: `preventDefault`, valida, desabilita o botão, `POST /api/auth/login`, `setToken`/`setUsuario`, aplica o tema da conta, redireciona |
| 44 | `portalDe(perfil)` → `diretor/`, `gestor/`, `professor/`, `aluno/` (coordenador usa `diretor/`) |

---

## 6. Scripts de tela

### `inicio.js` (71 linhas) — Início
| Função | O que faz |
|---|---|
| `carregarDashboard()` | `Promise.all` de `/api/chamados/estatisticas` e `/api/chamados?limite=5`, depois chama as três abaixo; erro → toast + `linhaVazia` |
| `renderizarKpis(s)` | escreve `#kpi-total`, `#kpi-pendentes`, `#kpi-analise`, `#kpi-resolvidas`; **no gestor**, também a data por extenso (`#data-hoje`) e o cartão "você tem N reclamações aguardando" (`#atencao-titulo`) |
| `renderizarRecentes(lista)` | 5 `<tr>` em `#tabela-recentes`, cada uma com `onclick` para `reclamacoes.html?id=` |
| `renderizarCategorias(porCategoria, total)` | barras em `#mapa-categorias` com quantidade e porcentagem |

### `reclamacoes.js` (195 linhas) — Todas as Reclamações
Estado: `lista` (todos os chamados visíveis), `selecionadoId`, `filtroStatus`, `chartStatus`.
| Função | O que faz |
|---|---|
| `carregarLista()` | `GET /api/chamados` → `renderizarTabela` + `desenharGrafico` |
| `renderizarTabela()` | filtra `lista` por status e pelo texto da busca **no navegador**, escreve as `<tr>` e o contador |
| `configurarFiltros()` | `input` na busca e clique nas abas `#filtros-status .filter-tab` → `renderizarTabela` |
| `abrirDetalhes(id)` | `GET /api/chamados/<id>` → preenche `#detalhe-*`, imagem, respostas; esconde status/resposta se o perfil não for gestão |
| `renderizarRespostas(respostas)` | histórico em `#lista-respostas` |
| `configurarAcoesDetalhe()` | `#btn-atualizar-status` → `PUT …/status` (atualiza `lista[idx]`, redesenha); `#btn-enviar-resposta` → `POST …/respostas` e reabre o detalhe |
| `desenharGrafico()` | donut Pendente/Em análise/Resolvido com cores das variáveis CSS; redesenha no `temaAlterado` |
| `window.abrirDetalhes` | usada pelo `onclick` do botão "Ver" |

### `nova-ocorrencia.js` (73 linhas)
| Função | O que faz |
|---|---|
| `previewImagem(e)` | mostra o nome e a prévia (`FileReader`); recusa > 2 MB |
| `lerImagemBase64(file)` | `Promise` com a imagem em `data:image/...;base64` |
| `salvarOcorrencia(e)` | `preventDefault`, valida título (≥ 3) e descrição (≥ 10), `POST /api/chamados` com categoria, prioridade (minúscula), anônimo, imagem; toast com o protocolo e redireciona para o detalhe |

### `chat.js` (101 linhas) — Chat Geral
Estado: `canalAtualId`, `ultimaMensagemEm`, `timerPolling`.
| Função | O que faz |
|---|---|
| `carregarCanais()` | `GET /api/canais` (só os que o perfil vê) → lista `#lista-canais`; abre o primeiro |
| `selecionarCanal(id, nome, desc)` | marca ativo, limpa a caixa, habilita o input e liga `setInterval(buscarMensagens, 4000)` |
| `buscarMensagens(inicial)` | `GET /api/canais/<id>/mensagens?depois=<última>` — só o que é novo; anexa no fim e rola |
| `renderMensagem(m)` | HTML de uma mensagem (`article.msg`, `msg-minha` se for sua) |
| `configurarEnvio()` | Enter ou botão → `POST …/mensagens` → `buscarMensagens` |

### `mensagens.js` (130 linhas) — Mensagens Diretas
Estado: `conversaAtivaId`, `ultimaEm`, `timerMsgs`, `timerConversas`.
| Função | O que faz |
|---|---|
| `carregarConversas()` | `GET /api/conversas` (com `nao_lidas`) → `#lista-conversas`; repete a cada 10 s |
| `abrirConversa(id, nome, perfil)` | cabeçalho, zera o contador, liga polling de 4 s |
| `buscarMensagens(inicial)` | igual ao chat; ao ler, o `dados.js` marca as recebidas como lidas |
| `configurarEnvio()` | `POST /api/conversas/<id>/mensagens`, depois recarrega lista e mensagens |
| `configurarNovaConversa()` | botão "+" → `GET /api/usuarios/contatos` no select → `POST /api/conversas` (reaproveita se já existir) |

### `relatorios.js` (104 linhas)
| Função | O que faz |
|---|---|
| `carregarRelatorios()` | `GET /api/chamados/estatisticas` → guarda em `statsCache`, chama as duas abaixo |
| `preencherCards(s)` | total, taxa de resolução, categoria mais frequente, urgentes abertos |
| `coresTema()` | lê `--success`, `--warning`, `--danger`, `--text-secondary`… do CSS (por isso funciona no escuro) |
| `desenharGraficos(s)` | donut de prioridade (`#chartPrioridade`) e barras por categoria (`#chartCategoria`) com Chart.js; destrói o anterior antes de redesenhar |
| `exportarRelatorio()` | preferência `pdf` → `window.print()`; `csv` → monta o texto (`;`, BOM para o Excel) e dispara o download |

### `usuarios.js` (146 linhas) — só diretor
Estado: `usuarios`, `areas`.
| Função | O que faz |
|---|---|
| (início) | perfil ≠ diretor → toast e volta ao início |
| `carregarAreas()` | `GET /api/areas` → select `#usuario-area` (para gestor) |
| `carregarUsuarios()` | `GET /api/usuarios` → `renderizar` |
| `renderizar()` | tabela com busca local; botões Editar / Desativar |
| `alternarCampoArea()` | mostra o campo de área só quando o cargo é gestor |
| `configurarFormulario()` | "Adicionar" limpa e abre; "Cancelar" fecha; "Salvar" → `salvarUsuario` |
| `salvarUsuario()` | lê nome, e-mail, matrícula, senha, cargo, status; `#usuario-id` vazio → `POST` (senha obrigatória); preenchido → `PUT` |
| `limparFormulario()` | zera os campos |
| `window.editarUsuario(id)` | preenche o formulário com o usuário da lista |
| `window.desativarUsuario(id)` | confirma → `DELETE` (marca inativo) |

### `configuracoes.js` (52 linhas)
Tudo salva no `change`, sem botão geral:
| Trecho | O que faz |
|---|---|
| Meu perfil | preenche nome/e-mail/cargo; `#btn-salvar-perfil` → `PUT /api/auth/me` e atualiza o cabeçalho |
| Instituição | `GET /api/configuracoes` → `#inst-*`; campos bloqueados se não for diretor; `#btn-salvar-instituicao` → `PUT` |
| Preferências | `select[data-pref]` (idioma, fuso, exportação) e `#chk-tema` → `salvarPreferencias` |
| Notificações | `input[data-notif]` → `salvarPreferencias({notificacoes:{…}})`; `[data-somente-gestao]` some para aluno/professor |
| Senha | `#form-senha` → `PUT /api/auth/me/senha` (confere confirmação) |

### Portais de aluno e professor — o que mudou nos scripts compartilhados
Os mesmos arquivos servem os quatro portais; o que muda é decidido pelo perfil (`getUsuario().perfil`):
| Script | Comportamento para aluno/professor |
|---|---|
| `inicio.js` | KPIs e "recentes" só com os chamados que a pessoa criou (a regra está em `visiveis()`); a tabela ganha o rodapé `#rodape-recentes`; clique na linha vai para `minhas-reclamacoes.html?id=` |
| `reclamacoes.js` | tabela de **6 colunas** (sem "Autor"); o painel mostra "Status atual" (`#detalhe-badge-status`), a foto anexada (`#detalhe-imagem`) e o histórico de respostas, **sem** os campos de status/resposta oficial (que nem existem nesse HTML — por isso os `addEventListener` usam `?.`) |
| `nova-ocorrencia.js` | mesmo formulário; no professor existe o `#box-pedagogico` (marca `canal_prioridade_pedagogica`); depois de salvar abre `minhas-reclamacoes.html?id=` |
| `chat.js` | o canal privado `#gestao` não aparece (filtrado pelo `dados.js`) |
| `configuracoes.js` | só as seções que existem no HTML (notificações, preferências, tema, senha). `data-notif-padrao="false"` faz o interruptor começar desligado ("Avisos no chat") |

### `fale-direcao.js` (98 linhas) — aluno e professor
Conversa 1:1 fixa com o diretor. Ids: `#fd-contatos`, `#fd-titulo`, `#fd-sub`, `#fd-mensagens`, `#fd-input`, `#fd-enviar`.
| Função | O que faz |
|---|---|
| `iniciar()` | `GET /api/usuarios/contatos` → acha o 1º `perfil === "diretor"`; `POST /api/conversas` (reaproveita a conversa se já existir); preenche a coluna da esquerda e o cabeçalho; liga o polling de 4 s |
| `boasVindas()` | mensagem de apresentação mostrada **só na tela** quando a conversa está vazia (não é gravada); some ao chegar a 1ª mensagem |
| `buscarMensagens(inicial)` | `GET /api/conversas/<id>/mensagens?depois=<última>` — só as novas; "Você" nas suas; rola para o fim e atualiza a prévia da esquerda |
| `configurarEnvio()` | Enter ou botão → `POST …/mensagens` → `buscarMensagens` |

### `perfil.js` (79 linhas) — `perfil.html` e `perfil-editar.html`
Nome, e-mail e matrícula/RA vêm da conta (via `data-usuario` do `app.js`). Os campos editáveis ficam em `localStorage["schoolfix_perfil_<id>"]`: `social`, `telefone`, `email2`, `endereco`. CPF, RG, data de nascimento, curso e demais dados acadêmicos/profissionais **não existem no `dados.js`** e continuam sendo o texto do HTML.
| Função | O que faz |
|---|---|
| `lerExtras()` / `salvarExtras(o)` | lê/grava o objeto acima |
| `mascaraTelefone(v)` | `(19) 98876-6422` enquanto digita |
| `mostrarPerfil()` | preenche os `[data-extra]`; nome social sem valor salvo = primeiro nome; e-mail alternativo sem valor = "—" |
| `configurarEdicao()` | campos bloqueados vêm da conta; `submit` valida telefone (10–11 dígitos), e-mail alternativo e nome social (≤ 60), grava e volta a `perfil.html` |

### `grade.js` (35 linhas) — `grade.html`
A tabela é fixa no HTML. O script destaca a coluna do dia (`.col-hoje`) e a linha da aula em andamento (`.faixa-agora`, a partir do texto "19h00 – 20h40" do `<th>`), e escreve em `#grade-hoje` qual é o dia. Fim de semana: só avisa que não há aulas. Estilos em `css/perfil.css`.

---

## 7. Receitas rápidas

| Quero… | Mexa em |
|---|---|
| Mudar um usuário ou chamado de exemplo | `dados.js` → `dadosIniciais()`; depois `localStorage.clear()` no console e recarregar |
| Criar uma rota nova (ex.: `/api/avisos`) | `dados.js` → novo bloco `if (partes[0] === "avisos")` em `tratar()`; chame com `apiFetch("/api/avisos")` |
| Uma tela nova | copie um `<tela>.js`, troque os ids, inclua `<script>` depois de `app.js` |
| Mudar a regra de quem vê o quê | `dados.js` → `podeGerenciar` e `visiveis` |
| Trocar o texto de um aviso | o `toast("…")` do script da tela |
| Ligar no servidor de verdade (Flask) | só `apiFetch` em `app.js`: trocar `API_DEMO.chamar` por `fetch(API_BASE_URL + path, …)` — nenhuma tela muda |
