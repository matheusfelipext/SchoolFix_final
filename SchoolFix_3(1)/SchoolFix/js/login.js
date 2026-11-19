/* login.js — Tela de entrada.
   POST /api/auth/login → guarda token + usuário → vai para index.html */
document.addEventListener("DOMContentLoaded", () => {
  // Veio de um botão "Sair" (../index.html?sair=1): encerra a sessão aqui mesmo
  if (/[?&]sair=1/.test(location.search)) {
    localStorage.removeItem("schoolfix_token"); localStorage.removeItem("schoolfix_usuario"); localStorage.removeItem("schoolfix_revalidado_em");
    history.replaceState(null, "", location.pathname);
  }
  // Já logado? Pula o login.
  if (getToken() && getUsuario()) { window.location.replace(portalDe(getUsuario().perfil)); return; }

  const form = document.getElementById("login-form");
  const erroEl = document.getElementById("login-erro");
  const btn = form.querySelector("button[type=submit]");

  const mostrarErro = (msg) => { erroEl.textContent = msg; erroEl.style.display = "block"; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erroEl.style.display = "none";

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    if (!email || !senha) return mostrarErro("Preencha e-mail e senha.");

    btn.disabled = true;
    btn.textContent = "Entrando...";
    try {
      const dados = await apiFetch("/api/auth/login", { method: "POST", body: { email, senha } });
      if (!["diretor", "coordenador", "gestor", "professor", "aluno"].includes(dados.usuario.perfil)) return mostrarErro("Perfil sem portal nesta versão.");
      setToken(dados.access_token);
      setUsuario(dados.usuario);
      window.location.href = portalDe(dados.usuario.perfil);
    } catch (err) {
      mostrarErro(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });
});

/** Cada perfil tem a sua pasta de páginas. */
function portalDe(perfil) {
  return { diretor: "diretor/index.html", coordenador: "diretor/index.html", gestor: "gestor/index.html",
           professor: "professor/index.html", aluno: "aluno/index.html" }[perfil] || "diretor/index.html";
}
