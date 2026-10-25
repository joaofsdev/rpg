// Coleção (SPEC.md §3.10): o que o jogador já obteve, mesmo que tenha vendido depois.
// Equipamentos contam por tipo (slot + tipo de arma ou peso de armadura) × raridade.

import { itens } from "../data/itens";
import { reliquias } from "../data/reliquias";
import { RARIDADES, TIPOS_ARMA, PESOS_ARMADURA } from "../data/equipamentos";
import { SLOTS_EQUIPAMENTO } from "../data/constants";

// "arma:espada", "peitoral:pesada"
export function chaveDoEquipamento(equipamento) {
  return equipamento.slot === "arma" ? `arma:${equipamento.tipoArma}` : `${equipamento.slot}:${equipamento.pesoArmadura}`;
}

// Todas as chaves de equipamento possíveis, na ordem exibida
export function chavesDeEquipamento() {
  const armaduras = SLOTS_EQUIPAMENTO.filter((s) => s !== "arma").flatMap((slot) => PESOS_ARMADURA.map((p) => `${slot}:${p}`));
  return [...TIPOS_ARMA.map((t) => `arma:${t}`), ...armaduras];
}

// Registra equipamentos e itens empilháveis ({ [itemId]: qtd } ou [itemId]). Devolve o mesmo save
// quando nada é novo.
export function registrarNaColecao(save, { equipamentos = [], itens: novos = [] } = {}) {
  const colecao = save.colecao;
  let porTipo = colecao.equipamentos;
  for (const e of equipamentos) {
    const chave = chaveDoEquipamento(e);
    const vistas = porTipo[chave] || [];
    if (!vistas.includes(e.raridade)) porTipo = { ...porTipo, [chave]: [...vistas, e.raridade] };
  }
  const ids = Array.isArray(novos) ? novos : Object.keys(novos).filter((id) => novos[id] > 0);
  const listaItens = [...new Set([...colecao.itens, ...ids.filter((id) => itens[id])])];
  if (porTipo === colecao.equipamentos && listaItens.length === colecao.itens.length) return save;
  return { ...save, colecao: { ...colecao, equipamentos: porTipo, itens: listaItens } };
}

export function temReliquia(save, reliquiaId) {
  return save.colecao.reliquias.includes(reliquiaId);
}

export function adicionarReliquia(save, reliquiaId) {
  if (temReliquia(save, reliquiaId)) return save;
  return { ...save, colecao: { ...save.colecao, reliquias: [...save.colecao.reliquias, reliquiaId] } };
}

// { equipamentos, itens, reliquias, total }: cada um { obtidos, total }; total também tem percentual
export function progressoDaColecao(save) {
  const equipamentos = {
    obtidos: Object.values(save.colecao.equipamentos).reduce((s, r) => s + r.length, 0),
    total: chavesDeEquipamento().length * RARIDADES.length,
  };
  const listaItens = {
    obtidos: save.colecao.itens.filter((id) => itens[id]).length,
    total: Object.keys(itens).length,
  };
  const listaReliquias = {
    obtidos: save.colecao.reliquias.filter((id) => reliquias[id]).length,
    total: Object.keys(reliquias).length,
  };
  const obtidos = equipamentos.obtidos + listaItens.obtidos + listaReliquias.obtidos;
  const total = equipamentos.total + listaItens.total + listaReliquias.total;
  return {
    equipamentos,
    itens: listaItens,
    reliquias: listaReliquias,
    total: { obtidos, total, percentual: Math.floor((100 * obtidos) / total) },
  };
}

// Preenche a coleção com o que o save já tem (migração v4 → v5)
export function colecaoDoQueOSaveTem(save) {
  return registrarNaColecao(save, {
    equipamentos: Object.values(save.inventario.equipamentos),
    itens: save.inventario.itens,
  });
}
