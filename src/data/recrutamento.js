// Mural de recrutas da taverna (SPEC.md §3.2)

export const DURACAO_MURAL_MS = 24 * 60 * 60 * 1000;
export const RECRUTAS_NO_MURAL = 3;
export const NIVEIS_ABAIXO_DO_GRUPO = 3; // nível do recruta: max(1, nível médio do grupo − este valor)

// custo = CUSTO_RECRUTA_BASE + CUSTO_RECRUTA_POR_NIVEL × nível do recruta
export const CUSTO_RECRUTA_BASE = 100;
export const CUSTO_RECRUTA_POR_NIVEL = 35;

// Classes que aparecem no mural. zonaId: o chefe dessa zona libera a classe (null = desde o início).
// Classes que o jogador já tem no save também aparecem, mesmo que ainda não liberadas.
export const CLASSES_RECRUTAVEIS = [
  { classeId: "cavaleiro", zonaId: null },
  { classeId: "arqueiro", zonaId: null },
  { classeId: "mago", zonaId: null },
  { classeId: "bardo", zonaId: "cemiterio" },
  { classeId: "assassino", zonaId: "minas" },
  { classeId: "barbaro", zonaId: "costa" },
];
