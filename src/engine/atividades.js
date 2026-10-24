// Base das atividades por tempo real (SPEC.md §3.9, §4.10, §5.2). Uma atividade guarda só
// timestamps (inicio, duracao): o progresso é sempre recalculado a partir de `agora`, então nada
// depende da aba ficar aberta. Use relogio() (engine/relogio.js) para obter `agora`.

export const TIPOS_TREINO = ["treinoAtributo", "treinoGolpe"];

export function decorrido(atividade, agora) {
  return Math.max(0, Math.min(atividade.duracao, agora - atividade.inicio));
}

export function fimDaAtividade(atividade) {
  return atividade.inicio + atividade.duracao;
}

export function atividadeConcluida(atividade, agora) {
  return decorrido(atividade, agora) >= atividade.duracao;
}

export function tempoRestante(atividade, agora) {
  return atividade.duracao - decorrido(atividade, agora);
}

export function listarAtividades(save, tipos) {
  const todas = Object.values(save.atividades);
  return tipos ? todas.filter((a) => tipos.includes(a.tipo)) : todas;
}

export function atividadeDoHeroi(save, heroiId) {
  return listarAtividades(save).find((a) => a.heroiId === heroiId) ?? null;
}

export function heroiOcupado(save, heroiId) {
  return atividadeDoHeroi(save, heroiId) !== null;
}

export function adicionarAtividade(save, atividade) {
  return { ...save, atividades: { ...save.atividades, [atividade.id]: atividade } };
}

export function removerAtividade(save, id) {
  const atividades = { ...save.atividades };
  delete atividades[id];
  return { ...save, atividades };
}
