// Operações de equipamento sobre o save. Funções puras: retornam { save } ou { erro }.

import { MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";
import { podeEquipar, precoVenda } from "./itens";

export function heroisEmBatalha(save) {
  if (!save.batalha) return [];
  return Object.values(save.batalha.combatentes)
    .filter((c) => c.lado === "herois")
    .map((c) => c.refId);
}

export function idsEquipados(save) {
  return new Set(
    Object.values(save.herois).flatMap((h) => Object.values(h.equipamento).filter(Boolean)),
  );
}

export function equipamentosLivres(save) {
  const equipados = idsEquipados(save);
  return Object.values(save.inventario.equipamentos).filter((e) => !equipados.has(e.id));
}

export function donoDoEquipamento(save, equipamentoId) {
  return (
    Object.values(save.herois).find((h) =>
      Object.values(h.equipamento).includes(equipamentoId),
    ) || null
  );
}

function travado(save, heroiId) {
  return heroisEmBatalha(save).includes(heroiId)
    ? "Este herói está em uma batalha em andamento."
    : null;
}

export function equipar(save, heroiId, equipamentoId) {
  const heroi = save.herois[heroiId];
  const item = save.inventario.equipamentos[equipamentoId];
  if (!heroi || !item) return { erro: "Herói ou equipamento não encontrado." };
  const bloqueio = travado(save, heroiId);
  if (bloqueio) return { erro: bloqueio };
  if (!podeEquipar(heroi.classeId, item)) return { erro: "A classe deste herói não usa este equipamento." };

  const dono = donoDoEquipamento(save, equipamentoId);
  if (dono && dono.id !== heroiId) {
    const bloqueioDono = travado(save, dono.id);
    if (bloqueioDono) return { erro: bloqueioDono };
  }

  const herois = { ...save.herois };
  if (dono) {
    herois[dono.id] = { ...dono, equipamento: { ...dono.equipamento, [item.slot]: null } };
  }
  const atual = herois[heroiId];
  herois[heroiId] = { ...atual, equipamento: { ...atual.equipamento, [item.slot]: equipamentoId } };
  return { save: { ...save, herois } };
}

export function desequipar(save, heroiId, slot) {
  const heroi = save.herois[heroiId];
  if (!heroi?.equipamento[slot]) return { erro: "Não há nada equipado neste espaço." };
  const bloqueio = travado(save, heroiId);
  if (bloqueio) return { erro: bloqueio };
  if (equipamentosLivres(save).length >= MAX_EQUIPAMENTOS_INVENTARIO) {
    return { erro: "Inventário cheio. Venda algum equipamento antes." };
  }
  return {
    save: {
      ...save,
      herois: { ...save.herois, [heroiId]: { ...heroi, equipamento: { ...heroi.equipamento, [slot]: null } } },
    },
  };
}

export function venderEquipamento(save, equipamentoId) {
  const item = save.inventario.equipamentos[equipamentoId];
  if (!item) return { erro: "Equipamento não encontrado." };
  if (donoDoEquipamento(save, equipamentoId)) return { erro: "Desequipe o item antes de vender." };
  const equipamentos = { ...save.inventario.equipamentos };
  delete equipamentos[equipamentoId];
  return {
    save: {
      ...save,
      ouro: save.ouro + precoVenda(item),
      inventario: { ...save.inventario, equipamentos },
    },
  };
}
