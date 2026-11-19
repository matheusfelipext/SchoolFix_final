# SchoolFix — Acessibilidade (o que foi adicionado em 19/10)

| Recurso | Como funciona | Onde |
|---|---|---|
| Barra ♿ (botão redondo no canto inferior direito, em **todas** as 27 páginas) | *Letras maiores* (zoom 120%), *Alto contraste*, *Mais espaço entre linhas*. Sem JavaScript: três checkboxes escondidos + CSS (`#acess-x:checked ~ .app`) — por isso vale para aluno e professor | bloco no início de cada `.html`; `css/base.css` (seção ACESSIBILIDADE) |
| Ler em voz alta | Na barra ♿ do login e do diretor: com "Ler em voz alta" ligado, o texto sob o mouse ou sob o foco do teclado é lido pela voz do navegador (pt-BR). "Ler a página inteira" lê o `<main>` do início ao fim | `js/acessibilidade.js` (carregado em `index.html` e `diretor/*.html`) |
| Foco visível por teclado | contorno verde em qualquer botão, link ou campo ao navegar com Tab | `css/base.css` → `:focus-visible` |
| "Pular para o conteúdo" | primeiro Tab da página mostra o link; Enter vai direto ao `<main id="conteudo">` | link `.pular-conteudo` no topo de cada página interna |
| Esc fecha o sininho | tecla Esc fecha o painel de notificações | `js/acessibilidade.js` |
| Preferências do sistema | "reduzir animações" desliga transições; "mais contraste" aumenta o contraste | `css/base.css` → `prefers-reduced-motion`, `prefers-contrast` |

O que já existia e continua: HTML semântico (`nav`, `main`, `aside`, `footer`, um `h1` por página),
`aria-label`/`aria-current` no menu, tabelas com `caption`/`scope`/`tfoot`, `label for` em todo campo,
ícones com `aria-hidden`, menu do celular sem JS.

## Atualização de 20/10 — em TODAS as 34 páginas
| Recurso | Detalhe |
|---|---|
| **Ler em voz alta** e **Ler a página inteira** | agora também no aluno, professor e gestor. Aluno/professor passam a carregar **um único script** (`js/acessibilidade.js`), que não mexe em dados — só fala e fecha painéis com Esc |
| **VLibras** | tradutor oficial para Libras (gov.br): botão azul na lateral direita; ao clicar, o avatar traduz o texto selecionado. **Precisa de internet** — sem ela o botão some sozinho e nada quebra |
| **Sair** nos portais sem JS | o link vai para `index.html?sair=1`; o `login.js` apaga a sessão ao chegar. Antes, o login via a sessão e mandava de volta ao portal (loop) |
| Perfil no celular | avatar não estica mais (estava virando uma elipse vermelha) |

**Aviso para a apresentação:** o Chrome só começa a falar depois de um clique na página
(ligar o interruptor já conta).

---

# Portal do Gestor (adicionado em 20/10)

A tela do gestor chegou como uma página única (`index.html` + `script.js` + `style.css`) com as
seis abas trocadas por JavaScript, ícones carregados de um site externo e dados fixos. Foi
**fragmentada** em seis páginas no layout do SchoolFix, em `gestor/`:

| Página | O que faz |
|---|---|
| `index.html` | data de hoje, saudação, botão "Nova reclamação", **cartão "Você tem N reclamações aguardando atenção"** (calculado), KPIs, recentes, categorias |
| `reclamacoes.html` | lista **só da área do gestor** (regra do `dados.js`), detalhe, mudar status, resposta oficial |
| `nova-ocorrencia.html` · `chat.html` · `mensagens.html` · `relatorios.html` · `configuracoes.html` | mesmas telas do diretor (mesmo JS) |

O que mudou em relação ao arquivo do colega: usa o mesmo `css/` e `js/` dos outros portais (nada
duplicado); ícones locais (Tabler) em vez do CDN; HTML semântico (`nav`, `main`, um `h1`, tabelas
com `caption`/`scope`/`tfoot`); barra ♿, leitura em voz alta, foco visível e "pular para o
conteúdo"; o gestor entra pelo **login único** (`gestor.infra@schoolfix.com` / `123456` ou
matrícula) e não vê a tela Usuários. As ideias de visual que vieram da tela dele (data no topo,
cartão de atenção, botão na saudação) foram mantidas.

Não foi aproveitado: "Arquivar reclamações após X dias", "Autenticação em dois fatores" e
"Tempo limite da sessão" (não existem no sistema — ficariam só de enfeite).

---

# Responsividade (revisão de 27/10) — `css/responsivo.css`

| Faixa | Largura | O que acontece |
|---|---|---|
| **Monitor grande** | ≥ 1600px | mais espaçamento entre cards e dashboard 2:1 — sem limitar a largura (o menu já ocupa 250px) |
| **Desktop** | 1367–1599px | layout padrão (regras dos outros arquivos) |
| **Notebook** | ≤ 1366px | menu mais estreito, 2 KPIs por linha, chat com coluna menor |
| **Tablet** | ≤ 1024px | colunas lado a lado viram uma só; cabeçalho compacto (some o cargo); cartão de atenção do gestor quebra linha |
| **Celular** | ≤ 768px | menu vira gaveta (☰, sem JS); tabelas rolam dentro do cartão; chat empilhado; formulários em 1 coluna; campos com 16px (evita zoom do iPhone); rodapé com espaço para os botões ♿ e VLibras |
| **Celular pequeno** | ≤ 480px | 1 KPI por linha, botões de largura total |
| Impressão | — | sem menu, cabeçalho, botões flutuantes |

Para testar: `F12` → ícone de celular → presets *iPhone SE* (375), *iPad* (768/1024), *Nest Hub Max* (1280) e redimensionar até 1920.

---

# Atualização — JavaScript nos portais de aluno e professor
As 18 páginas de `aluno/` e `professor/` eram HTML estático (dados fixos de "Pedro Bernardes" e "Carlos Mendes").
Agora carregam `tema.js` → `dados.js` → `app.js` → script da tela → `acessibilidade.js`, como o diretor e o gestor:

| Página (aluno e professor) | Script | O que passou a funcionar |
|---|---|---|
| `index.html` | `inicio.js` | KPIs e recentes reais, com os chamados da própria pessoa |
| `minhas-reclamacoes.html` | `reclamacoes.js` | lista, busca, filtro, paginação, detalhe com respostas da gestão e foto |
| `nova-reclamacao.html` | `nova-ocorrencia.js` | cria o chamado de verdade (anônimo, foto, prioridade); professor tem "prioridade pedagógica" |
| `chat.html` | `chat.js` | canais e mensagens reais com atualização a cada 4 s |
| `fale-direcao.html` | `fale-direcao.js` | conversa com o diretor (nova) |
| `perfil.html` · `perfil-editar.html` | `perfil.js` | dados da conta + contato editável (nova) |
| `grade.html` | `grade.js` | destaca o dia e a aula em andamento (nova) |
| `configuracao.html` | `configuracoes.js` | notificações, idioma, fuso, modo escuro e troca de senha de verdade |

Também passa a existir em todas as páginas: **sininho de notificações**, **modo escuro** (antes só o diretor/gestor tinham `tema.js`),
cabeçalho com o nome da conta logada e botão **Sair** com confirmação (o link `?sair=1` continua funcionando).
