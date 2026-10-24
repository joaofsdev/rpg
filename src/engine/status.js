// Regras de status (SPEC.md §4.5). As funções que alteram recebem um combatente que
// pertence a um rascunho da batalha (já clonado em combate.js) e o modificam no lugar.

import { status as dadosStatus } from "../data/status";

export function obterStatus(combatente, statusId) {
  return combatente.status.find((s) => s.statusId === statusId) || null;
}

export function temStatus(combatente, statusId) {
  return obterStatus(combatente, statusId) !== null;
}

// Retorna { aplicado, motivo? }
export function aplicarStatus(combatente, efeito, turnoGlobal, imunidades = []) {
  const { statusId } = efeito;
  const definicao = dadosStatus[statusId];

  if (imunidades.includes(statusId)) return { aplicado: false, motivo: "imune" };
  if (statusId === "atordoado" && temStatus(combatente, "imune_atordoado")) {
    return { aplicado: false, motivo: "firme" };
  }

  const turnos = efeito.turnos ?? definicao.turnos;

  if (statusId === "modificador") {
    combatente.status.push({
      statusId,
      atributo: efeito.atributo,
      valor: efeito.valor,
      turnos,
      aplicadoEm: turnoGlobal,
    });
    return { aplicado: true };
  }

  const existente = obterStatus(combatente, statusId);
  if (existente) {
    if (definicao.maxAcumulos) {
      existente.acumulos = Math.min(definicao.maxAcumulos, existente.acumulos + 1);
    }
    existente.turnos = Math.max(existente.turnos, turnos);
    existente.aplicadoEm = turnoGlobal;
    return { aplicado: true };
  }

  combatente.status.push({ statusId, turnos, acumulos: 1, aplicadoEm: turnoGlobal });
  return { aplicado: true };
}

export function removerStatus(combatente, statusIds) {
  const removidos = combatente.status.filter((s) => statusIds.includes(s.statusId));
  combatente.status = combatente.status.filter((s) => !statusIds.includes(s.statusId));
  return removidos.map((s) => s.statusId);
}

// Dano e cura de status no início do turno. Retorna [{ statusId, valor }],
// valor negativo = dano, positivo = cura.
export function processarInicioTurno(combatente) {
  const ticks = [];
  for (const s of combatente.status) {
    const definicao = dadosStatus[s.statusId];
    if (definicao.tipo === "dano") {
      const valor = Math.max(1, Math.floor(combatente.hpMax * definicao.percentual * s.acumulos));
      combatente.hpAtual = Math.max(0, combatente.hpAtual - valor);
      ticks.push({ statusId: s.statusId, valor: -valor });
    } else if (definicao.tipo === "cura") {
      const valor = Math.max(1, Math.floor(combatente.hpMax * definicao.percentual));
      combatente.hpAtual = Math.min(combatente.hpMax, combatente.hpAtual + valor);
      ticks.push({ statusId: s.statusId, valor });
    }
    if (combatente.hpAtual <= 0) break;
  }
  return ticks;
}

// Diminui a duração no fim do turno do afetado. Status aplicados neste mesmo turno
// não são descontados. Retorna os ids removidos.
export function processarFimTurno(combatente, turnoGlobal) {
  const removidos = [];
  const restantes = [];
  for (const s of combatente.status) {
    if (s.aplicadoEm !== turnoGlobal) s.turnos -= 1;
    if (s.turnos > 0) restantes.push(s);
    else removidos.push(s.statusId);
  }
  combatente.status = restantes;

  if (removidos.includes("atordoado")) {
    combatente.status.push({
      statusId: "imune_atordoado",
      turnos: dadosStatus.atordoado.imunidadeTurnos,
      acumulos: 1,
      aplicadoEm: turnoGlobal,
    });
  }
  return removidos;
}

export function somaModificadores(combatente, atributo) {
  return combatente.status
    .filter((s) => s.statusId === "modificador" && s.atributo === atributo)
    .reduce((soma, s) => soma + s.valor, 0);
}

export function atributoEfetivo(combatente, atributo) {
  return Math.max(0, combatente.atributos[atributo] + somaModificadores(combatente, atributo));
}

export function velocidadeEfetiva(combatente) {
  const lentidao = temStatus(combatente, "lentidao") ? dadosStatus.lentidao.multVelocidade : 1;
  return atributoEfetivo(combatente, "velocidade") * lentidao;
}

export function multDanoCausado(combatente) {
  return temStatus(combatente, "fraqueza") ? dadosStatus.fraqueza.multDano : 1;
}

export function multDanoRecebido(combatente) {
  return temStatus(combatente, "protecao") ? dadosStatus.protecao.multDano : 1;
}
