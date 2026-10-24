import { classesHeroi } from "../data/classesHeroi";
import {
  ATRIBUTOS,
  TAXA_PONTO,
  CRESCIMENTO_HEROI,
  CRESCIMENTO_INIMIGO,
  CRESCIMENTO_CHEFE,
  MULT_APRIMORAMENTO,
  SLOTS_EQUIPAMENTO,
} from "../data/constants";

function escalar(base, nivel, crescimento) {
  return Math.floor(base * (1 + crescimento * (nivel - 1)));
}

export function escalarHeroi(base, nivel) {
  return escalar(base, nivel, CRESCIMENTO_HEROI);
}

export function escalarInimigo(base, nivel) {
  return escalar(base, nivel, CRESCIMENTO_INIMIGO);
}

export function escalarChefe(base, nivel) {
  return escalar(base, nivel, CRESCIMENTO_CHEFE);
}

export function bonusDoEquipamento(equipamento) {
  const mult = 1 + MULT_APRIMORAMENTO * (equipamento.aprimoramento || 0);
  const bonus = {};
  for (const atributo of ATRIBUTOS) {
    bonus[atributo] = Math.floor((equipamento.bonus?.[atributo] || 0) * mult);
  }
  return bonus;
}

// Atributos finais de um herói fora de batalha (SPEC.md §4.1)
export function calcularAtributosHeroi(heroi, equipamentosPorId = {}) {
  const classe = classesHeroi[heroi.classeId];
  const pontos = (atributo) =>
    (heroi.pontosNivel?.[atributo] || 0) + (heroi.pontosTreino?.[atributo] || 0);

  const resultado = {};
  for (const atributo of ATRIBUTOS) {
    resultado[atributo] =
      escalarHeroi(classe.atributosBase[atributo], heroi.nivel) +
      TAXA_PONTO[atributo] * pontos(atributo);
  }

  for (const slot of SLOTS_EQUIPAMENTO) {
    const id = heroi.equipamento?.[slot];
    const equipamento = id ? equipamentosPorId[id] : null;
    if (!equipamento) continue;
    const bonus = bonusDoEquipamento(equipamento);
    for (const atributo of ATRIBUTOS) resultado[atributo] += bonus[atributo];
  }

  resultado.manaMax =
    classe.recurso === "mana"
      ? escalarHeroi(classe.manaBase, heroi.nivel) + TAXA_PONTO.manaMax * pontos("manaMax")
      : null;

  return resultado;
}

export function calcularAtributosInimigo(dadosInimigo, nivel) {
  const escala = dadosInimigo.chefe ? escalarChefe : escalarInimigo;
  const resultado = {};
  for (const atributo of ATRIBUTOS) {
    resultado[atributo] = escala(dadosInimigo.atributosBase[atributo], nivel);
  }
  return resultado;
}
