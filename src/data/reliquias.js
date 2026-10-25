// Relíquias (SPEC.md §3.11): 1 por chefe de zona. Não se equipam: ter a relíquia já ativa o efeito
// para o grupo inteiro, em toda batalha.
//
// efeito.tipo: danoElemento (elemento, fração) · vidaMax · ataque · defesa (frações, como as
//              refeições) · xp · ouro (frações das recompensas)

export const CHANCE_RELIQUIA_REVANCHE = 0.05; // depois da primeira vitória, enquanto não tiver a relíquia

export const reliquias = {
  coroa_do_guardiao: {
    id: "coroa_do_guardiao",
    nome: "Coroa do Guardião",
    zonaId: "cemiterio",
    efeito: { tipo: "danoElemento", elemento: "luz", valor: 0.1 },
  },
  coracao_de_pedra: {
    id: "coracao_de_pedra",
    nome: "Coração de Pedra",
    zonaId: "minas",
    efeito: { tipo: "vidaMax", valor: 0.05 },
  },
  escama_do_leviata: {
    id: "escama_do_leviata",
    nome: "Escama do Leviatã",
    zonaId: "costa",
    efeito: { tipo: "danoElemento", elemento: "gelo", valor: 0.1 },
  },
  cetro_dos_mortos: {
    id: "cetro_dos_mortos",
    nome: "Cetro dos Mortos",
    zonaId: "planicie_mortos",
    efeito: { tipo: "danoElemento", elemento: "sombra", valor: 0.1 },
  },
  olho_do_devorador: {
    id: "olho_do_devorador",
    nome: "Olho do Devorador",
    zonaId: "abismo",
    efeito: { tipo: "xp", valor: 0.1 },
  },
  estandarte_do_general: {
    id: "estandarte_do_general",
    nome: "Estandarte do General",
    zonaId: "fortaleza",
    efeito: { tipo: "ataque", valor: 0.05 },
  },
  brasa_eterna: {
    id: "brasa_eterna",
    nome: "Brasa Eterna",
    zonaId: "vulcao",
    efeito: { tipo: "danoElemento", elemento: "fogo", valor: 0.1 },
  },
  chifre_do_principe: {
    id: "chifre_do_principe",
    nome: "Chifre do Príncipe",
    zonaId: "deserto_infernal",
    efeito: { tipo: "ouro", valor: 0.1 },
  },
  pena_do_arauto: {
    id: "pena_do_arauto",
    nome: "Pena do Arauto",
    zonaId: "floresta_arcana",
    efeito: { tipo: "danoElemento", elemento: "raio", valor: 0.1 },
  },
  fragmento_primordial: {
    id: "fragmento_primordial",
    nome: "Fragmento Primordial",
    zonaId: "campos_caos",
    efeito: { tipo: "defesa", valor: 0.05 },
  },
};

export function reliquiaDaZona(zonaId) {
  return Object.values(reliquias).find((r) => r.zonaId === zonaId) ?? null;
}
