// Loja por save (SPEC.md §3.11). Funções puras: recebem agora e rng por parâmetro.

import { itens } from "../data/itens";
import { MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";
import {
  DURACAO_LOJA_MS,
  EQUIPAMENTOS_NA_LOJA,
  CUSTO_RENOVAR_POR_NIVEL,
  CONSUMIVEIS_A_VENDA,
} from "../data/loja";
import { sortearEquipamento, precoCompra } from "./itens";
import { nivelMedio } from "./encontros";
import { equipamentosLivres } from "./inventario";
import { registrarNaColecao } from "./colecao";
import { prazoVencido, tempoAtePrazo } from "./relogio";
import { heroisDoGrupo } from "./grupo";

export function gerarLoja(rng, { nivel, classeIds, agora }) {
  const equipamentos = Array.from({ length: EQUIPAMENTOS_NA_LOJA }, () => {
    const item = sortearEquipamento(rng, { nivel, classeIds });
    return { ...item, preco: precoCompra(item) };
  });
  return {
    itens: equipamentos,
    vendidos: equipamentos.map(() => false),
    renovadaEm: agora,
  };
}

// Relógio que voltou no tempo não renova a loja (evita trocar itens mexendo no relógio)
export function lojaVencida(loja, agora) {
  return !loja || prazoVencido(loja.renovadaEm, DURACAO_LOJA_MS, agora);
}

export function tempoAteRenovar(loja, agora) {
  if (!loja) return 0;
  return tempoAtePrazo(loja.renovadaEm, DURACAO_LOJA_MS, agora);
}

function novaLoja(save, rng, agora) {
  const herois = heroisDoGrupo(save);
  return gerarLoja(rng, {
    nivel: nivelMedio(herois),
    classeIds: herois.map((h) => h.classeId),
    agora,
  });
}

export function lojaEmDia(save, agora, rng) {
  if (!lojaVencida(save.loja, agora)) return save;
  return { ...save, loja: novaLoja(save, rng, agora) };
}

export function custoRenovar(save) {
  return CUSTO_RENOVAR_POR_NIVEL * nivelMedio(heroisDoGrupo(save));
}

export function renovarLoja(save, agora, rng) {
  const custo = custoRenovar(save);
  if (save.ouro < custo) return { erro: `Renovar custa ${custo} ouro.` };
  return { save: { ...save, ouro: save.ouro - custo, loja: novaLoja(save, rng, agora) } };
}

export function comprarEquipamento(save, indice) {
  const oferta = save.loja?.itens[indice];
  if (!oferta || save.loja.vendidos[indice]) return { erro: "Este item não está mais à venda." };
  if (save.ouro < oferta.preco) return { erro: "Ouro insuficiente." };
  if (equipamentosLivres(save).length >= MAX_EQUIPAMENTOS_INVENTARIO) {
    return { erro: "Inventário cheio. Venda algum equipamento antes." };
  }
  const { preco, ...item } = oferta;
  const vendidos = save.loja.vendidos.map((v, i) => (i === indice ? true : v));
  const comprado = {
    ...save,
    ouro: save.ouro - preco,
    loja: { ...save.loja, vendidos },
    inventario: {
      ...save.inventario,
      equipamentos: { ...save.inventario.equipamentos, [item.id]: item },
    },
  };
  return { save: registrarNaColecao(comprado, { equipamentos: [item] }) };
}

export function comprarItem(save, itemId, quantidade = 1) {
  const item = itens[itemId];
  if (!CONSUMIVEIS_A_VENDA.includes(itemId) || !item) return { erro: "Este item não está à venda." };
  if (!Number.isInteger(quantidade) || quantidade < 1) return { erro: "Quantidade inválida." };
  const atual = save.inventario.itens[itemId] || 0;
  if (atual + quantidade > item.empilhaAte) return { erro: `Você pode carregar no máximo ${item.empilhaAte}.` };
  const total = item.preco * quantidade;
  if (save.ouro < total) return { erro: "Ouro insuficiente." };
  return {
    save: registrarNaColecao(
      {
        ...save,
        ouro: save.ouro - total,
        inventario: { ...save.inventario, itens: { ...save.inventario.itens, [itemId]: atual + quantidade } },
      },
      { itens: [itemId] },
    ),
  };
}
