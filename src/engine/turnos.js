import { velocidadeEfetiva } from "./status";

// Ordem de turnos de uma rodada (SPEC.md §3.1 regra 1). Sem aleatoriedade.
// Desempate: maior velocidade base → heróis antes de inimigos → posição.
export function calcularOrdem(combatentes) {
  return Object.values(combatentes)
    .filter((c) => !c.nocauteado)
    .sort((a, b) => {
      const diferenca = velocidadeEfetiva(b) - velocidadeEfetiva(a);
      if (diferenca !== 0) return diferenca;
      const base = b.atributos.velocidade - a.atributos.velocidade;
      if (base !== 0) return base;
      if (a.lado !== b.lado) return a.lado === "herois" ? -1 : 1;
      return a.posicao - b.posicao;
    })
    .map((c) => c.id);
}
