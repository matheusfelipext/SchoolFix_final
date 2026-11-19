/* nova-ocorrencia.js — Formulário de cadastro de chamado.
   POST /api/chamados com título, descrição, categoria, prioridade,
   anônimo e (opcional) imagem em base64. */

const TAMANHO_MAX_IMAGEM = 2 * 1024 * 1024; // 2 MB

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-nova-ocorrencia");
  const inputImg = document.getElementById("oc-imagem");

  if (inputImg) inputImg.addEventListener("change", previewImagem);
  form.addEventListener("submit", salvarOcorrencia);

  // Professor pode marcar "prioridade pedagógica"; para os demais o campo some
  const boxPedagogico = document.getElementById("box-pedagogico");
  if (boxPedagogico && getUsuario()?.perfil !== "professor") boxPedagogico.style.display = "none";
});

function previewImagem(e) {
  const file = e.target.files[0];
  const label = document.getElementById("file-label");
  const preview = document.getElementById("img-preview");
  const container = document.getElementById("container-preview");

  if (!file) { if (container) container.style.display = "none"; return; }
  if (file.size > TAMANHO_MAX_IMAGEM) {
    toast("Imagem muito grande (máx. 2 MB).", "erro");
    e.target.value = "";
    return;
  }
  if (label) label.innerHTML = `<strong>Arquivo selecionado:</strong> ${escapeHtml(file.name)}`;
  const reader = new FileReader();
  reader.onload = () => { if (preview && container) { preview.src = reader.result; container.style.display = "block"; } };
  reader.readAsDataURL(file);
}

function lerImagemBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function salvarOcorrencia(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const file = document.getElementById("oc-imagem")?.files?.[0];

  const tipo = document.getElementById("oc-tipo")?.value;
  if (tipo === "") return toast("Selecione um tipo de postagem.", "erro");
  const dados = {
    ...(tipo ? { tipo } : {}),
    titulo: document.getElementById("oc-titulo").value.trim(),
    descricao: document.getElementById("oc-descricao").value.trim(),
    categoria: document.getElementById("categoria").value,
    prioridade: document.getElementById("prioridade").value,     // já em minúsculo (baixa/media/alta/urgente)
    anonimo: document.getElementById("oc-anonimo")?.checked || false,
    canal_prioridade_pedagogica: document.getElementById("oc-pedagogico")?.checked || false,
  };

  if (dados.titulo.length < 3) return toast("Informe um título com pelo menos 3 caracteres.", "erro");
  if (dados.descricao.length < 10) return toast("Informe uma descrição com pelo menos 10 caracteres.", "erro");

  btn.disabled = true;
  try {
    dados.imagem = file ? await lerImagemBase64(file) : null;
    const criado = await apiFetch("/api/chamados", { method: "POST", body: dados });
    toast(`${tipo ? "Postagem publicada!" : "Ocorrência registrada!"} Protocolo #${criado.protocolo}`, "sucesso");
    setTimeout(() => (window.location.href = `${paginaReclamacoes()}?id=${criado.id}`), 900);
  } catch (err) {
    toast(err.message, "erro");
    btn.disabled = false;
  }
}
