// Itens empilháveis: consumíveis, materiais e ingredientes (SPEC.md §3.11 e §3.12)

import { materiais } from "./materiais";

const itensBase = {
  // ---------- Consumíveis ----------
  pocao_pequena: {
    id: "pocao_pequena",
    nome: "Poção Pequena",
    descricao: "Cura 40% da vida máxima.",
    categoria: "consumivel",
    usoEmBatalha: true,
    alvo: "aliado",
    efeito: { tipo: "curaPercentual", valor: 0.4 },
    preco: 30,
    empilhaAte: 99,
  },
  eter_menor: {
    id: "eter_menor",
    nome: "Éter Menor",
    descricao: "Restaura 30 de mana.",
    categoria: "consumivel",
    usoEmBatalha: true,
    alvo: "aliado",
    efeito: { tipo: "restaurarRecurso", recurso: "mana", valor: 30 },
    preco: 40,
    empilhaAte: 99,
  },
  tonico: {
    id: "tonico",
    nome: "Tônico",
    descricao: "Restaura 40 de vigor.",
    categoria: "consumivel",
    usoEmBatalha: true,
    alvo: "aliado",
    efeito: { tipo: "restaurarRecurso", recurso: "vigor", valor: 40 },
    preco: 30,
    empilhaAte: 99,
  },
  antidoto: {
    id: "antidoto",
    nome: "Antídoto",
    descricao: "Remove Veneno e Queimadura.",
    categoria: "consumivel",
    usoEmBatalha: true,
    alvo: "aliado",
    efeito: { tipo: "removerStatus", status: ["veneno", "queimadura"] },
    preco: 20,
    empilhaAte: 99,
  },

  erva_revigorante: {
    id: "erva_revigorante",
    nome: "Erva Revigorante",
    descricao: "Levanta um aliado caído com 25% da vida.",
    categoria: "consumivel",
    usoEmBatalha: true,
    alvo: "aliadoCaido",
    efeito: { tipo: "reviver", valor: 0.25 },
    preco: 120,
    empilhaAte: 99,
  },

  // ---------- Materiais e ingredientes do Cemitério (preco: referência, 10 × número da zona) ----------
  osso_antigo: {
    id: "osso_antigo",
    nome: "Osso Antigo",
    descricao: "Osso amarelado do Cemitério. Usado na ferraria.",
    categoria: "material",
    preco: 10,
    empilhaAte: 999,
  },
  pano_mortuario: {
    id: "pano_mortuario",
    nome: "Pano Mortuário",
    descricao: "Tecido velho e resistente.",
    categoria: "material",
    preco: 10,
    empilhaAte: 999,
  },

  // ---------- Ingredientes ----------
  erva_da_nevoa: {
    id: "erva_da_nevoa",
    nome: "Erva da Névoa",
    descricao: "Erva pálida que cresce entre as lápides.",
    categoria: "ingrediente",
    preco: 10,
    empilhaAte: 999,
  },
};

export const itens = { ...itensBase, ...materiais };
