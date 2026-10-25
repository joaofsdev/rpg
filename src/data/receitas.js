// Cozinha da taverna (SPEC.md §3.7). Cada receita gera porções de uma refeição (src/data/refeicoes.js).
//
// efeito.tipo: vidaMax (fração) · ataque (força e magia, fração) · defesa (defesa e resistência,
//              fração) · recursoInicial (vigor inicial; para mana, máximo e atual) · xp (fração) ·
//              ouro (fração)
// inicial: conhecida desde o começo. zonaId: o chefe dessa zona ensina a receita na primeira vitória;
// a loja também a vende (uma por semana) depois que a zona é desbloqueada.

export const VAGAS_COZINHA = 1; // panelas
export const PORCOES_MAX = 5;
export const DURACAO_ROTACAO_RECEITA_MS = 7 * 24 * 60 * 60 * 1000;
export const PRECO_RECEITA_POR_ZONA = 150; // preço na loja = este valor × número da zona

export const receitas = {
  ensopado_do_coveiro: {
    id: "ensopado_do_coveiro",
    nome: "Ensopado do Coveiro",
    ingredientes: [{ itemId: "erva_da_nevoa", qtd: 2 }],
    minutos: 10,
    resultado: "ensopado_do_coveiro",
    efeito: { tipo: "vidaMax", valor: 0.1 },
    duracaoEncontros: 5,
    inicial: true,
  },
  caldo_de_cogumelo: {
    id: "caldo_de_cogumelo",
    nome: "Caldo de Cogumelo",
    ingredientes: [{ itemId: "cogumelo_da_caverna", qtd: 2 }],
    minutos: 20,
    resultado: "caldo_de_cogumelo",
    efeito: { tipo: "recursoInicial", valor: 20 },
    duracaoEncontros: 6,
    inicial: true,
  },
  sopa_de_alga: {
    id: "sopa_de_alga",
    nome: "Sopa de Alga",
    ingredientes: [
      { itemId: "alga_salgada", qtd: 1 },
      { itemId: "erva_da_nevoa", qtd: 1 },
    ],
    minutos: 15,
    resultado: "sopa_de_alga",
    efeito: { tipo: "xp", valor: 0.15 },
    duracaoEncontros: 5,
    inicial: true,
  },
  ensopado_de_raiz: {
    id: "ensopado_de_raiz",
    nome: "Ensopado de Raiz Pálida",
    ingredientes: [
      { itemId: "raiz_palida", qtd: 2 },
      { itemId: "erva_da_nevoa", qtd: 1 },
    ],
    minutos: 20,
    resultado: "ensopado_de_raiz",
    efeito: { tipo: "defesa", valor: 0.1 },
    duracaoEncontros: 6,
    zonaId: "planicie_mortos",
  },
  caldo_de_cogumelo_azul: {
    id: "caldo_de_cogumelo_azul",
    nome: "Caldo de Cogumelo Azul",
    ingredientes: [{ itemId: "cogumelo_azul", qtd: 2 }],
    minutos: 20,
    resultado: "caldo_de_cogumelo_azul",
    efeito: { tipo: "ataque", valor: 0.1 },
    duracaoEncontros: 6,
    zonaId: "abismo",
  },
  pao_de_trigo: {
    id: "pao_de_trigo",
    nome: "Pão de Trigo",
    ingredientes: [{ itemId: "trigo", qtd: 2 }],
    minutos: 25,
    resultado: "pao_de_trigo",
    efeito: { tipo: "vidaMax", valor: 0.15 },
    duracaoEncontros: 6,
    zonaId: "fortaleza",
  },
  ensopado_picante: {
    id: "ensopado_picante",
    nome: "Ensopado Picante",
    ingredientes: [
      { itemId: "pimenta_de_fogo", qtd: 1 },
      { itemId: "trigo", qtd: 1 },
    ],
    minutos: 25,
    resultado: "ensopado_picante",
    efeito: { tipo: "ataque", valor: 0.15 },
    duracaoEncontros: 6,
    zonaId: "vulcao",
  },
  pao_de_mel: {
    id: "pao_de_mel",
    nome: "Pão de Mel da Estrada",
    ingredientes: [
      { itemId: "trigo", qtd: 1 },
      { itemId: "mel_selvagem", qtd: 1 },
    ],
    minutos: 30,
    resultado: "pao_de_mel",
    efeito: { tipo: "xp", valor: 0.25 },
    duracaoEncontros: 6,
    zonaId: "deserto_infernal",
  },
  compota_luminosa: {
    id: "compota_luminosa",
    nome: "Compota Luminosa",
    ingredientes: [{ itemId: "fruta_luminosa", qtd: 2 }],
    minutos: 30,
    resultado: "compota_luminosa",
    efeito: { tipo: "ouro", valor: 0.25 },
    duracaoEncontros: 8,
    zonaId: "floresta_arcana",
  },
  banquete_do_vazio: {
    id: "banquete_do_vazio",
    nome: "Banquete do Vazio",
    ingredientes: [
      { itemId: "flor_do_vazio", qtd: 1 },
      { itemId: "fruta_luminosa", qtd: 1 },
      { itemId: "mel_selvagem", qtd: 1 },
    ],
    minutos: 40,
    resultado: "banquete_do_vazio",
    efeito: { tipo: "recursoInicial", valor: 40 },
    duracaoEncontros: 8,
    zonaId: "campos_caos",
  },
};

export function receitaDoPrato(itemId) {
  return Object.values(receitas).find((r) => r.resultado === itemId) ?? null;
}
