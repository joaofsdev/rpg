// Cadeia de migrações do save a partir da v2. Cada entrada converte da versão N para N+1
// e deve ser uma função pura com teste e fixture próprios.

import { VERSAO_SAVE, validarSave } from "./formato";

export const MIGRACOES = {
  // v2 → v3 (Fase 6): masmorraAtual ganhou vida, ganhos e fogueira. Nenhum save v2 tinha
  // masmorra em andamento, então basta normalizar o campo.
  2: (save) => ({ ...save, versao: 3, masmorraAtual: null }),

  // v3 → v4 (Fase 7): vagas de atividade passam a ser calculadas pelo progresso e a atividade
  // de cada herói passa a ser lida de save.atividades. Nenhum save v3 tinha atividades nem
  // recrutas, então os dois campos são normalizados.
  3: (save) => {
    const migrado = { ...save, versao: 4, herois: {}, atividades: {}, recrutas: null };
    delete migrado.vagas;
    for (const [id, heroi] of Object.entries(save.herois)) {
      migrado.herois[id] = { ...heroi };
      delete migrado.herois[id].atividade;
    }
    return migrado;
  },
};

export function migrarSave(save) {
  let atual = save;
  while (atual.versao < VERSAO_SAVE) {
    const migrar = MIGRACOES[atual.versao];
    if (!migrar) throw new Error(`Sem migração a partir da versão ${atual.versao}.`);
    atual = migrar(atual);
  }
  return atual;
}

// Lê um save serializado. Retorna { status: "ok", save } ou { status: "danificado", erro }.
export function carregarSave(texto) {
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    return { status: "danificado", erro: "JSON inválido." };
  }
  if (typeof dados?.versao !== "number") {
    return { status: "danificado", erro: "Save sem versão." };
  }
  if (dados.versao > VERSAO_SAVE) {
    return { status: "danificado", erro: "Save de uma versão mais nova do jogo." };
  }
  try {
    const save = migrarSave(dados);
    const erros = validarSave(save);
    if (erros.length > 0) return { status: "danificado", erro: erros.join(" ") };
    return { status: "ok", save };
  } catch (e) {
    return { status: "danificado", erro: e.message };
  }
}
