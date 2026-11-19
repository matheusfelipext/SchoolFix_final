/* configuracoes.js — tudo salvo localmente (js/dados.js).
   Instituição (só diretor edita) · Meu perfil · Preferências/tema · Notificações · Senha */
const PERFIS_GESTAO = ["gestor", "coordenador", "diretor"];
document.addEventListener("DOMContentLoaded", async () => {
  const u = getUsuario(); const ehDiretor = u?.perfil === "diretor";
  const $ = (id) => document.getElementById(id);

  // Meu perfil
  if ($("perfil-nome")) $("perfil-nome").value = u?.nome || "";
  if ($("perfil-email")) $("perfil-email").value = u?.email || "";
  if ($("perfil-cargo")) $("perfil-cargo").value = rotuloPerfil(u?.perfil);
  $("btn-salvar-perfil")?.addEventListener("click", async () => {
    try {
      const at = await apiFetch("/api/auth/me", { method: "PUT", body: { nome: $("perfil-nome").value.trim() } });
      setUsuario(at); if ($("user-nome")) $("user-nome").textContent = at.nome; if ($("user-avatar")) $("user-avatar").textContent = at.nome.charAt(0).toUpperCase();
      toast("Perfil atualizado!", "sucesso");
    } catch (e) { toast(e.message, "erro"); }
  });

  // Dados da instituição
  const campos = { "inst-nome": "nome_escola", "inst-endereco": "endereco", "inst-telefone": "telefone", "inst-email": "email_contato" };
  try { const cfg = await apiFetch("/api/configuracoes"); for (const [id, k] of Object.entries(campos)) { if ($(id)) { $(id).value = cfg[k] || ""; $(id).disabled = !ehDiretor; } } } catch {}
  if ($("btn-salvar-instituicao")) { $("btn-salvar-instituicao").style.display = ehDiretor ? "" : "none";
    $("btn-salvar-instituicao").onclick = async () => {
      const body = {}; for (const [id, k] of Object.entries(campos)) body[k] = $(id).value.trim();
      try { await apiFetch("/api/configuracoes", { method: "PUT", body }); toast("Dados da instituição salvos!", "sucesso"); } catch (e) { toast(e.message, "erro"); }
    }; }

  // Preferências (selects com data-pref) e tema
  const prefs = obterPreferencias();
  document.querySelectorAll("select[data-pref]").forEach((sel) => {
    sel.value = prefs[sel.dataset.pref];
    sel.addEventListener("change", async () => { try { await salvarPreferencias({ [sel.dataset.pref]: sel.value }); toast("Preferência salva.", "sucesso", 1500); } catch (e) { toast(e.message, "erro"); } });
  });
  const chk = $("chk-tema");
  if (chk) { chk.checked = prefs.tema === "escuro"; chk.addEventListener("change", async () => { window.alternarTema(chk.checked); try { await salvarPreferencias({ tema: chk.checked ? "escuro" : "claro" }); } catch (e) { toast(e.message, "erro"); } }); }

  // Notificações (interruptores com data-notif)
  document.querySelectorAll("[data-somente-gestao]").forEach((el) => { if (!PERFIS_GESTAO.includes(u?.perfil)) el.style.display = "none"; });
  document.querySelectorAll("input[data-notif]").forEach((c) => {
    // data-notif-padrao="false" → começa desligado enquanto o usuário não escolher
    const padrao = c.dataset.notifPadrao !== "false";
    c.checked = (prefs.notificacoes[c.dataset.notif] ?? padrao) !== false;
    c.addEventListener("change", async () => { try { await salvarPreferencias({ notificacoes: { [c.dataset.notif]: c.checked } }); toast(c.checked ? "Notificação ativada." : "Notificação desativada.", "sucesso", 1500); } catch (e) { toast(e.message, "erro"); c.checked = !c.checked; } });
  });

  // Alterar senha
  $("form-senha")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nova = $("senha-nova").value; if (nova !== $("senha-confirma").value) return toast("A confirmação não confere com a nova senha.", "erro");
    try { await apiFetch("/api/auth/me/senha", { method: "PUT", body: { senha_atual: $("senha-atual").value, nova_senha: nova } }); e.target.reset(); toast("Senha alterada com sucesso!", "sucesso"); }
    catch (err) { toast(err.message, "erro"); }
  });
});
