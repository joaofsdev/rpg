// Coletar, cancelar e resumo de retorno das atividades (SPEC.md §3.6, §3.8, §3.9).
// Cada tipo de atividade registra aqui a função que a encerra.

import { atividadeConcluida, fimDaAtividade, listarAtividades, tempoRestante } from "./atividades";
import { encerrarTreino } from "./treino";
import { encerrarExpedicao } from "./expedicoes";
import { encerrarPreparo } from "./cozinha";

const ENCERRAR = {
  treinoAtributo: encerrarTreino,
  treinoGolpe: encerrarTreino,
  expedicao: encerrarExpedicao,
  cozinha: encerrarPreparo,
};

// Só atividades concluídas. Coletar de novo a mesma atividade não entrega nada (ela já saiu do save).
export function coletarAtividade(save, id, agora) {
  const atividade = save.atividades[id];
  if (!atividade) return { erro: "Esta atividade já foi coletada." };
  if (!atividadeConcluida(atividade, agora)) return { erro: "Esta atividade ainda não terminou." };
  return ENCERRAR[atividade.tipo](save, atividade, agora);
}

// Encerra antes do fim: entrega o que já foi completado e não devolve o custo
export function cancelarAtividade(save, id, agora) {
  const atividade = save.atividades[id];
  if (!atividade) return { erro: "Esta atividade já terminou." };
  return ENCERRAR[atividade.tipo](save, atividade, agora);
}

// O que a atividade entregaria se fosse encerrada agora, sem alterar o save
export function previaDoGanho(save, atividade, agora) {
  return ENCERRAR[atividade.tipo](save, atividade, agora).ganho;
}

export function atividadesConcluidas(save, agora) {
  return listarAtividades(save).filter((a) => atividadeConcluida(a, agora));
}

// Retorna { save, ganhos } com tudo o que estava pronto
export function coletarTudo(save, agora) {
  let atual = save;
  const ganhos = [];
  for (const atividade of atividadesConcluidas(save, agora)) {
    const resultado = ENCERRAR[atividade.tipo](atual, atividade, agora);
    atual = resultado.save;
    ganhos.push(resultado.ganho);
  }
  return { save: atual, ganhos };
}

// Atividades que terminaram no intervalo (desde, agora]: o que ficou pronto enquanto o jogador estava fora
export function concluidasDesde(save, desde, agora) {
  return atividadesConcluidas(save, agora).filter((a) => fimDaAtividade(a) > desde);
}

// Conteúdo do modal "Bem-vindo de volta"
export function resumoDoRetorno(save, agora) {
  const todas = listarAtividades(save).sort((a, b) => fimDaAtividade(a) - fimDaAtividade(b));
  return {
    concluidas: todas.filter((a) => atividadeConcluida(a, agora)),
    emAndamento: todas
      .filter((a) => !atividadeConcluida(a, agora))
      .map((atividade) => ({ atividade, restante: tempoRestante(atividade, agora) })),
  };
}
