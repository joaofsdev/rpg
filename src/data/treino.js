// Treino no quartel (SPEC.md §3.8). Duração e custo do treino de golpe ficam em cada golpe.

export const DURACOES_TREINO_HORAS = [1, 2, 4, 8];
export const CUSTO_TREINO_POR_NIVEL_HORA = 7; // ouro = este valor × nível × horas
export const VAGAS_TREINO_INICIAIS = 1;
export const ZONAS_QUE_LIBERAM_VAGA_TREINO = ["planicie_mortos"]; // +1 vaga por chefe vencido
export const NIVEIS_ANTECIPADOS_GOLPE = 5; // golpe com nível exigido ≤ nível do herói + este valor
