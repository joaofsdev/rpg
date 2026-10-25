// Ferraria (SPEC.md §3.11): forjar e aprimorar. Funções puras; rng por parâmetro.

import { zonas, buscarZona } from "../data/zonas";
import { itens } from "../data/itens";
import { TIPOS_ARMA, PESOS_ARMADURA } from "../data/equipamentos";
import { MAX_EQUIPAMENTOS_INVENTARIO, SLOTS_EQUIPAMENTO } from "../data/constants";
import { FORJA, APRIMORAMENTO_MAX, APRIMORAR } from "../data/ferraria";
import { gerarEquipamento, sortearRaridade, raridadeMinima } from "./itens";
import { equipamentosLivres, donoDoEquipamento, heroisEmBatalha } from "./inventario";
import { registrarNaColecao } from "./colecao";

// [principal, secundário]: os materiais da zona, do mais comum para o mais raro na expedição
export function materiaisDaZona(zona) {
  return [...zona.tabelaExpedicao]
    .filter((e) => itens[e.itemId]?.categoria === "material")
    .sort((a, b) => b.peso - a.peso)
    .map((e) => e.itemId);
}

// Zona cujos materiais aprimoram um item deste nível (acima do último nível, a última zona)
export function zonaDoNivel(nivel) {
  return zonas.find((z) => nivel <= z.nivelMax) ?? zonas[zonas.length - 1];
}

function faltaMaterial(save, custo) {
  return custo.materiais.some(({ itemId, qtd }) => (save.inventario.itens[itemId] || 0) < qtd);
}

function pagar(save, custo) {
  const itensInventario = { ...save.inventario.itens };
  for (const { itemId, qtd } of custo.materiais) {
    itensInventario[itemId] -= qtd;
    if (itensInventario[itemId] <= 0) delete itensInventario[itemId];
  }
  return { ...save, ouro: save.ouro - custo.ouro, inventario: { ...save.inventario, itens: itensInventario } };
}

// ---------- Forjar ----------

// Tipos que podem ser forjados em cada slot: tipos de arma ou pesos de armadura
export function tiposDoSlot(slot) {
  return slot === "arma" ? TIPOS_ARMA : PESOS_ARMADURA;
}

export function custoDaForja(zona, slot) {
  const [principal, secundario] = materiaisDaZona(zona);
  const tipo = slot === "arma" ? "arma" : "armadura";
  return {
    ouro: FORJA.ouroPorNivel * zona.nivelMax,
    materiais: [
      { itemId: principal, qtd: FORJA.materialPrincipal[tipo] },
      { itemId: secundario, qtd: FORJA.materialSecundario[tipo] },
    ],
  };
}

export function motivoNaoForja(save, { zonaId, slot, tipo }) {
  const zona = buscarZona(zonaId);
  if (!zona) return "Zona desconhecida.";
  if (!save.progresso.zonas[zonaId]?.desbloqueada) return "Desbloqueie a zona para usar os materiais dela.";
  if (!SLOTS_EQUIPAMENTO.includes(slot) || !tiposDoSlot(slot).includes(tipo)) return "Tipo de equipamento inválido.";
  const custo = custoDaForja(zona, slot);
  if (faltaMaterial(save, custo)) return "Materiais insuficientes.";
  if (save.ouro < custo.ouro) return "Ouro insuficiente.";
  if (equipamentosLivres(save).length >= MAX_EQUIPAMENTOS_INVENTARIO) return "Inventário cheio. Venda algum equipamento antes.";
  return null;
}

// Item do nível máximo da zona, raridade sorteada com piso Incomum. Retorna { save, item } ou { erro }.
export function forjar(save, { zonaId, slot, tipo }, rng) {
  const motivo = motivoNaoForja(save, { zonaId, slot, tipo });
  if (motivo) return { erro: motivo };
  const zona = buscarZona(zonaId);
  const raridade = raridadeMinima(sortearRaridade(rng), FORJA.raridadeMinima);
  const tipoDoItem = slot === "arma" ? { tipoArma: tipo } : { pesoArmadura: tipo };
  const item = { ...gerarEquipamento(rng, { nivel: zona.nivelMax, raridade, slot, ...tipoDoItem }), nivel: zona.nivelMax };
  const pago = pagar(save, custoDaForja(zona, slot));
  const comItem = { ...pago, inventario: { ...pago.inventario, equipamentos: { ...pago.inventario.equipamentos, [item.id]: item } } };
  return { save: registrarNaColecao(comItem, { equipamentos: [item] }), item };
}

// ---------- Aprimorar ----------

// Custo para levar o item ao próximo nível de aprimoramento (null se já está no máximo)
export function custoDoAprimoramento(item) {
  const alvo = (item.aprimoramento || 0) + 1;
  if (alvo > APRIMORAMENTO_MAX) return null;
  const [principal, secundario] = materiaisDaZona(zonaDoNivel(item.nivel));
  return {
    alvo,
    ouro: APRIMORAR.ouroPorNivelDoItem * item.nivel * alvo,
    materiais: [
      { itemId: principal, qtd: APRIMORAR.materialPrincipalPorNivel * alvo },
      { itemId: secundario, qtd: APRIMORAR.materialSecundarioPorNivel * alvo },
    ],
  };
}

export function motivoNaoAprimora(save, equipamentoId) {
  const item = save.inventario.equipamentos[equipamentoId];
  if (!item) return "Equipamento não encontrado.";
  const custo = custoDoAprimoramento(item);
  if (!custo) return `Já está no máximo (+${APRIMORAMENTO_MAX}).`;
  const dono = donoDoEquipamento(save, equipamentoId);
  if (dono && heroisEmBatalha(save).includes(dono.id)) return "Este item está com um herói em batalha.";
  if (faltaMaterial(save, custo)) return "Materiais insuficientes.";
  if (save.ouro < custo.ouro) return "Ouro insuficiente.";
  return null;
}

// Nunca falha: paga e sobe 1 nível. Retorna { save, item } ou { erro }.
export function aprimorar(save, equipamentoId) {
  const motivo = motivoNaoAprimora(save, equipamentoId);
  if (motivo) return { erro: motivo };
  const atual = save.inventario.equipamentos[equipamentoId];
  const custo = custoDoAprimoramento(atual);
  const item = { ...atual, aprimoramento: custo.alvo };
  const pago = pagar(save, custo);
  return {
    save: { ...pago, inventario: { ...pago.inventario, equipamentos: { ...pago.inventario.equipamentos, [item.id]: item } } },
    item,
  };
}
