// Expedições (SPEC.md §3.6, §4.10). O que cada zona rende está em zona.tabelaExpedicao.

export const DURACOES_EXPEDICAO_MINUTOS = [30, 60, 120, 240, 480];
export const MINUTOS_POR_ROLAGEM = 15;
export const OURO_POR_ROLAGEM_POR_ZONA = 3; // ouro por rolagem = este valor × (índice da zona + 1)
export const FRACAO_XP_EXPEDICAO = 0.5; // XP por rolagem = xpPorInimigo(nível médio da zona) × este valor
export const VAGAS_EXPEDICAO_INICIAIS = 1;
export const ZONAS_QUE_LIBERAM_VAGA_EXPEDICAO = ["costa", "fortaleza"]; // +1 vaga por chefe vencido
