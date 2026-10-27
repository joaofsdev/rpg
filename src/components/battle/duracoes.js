// Durações da reprodução da batalha (SPEC.md §6.2). Ficam fora de exibicao.js para o Auto poder
// usá-las sem levar os dados de golpes e itens para o pacote inicial.

// Duração de cada evento em ms na velocidade 1×
const DURACAO = {
  rodadaIniciada: 250,
  turnoIniciado: 120,
  golpeUsado: 420,
  dano: 380,
  cura: 320,
  errou: 320,
  statusTick: 380,
  statusAplicado: 220,
  statusResistido: 220,
  nocaute: 560,
  defender: 300,
  itemUsado: 320,
  reviveu: 420,
  turnoPerdido: 450,
  afinidadeDescoberta: 200,
  fimBatalha: 400,
};

export const PAUSA_ENTRE_ACOES_MS = 200;

export function duracaoEvento(evento, velocidade = 1) {
  return (DURACAO[evento.tipo] ?? 0) / velocidade;
}

// Quanto a reprodução de uma fila leva (useReproducao): a duração de cada evento mais a pausa
// depois de cada golpe ou item. O Auto usa isso para manter o mesmo ritmo com a página oculta.
export function duracaoDaFila(eventos, velocidade = 1) {
  return eventos.reduce(
    (total, e) =>
      total + duracaoEvento(e, velocidade) + (e.tipo === "golpeUsado" || e.tipo === "itemUsado" ? PAUSA_ENTRE_ACOES_MS / velocidade : 0),
    0,
  );
}
