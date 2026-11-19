/* usuarios.js — CRUD de usuários (exclusivo do diretor).
   GET/POST /api/usuarios, PUT/DELETE /api/usuarios/<id>, GET /api/areas */

let usuarios = [];
let areas = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (getUsuario()?.perfil !== "diretor") {
    toast("Área exclusiva da diretoria.", "erro");
    setTimeout(() => (location.href = "index.html"), 1200);
    return;
  }
  configurarFormulario();
  document.getElementById("busca-usuarios").addEventListener("input", renderizar);
  document.getElementById("usuario-perfil").addEventListener("change", alternarCampoArea);
  // cadastrar gestor exige área; esta versão não tem o campo → só os outros perfis
  document.querySelector('#usuario-perfil option[value="gestor"]')?.remove();
  await carregarAreas();
  await carregarUsuarios();
});

async function carregarAreas() {
  try {
    areas = await apiFetch("/api/areas");
    const selArea = document.getElementById("usuario-area");
    if (selArea) selArea.innerHTML =
      '<option value="">Selecione a área...</option>' +
      areas.map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`).join("");
  } catch (e) { toast(e.message, "erro"); }
}

async function carregarUsuarios() {
  const tbody = document.getElementById("tabela-usuarios");
  try {
    usuarios = await apiFetch("/api/usuarios");
    renderizar();
  } catch (e) { tbody.innerHTML = linhaVazia(6, e.message); }
}

function renderizar() {
  const tbody = document.getElementById("tabela-usuarios");
  const termo = document.getElementById("busca-usuarios").value.toLowerCase();
  const lista = usuarios.filter((u) =>
    `${u.nome} ${u.email} ${rotuloPerfil(u.perfil)} ${u.ativo ? "ativo" : "inativo"}`.toLowerCase().includes(termo));

  if (!lista.length) { tbody.innerHTML = linhaVazia(6, "Nenhum usuário encontrado."); return; }
  tbody.innerHTML = lista.map((u) => `
    <tr class="${u.ativo ? "" : "linha-inativa"}">
      <td><div class="avatar avatar-tabela">${escapeHtml(u.nome.charAt(0).toUpperCase())}</div></td>
      <td><strong>${escapeHtml(u.nome)}</strong>${u.area_nome ? `<br><small class="text-muted">${escapeHtml(u.area_nome)}</small>` : ""}</td>
      <td>${escapeHtml(u.email)}${u.matricula ? `<br><small class="text-muted">RA ${escapeHtml(u.matricula)}</small>` : ""}</td>
      <td><span class="role-badge role-${u.perfil === "diretor" ? "diretoria" : u.perfil}">${rotuloPerfil(u.perfil)}</span></td>
      <td><span class="badge ${u.ativo ? "badge-ativo" : "badge-inativo"}">${u.ativo ? "Ativo" : "Inativo"}</span></td>
      <td style="text-align:center">
        <div class="acoes-tabela">
          <button type="button" class="btn-tbl btn-tbl-edit" onclick="editarUsuario('${u.id}')"><i class="ti ti-pencil"></i> Editar</button>
          ${u.ativo ? `<button type="button" class="btn-tbl btn-tbl-delete" onclick="desativarUsuario('${u.id}')"><i class="ti ti-user-off"></i> Desativar</button>` : ""}
        </div>
      </td>
    </tr>`).join("");
}

function alternarCampoArea() {
  const gestor = document.getElementById("usuario-perfil").value === "gestor";
  const campo = document.getElementById("campo-area"); if (campo) campo.style.display = gestor ? "block" : "none";
}

function configurarFormulario() {
  const form = document.getElementById("form-usuario");
  document.getElementById("btn-novo-usuario").onclick = () => {
    limparFormulario();
    document.getElementById("form-usuario-titulo").textContent = "Novo Usuário";
    const dica = document.getElementById("dica-senha"); if (dica) dica.textContent = "Obrigatória (mín. 6 caracteres)";
    form.style.display = "block";
    document.getElementById("usuario-nome").focus();
  };
  document.getElementById("btn-cancelar-usuario").onclick = () => { form.style.display = "none"; limparFormulario(); };
  document.getElementById("btn-salvar-usuario").onclick = salvarUsuario;
}

async function salvarUsuario() {
  const id = document.getElementById("usuario-id").value;
  const dados = {
    nome: document.getElementById("usuario-nome").value.trim(),
    email: document.getElementById("usuario-email").value.trim(),
    matricula: document.getElementById("usuario-matricula")?.value.trim() || null,
    perfil: document.getElementById("usuario-perfil").value,
    ativo: (document.getElementById("usuario-status") || document.getElementById("user-status")).value.toLowerCase().startsWith("ativ") || document.getElementById("usuario-status")?.value === "true",
    area_id: document.getElementById("usuario-area")?.value || null,
  };
  const senha = document.getElementById("usuario-senha").value;
  if (senha) dados.senha = senha;

  if (!dados.nome || !dados.email) return toast("Preencha nome e e-mail.", "erro");
  if (!id && !senha) return toast("Informe uma senha para o novo usuário.", "erro");

  try {
    if (id) {
      await apiFetch(`/api/usuarios/${id}`, { method: "PUT", body: dados });
      toast("Usuário atualizado!", "sucesso");
    } else {
      await apiFetch("/api/usuarios", { method: "POST", body: dados });
      toast("Usuário cadastrado!", "sucesso");
    }
    document.getElementById("form-usuario").style.display = "none";
    limparFormulario();
    carregarUsuarios();
  } catch (e) { toast(e.message, "erro"); }
}

function limparFormulario() {
  ["usuario-id", "usuario-nome", "usuario-email", "usuario-senha", "usuario-matricula"].forEach((id) => (document.getElementById(id).value = ""));
  document.getElementById("usuario-perfil").value = "aluno";
  const st = document.getElementById("usuario-status") || document.getElementById("user-status");
  st.value = st.querySelector('option[value="true"]') ? "true" : "Ativo";
  const ar = document.getElementById("usuario-area"); if (ar) ar.value = "";
  alternarCampoArea();
}

window.editarUsuario = (id) => {
  const u = usuarios.find((x) => x.id === id);
  if (!u) return;
  document.getElementById("usuario-id").value = u.id;
  document.getElementById("usuario-nome").value = u.nome;
  document.getElementById("usuario-email").value = u.email;
  const mat = document.getElementById("usuario-matricula"); if (mat) mat.value = u.matricula || "";
  document.getElementById("usuario-perfil").value = u.perfil;
  const st2 = document.getElementById("usuario-status") || document.getElementById("user-status");
  st2.value = st2.querySelector('option[value="true"]') ? String(u.ativo) : (u.ativo ? "Ativo" : "Inativo");
  const ar2 = document.getElementById("usuario-area"); if (ar2) ar2.value = u.area_id || "";
  document.getElementById("usuario-senha").value = "";
  const dica2 = document.getElementById("dica-senha"); if (dica2) dica2.textContent = "Deixe em branco para não alterar";
  document.getElementById("form-usuario-titulo").textContent = "Editar Usuário";
  alternarCampoArea();
  document.getElementById("form-usuario").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.desativarUsuario = async (id) => {
  if (!confirm("Desativar este usuário? Ele não conseguirá mais entrar, mas o histórico é mantido.")) return;
  try {
    await apiFetch(`/api/usuarios/${id}`, { method: "DELETE" });
    toast("Usuário desativado.", "sucesso");
    carregarUsuarios();
  } catch (e) { toast(e.message, "erro"); }
};
