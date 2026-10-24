// IA dos inimigos (SPEC.md §3.1.1): regras de exceção + padrão em ciclo.
// Determinística para o mesmo estado e a mesma semente.

import { inimigos } from "../data/inimigos";
import { golpes } from "../data/golpes";
import { escolher } from "./rng";
import { temStatus } from "./status";

function percentualHp(c) {
  return (c.hpAtual / c.hpMax) * 100;
}

function vivosDoLado(batalha, lado) {
  return Object.values(batalha.combatentes)
    .filter((c) => c.lado === lado && !c.nocauteado)
    .sort((a, b) => a.posicao - b.posicao);
}

function ladoOposto(lado) {
  return lado === "herois" ? "inimigos" : "herois";
}

function condicaoValida(condicao, { batalha, inimigo, golpeId, rodadaDaAcao }) {
  switch (condicao.tipo) {
    case "hpProprioAbaixo":
      return percentualHp(inimigo) < condicao.valor;
    case "aliadoAbaixo":
      return vivosDoLado(batalha, inimigo.lado).some(
        (c) => c.id !== inimigo.id && percentualHp(c) < condicao.valor,
      );
    case "rodadaMultiplaDe":
      return rodadaDaAcao % condicao.valor === 0;
    case "semUsarHa": {
      const ultimoUso = inimigo.historicoIa[golpeId];
      return ultimoUso === undefined || inimigo.turnosAgidos - ultimoUso >= condicao.valor;
    }
    default:
      return false;
  }
}

function escolherPorRegra(regra, vivos, rng) {
  switch (regra) {
    case "menorHp":
      return vivos.reduce((menor, c) => (percentualHp(c) < percentualHp(menor) ? c : menor));
    case "maiorHp":
      return vivos.reduce((maior, c) => (percentualHp(c) > percentualHp(maior) ? c : maior));
    case "primeiro":
      return vivos[0];
    default:
      return escolher(rng, vivos);
  }
}

// Alvos de um golpe usado por um inimigo
export function resolverAlvosIa(batalha, inimigo, golpe, rng) {
  const oponentes = vivosDoLado(batalha, ladoOposto(inimigo.lado));
  const aliados = vivosDoLado(batalha, inimigo.lado);

  switch (golpe.alvo) {
    case "proprio":
      return [inimigo.id];
    case "todosInimigos":
      return oponentes.map((c) => c.id);
    case "todosAliados":
      return aliados.map((c) => c.id);
    case "aliado":
      return aliados.length ? [escolherPorRegra("menorHp", aliados, rng).id] : [];
    default: {
      if (oponentes.length === 0) return [];
      const provocador = oponentes.find((c) => temStatus(c, "provocacao"));
      if (provocador) return [provocador.id];
      return [escolherPorRegra(golpe.alvoIa, oponentes, rng).id];
    }
  }
}

export function escolherIntencao(batalha, inimigo, rng, rodadaDaAcao) {
  const dados = inimigos[inimigo.refId];
  const contexto = { batalha, inimigo, rodadaDaAcao };

  let golpeId = null;
  let origem = "padrao";
  for (const regra of dados.ia.regras || []) {
    const valida = regra.se.every((c) =>
      condicaoValida(c, { ...contexto, golpeId: regra.golpeId }),
    );
    if (valida) {
      golpeId = regra.golpeId;
      origem = "regra";
      break;
    }
  }
  if (!golpeId) golpeId = dados.ia.padrao[inimigo.cicloIa % dados.ia.padrao.length];

  const golpe = golpes[golpeId];
  return {
    golpeId,
    alvos: resolverAlvosIa(batalha, inimigo, golpe, rng),
    origem,
    telegrafado: Boolean(golpe.telegrafado),
  };
}
