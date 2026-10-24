// Inventário: equipamentos e entrada de itens. Funções puras: retornam { save } ou { erro }.

import { MAX_EQUIPAMENTOS_INVENTARIO, FRACAO_PRECO_VENDA } from "../data/constants";
import { itens as dadosItens } from "../data/itens";
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

export function precoVendaItem(itemId) {
  return Math.max(1, Math.floor((dadosItens[itemId]?.preco || 0) * FRACAO_PRECO_VENDA));
}

// Único caminho de entrada de itens no inventário (SPEC.md §4.8). Equipamentos ocupam 1 dos
// MAX_EQUIPAMENTOS_INVENTARIO espaços livres; empilháveis respeitam o limite da pilha (empilhaAte).
// O que não couber é vendido na hora pelo preço de venda.
// Retorna { save, guardados: { itens, equipamentos }, vendidos: { itens: [{ itemId, qtd, valor }],
// equipamentos: [{ item, valor }] }, ouroDasVendas }.
export function guardarNoInventario(save, { itens: novosItens = {}, equipamentos: novosEquipamentos = [] }) {
  const itens = { ...save.inventario.itens };
  const equipamentos = { ...save.inventario.equipamentos };
  const guardados = { itens: {}, equipamentos: [] };
  const vendidos = { itens: [], equipamentos: [] };

  for (const [itemId, qtd] of Object.entries(novosItens)) {
    const atual = itens[itemId] || 0;
    const cabe = Math.max(0, Math.min(qtd, (dadosItens[itemId]?.empilhaAte ?? Infinity) - atual));
    if (cabe > 0) {
      itens[itemId] = atual + cabe;
      guardados.itens[itemId] = cabe;
    }
    if (qtd > cabe) vendidos.itens.push({ itemId, qtd: qtd - cabe, valor: (qtd - cabe) * precoVendaItem(itemId) });
  }

  let livres = equipamentosLivres(save).length;
  for (const item of novosEquipamentos) {
    if (livres < MAX_EQUIPAMENTOS_INVENTARIO) {
      equipamentos[item.id] = item;
      guardados.equipamentos.push(item);
      livres += 1;
    } else {
      vendidos.equipamentos.push({ item, valor: precoVenda(item) });
    }
  }

  const ouroDasVendas = [...vendidos.itens, ...vendidos.equipamentos].reduce((s, v) => s + v.valor, 0);
  return {
    save: { ...save, ouro: save.ouro + ouroDasVendas, inventario: { ...save.inventario, itens, equipamentos } },
    guardados,
    vendidos,
    ouroDasVendas,
  };
}
