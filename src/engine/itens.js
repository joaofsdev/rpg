// Geração de equipamentos, drops e preços (SPEC.md §4.8)

import { classesHeroi } from "../data/classesHeroi";
import {
  multiplicadorRaridade,
  multiplicadorPreco,
  tabelaRaridade,
  prefixosPorRaridade,
  materiais,
  nomesArmas,
  nomesArmaduras,
  TIPOS_ARMA,
  TIPOS_ARMA_MAGICA,
  PESOS_ARMADURA,
  RARIDADES,
} from "../data/equipamentos";
import {
  SLOTS_EQUIPAMENTO,
  CHANCE_DROP_COMPATIVEL,
  FRACAO_PRECO_VENDA,
} from "../data/constants";
import { escolher, inteiro, chance, gerarId } from "./rng";

const SLOTS_ARMADURA = SLOTS_EQUIPAMENTO.filter((s) => s !== "arma");

// Concorda o adjetivo (masculino singular) com o nome base: m, f, mp ou fp
export function flexionar(adjetivo, forma) {
  if (adjetivo === "Simples") return adjetivo;
  let palavra = forma.startsWith("f") && adjetivo.endsWith("o") ? adjetivo.slice(0, -1) + "a" : adjetivo;
  if (forma.endsWith("p")) palavra = palavra.endsWith("al") ? palavra.slice(0, -2) + "ais" : palavra + "s";
  return palavra;
}

function nomearEquipamento(rng, base, raridade) {
  const prefixo = escolher(rng, prefixosPorRaridade[raridade]);
  const material = escolher(rng, materiais);
  const [nomeBase, forma] = escolher(rng, base);
  return `${nomeBase} ${flexionar(prefixo, forma)} de ${material}`;
}

function bonusVazio() {
  return { vida: 0, forca: 0, magia: 0, defesa: 0, resistencia: 0, velocidade: 0 };
}

function gerarBonusArma(rng, nivel, raridade, tipoArma) {
  const mult = multiplicadorRaridade[raridade];
  const base = Math.max(1, Math.floor(nivel * 0.5));
  const bonus = bonusVazio();
  const principal = TIPOS_ARMA_MAGICA.includes(tipoArma) ? "magia" : "forca";
  bonus[principal] = Math.floor(inteiro(rng, Math.ceil(base * 0.7), base * 2) * mult);
  if (chance(rng, 0.3)) bonus.vida = Math.floor(inteiro(rng, 1, Math.ceil(base * 0.5)) * mult);
  bonus.velocidade = Math.floor(inteiro(rng, 0, Math.ceil(base * 0.4)) * mult);
  return bonus;
}

function gerarBonusArmadura(rng, nivel, raridade) {
  const mult = multiplicadorRaridade[raridade];
  const base = Math.max(1, Math.floor(nivel * 0.5));
  const bonus = bonusVazio();
  bonus.vida = Math.floor(inteiro(rng, 0, base * 2) * mult);
  bonus.defesa = Math.floor(inteiro(rng, 0, base) * mult);
  bonus.resistencia = Math.floor(inteiro(rng, 0, base) * mult);
  bonus.velocidade = Math.floor(inteiro(rng, 0, Math.ceil(base * 0.7)) * mult);
  return bonus;
}

export function gerarEquipamento(rng, { nivel, raridade, slot, tipoArma, pesoArmadura }) {
  const nivelItem = Math.max(1, nivel + inteiro(rng, -2, 2));

  if (slot === "arma") {
    const nome = nomearEquipamento(rng, nomesArmas[tipoArma], raridade);
    return {
      id: gerarId(rng),
      nome,
      slot,
      tipoArma,
      raridade,
      nivel: nivelItem,
      bonus: gerarBonusArma(rng, nivel, raridade, tipoArma),
      aprimoramento: 0,
    };
  }

  const nome = nomearEquipamento(rng, nomesArmaduras[slot][pesoArmadura], raridade);
  return {
    id: gerarId(rng),
    nome,
    slot,
    pesoArmadura,
    raridade,
    nivel: nivelItem,
    bonus: gerarBonusArmadura(rng, nivel, raridade),
    aprimoramento: 0,
  };
}

export function sortearRaridade(rng, chefe = false) {
  const r = rng.proximo() * 100;
  const tabela = chefe ? tabelaRaridade.chefe : tabelaRaridade.comum;
  return tabela.find((faixa) => r < faixa.ate).raridade;
}

export function raridadeMinima(raridade, minima) {
  return RARIDADES.indexOf(raridade) < RARIDADES.indexOf(minima) ? minima : raridade;
}

// Escolhe slot e tipo. Com CHANCE_DROP_COMPATIVEL (ou sempre, se pedido), o tipo é usável por
// uma das classes informadas.
export function sortearTipoEquipamento(rng, classeIds = [], sempreCompativel = false) {
  const slot = escolher(rng, SLOTS_EQUIPAMENTO);
  const compativel = classeIds.length > 0 && (sempreCompativel || chance(rng, CHANCE_DROP_COMPATIVEL));
  const classe = compativel ? classesHeroi[escolher(rng, classeIds)] : null;

  if (slot === "arma") {
    return { slot, tipoArma: escolher(rng, classe ? classe.armasPermitidas : TIPOS_ARMA) };
  }
  return {
    slot,
    pesoArmadura: escolher(rng, classe ? classe.armadurasPermitidas : PESOS_ARMADURA),
  };
}

export function sortearEquipamento(rng, { nivel, chefe = false, classeIds = [], raridadeMin, sempreCompativel = false }) {
  let raridade = sortearRaridade(rng, chefe);
  if (raridadeMin) raridade = raridadeMinima(raridade, raridadeMin);
  return gerarEquipamento(rng, { nivel, raridade, ...sortearTipoEquipamento(rng, classeIds, sempreCompativel) });
}

// Conjunto Comum completo e compatível com a classe (companheiro, recruta)
export function conjuntoComum(rng, classeId, nivel) {
  const classe = classesHeroi[classeId];
  const peso = classe.armadurasPermitidas[0];
  const itens = SLOTS_ARMADURA.map((slot) =>
    gerarEquipamento(rng, { nivel, raridade: "Comum", slot, pesoArmadura: peso }),
  );
  itens.push(
    gerarEquipamento(rng, {
      nivel,
      raridade: "Comum",
      slot: "arma",
      tipoArma: classe.armasPermitidas[0],
    }),
  );
  return itens;
}

export function podeEquipar(classeId, equipamento) {
  const classe = classesHeroi[classeId];
  if (equipamento.slot === "arma") return classe.armasPermitidas.includes(equipamento.tipoArma);
  if (!equipamento.pesoArmadura) return true;
  return classe.armadurasPermitidas.includes(equipamento.pesoArmadura);
}

export function precoCompra(equipamento) {
  const base = 50 + equipamento.nivel * 8;
  return Math.floor(base * (multiplicadorPreco[equipamento.raridade] || 1));
}

export function precoVenda(equipamento) {
  return Math.max(1, Math.floor(precoCompra(equipamento) * FRACAO_PRECO_VENDA));
}
