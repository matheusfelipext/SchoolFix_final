/* grade.js — Grade de horários (aluno) / Grade de aulas (professor).
   A tabela vem pronta no HTML; aqui só destacamos o dia de hoje (coluna) e,
   se estiver dentro de um horário de aula, a faixa em andamento (linha). */

document.addEventListener("DOMContentLoaded", () => {
  const tabela = document.querySelector("table");
  if (!tabela) return;
  const agora = new Date();
  const dia = agora.getDay();                       // 0 = domingo ... 6 = sábado
  const aviso = document.getElementById("grade-hoje");
  const nomesDia = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

  if (dia < 1 || dia > 5) {
    if (aviso) aviso.textContent = `Hoje é ${nomesDia[dia]} — sem aulas na grade.`;
    return;
  }
  // coluna 0 = horário; segunda = coluna 1 ... sexta = coluna 5
  tabela.querySelectorAll("tr").forEach((tr) => {
    const cel = tr.children[dia];
    if (cel) cel.classList.add("col-hoje");
  });
  if (aviso) aviso.textContent = `Hoje é ${nomesDia[dia]} — a coluna destacada é o seu dia.`;

  // "19h00 – 20h40" → minutos desde 00:00
  const minutos = (h, m) => Number(h) * 60 + Number(m);
  const agoraMin = minutos(agora.getHours(), agora.getMinutes());
  tabela.querySelectorAll("tbody tr").forEach((tr) => {
    const m = tr.querySelector("th")?.textContent.match(/(\d{1,2})h(\d{2}).*?(\d{1,2})h(\d{2})/);
    if (!m) return;
    if (agoraMin >= minutos(m[1], m[2]) && agoraMin <= minutos(m[3], m[4])) {
      tr.classList.add("faixa-agora");
      if (aviso) aviso.textContent += " Aula em andamento agora.";
    }
  });
});
