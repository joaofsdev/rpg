// Cozinha e refeição ativa (SPEC.md §3.7, §4.10). Funções puras; `agora` vem de relogio().

import { zonas } from "../data/zonas";
import {
  receitas,
  receitaDoPrato,
  VAGAS_COZINHA,
  PORCOES_MAX,
  DURACAO_ROTACAO_RECEITA_MS,
  PRECO_RECEITA_POR_ZONA,
} from "../data/receitas";
import { decorrido, listarAtividades, adicionarAtividade, removerAtividade } from "./atividades";
import { guardarNoInventario } from "./inventario";

const MINUTO_MS = 60 * 1000;

// Iniciais + aprendidas (save.receitasConhecidas guarda só as aprendidas)
export function receitasConhecidas(save) {
  return Object.values(receitas).filter((r) => r.inicial || save.receitasConhecidas.includes(r.id));
}

export function preparosEmAndamento(save) {
  return listarAtividades(save, ["cozinha"]);
}

// Quantas porções os ingredientes do inventário permitem fazer (até PORCOES_MAX)
export function porcoesPossiveis(save, receita) {
  const porIngrediente = receita.ingredientes.map(({ itemId, qtd }) =>
    Math.floor((save.inventario.itens[itemId] || 0) / qtd),
  );
  return Math.min(PORCOES_MAX, ...porIngrediente);
}

export function motivoNaoPrepara(save, receitaId, porcoes) {
  const receita = receitas[receitaId];
  if (!receita || !receitasConhecidas(save).includes(receita)) return "Receita desconhecida.";
  if (preparosEmAndamento(save).length >= VAGAS_COZINHA) return "A panela está ocupada.";
  if (!Number.isInteger(porcoes) || porcoes < 1 || porcoes > PORCOES_MAX) return `Escolha de 1 a ${PORCOES_MAX} porções.`;
  if (porcoesPossiveis(save, receita) < porcoes) return "Ingredientes insuficientes.";
  return null;
}

function moverIngredientes(itensInventario, receita, porcoes, sinal) {
  const resultado = { ...itensInventario };
  for (const { itemId, qtd } of receita.ingredientes) {
    resultado[itemId] = (resultado[itemId] || 0) + sinal * qtd * porcoes;
    if (resultado[itemId] <= 0) delete resultado[itemId];
  }
  return resultado;
}

// Os ingredientes saem do inventário no início
export function iniciarPreparo(save, { id, receitaId, porcoes, agora }) {
  const motivo = motivoNaoPrepara(save, receitaId, porcoes);
  if (motivo) return { erro: motivo };
  const receita = receitas[receitaId];
  const itensInventario = moverIngredientes(save.inventario.itens, receita, porcoes, -1);
  const atividade = {
    id,
    tipo: "cozinha",
    inicio: agora,
    duracao: receita.minutos * porcoes * MINUTO_MS,
    parametros: { receitaId, porcoes },
    custoPago: 0,
  };
  return { save: adicionarAtividade({ ...save, inventario: { ...save.inventario, itens: itensInventario } }, atividade) };
}

export function porcoesProntas(atividade, agora) {
  const { receitaId, porcoes } = atividade.parametros;
  return Math.min(porcoes, Math.floor(decorrido(atividade, agora) / (receitas[receitaId].minutos * MINUTO_MS)));
}

// Encerra (concluído ou cancelado): as porções prontas vão para o inventário e os ingredientes das
// porções que não ficaram prontas voltam. Retorna { save, ganho }.
export function encerrarPreparo(save, atividade, agora) {
  const { receitaId, porcoes } = atividade.parametros;
  const receita = receitas[receitaId];
  const prontas = porcoesProntas(atividade, agora);
  const semAtividade = removerAtividade(save, atividade.id);
  const devolvidos = { ...semAtividade, inventario: { ...semAtividade.inventario, itens: moverIngredientes(semAtividade.inventario.itens, receita, porcoes - prontas, 1) } };
  const guardado = guardarNoInventario(devolvidos, { itens: prontas > 0 ? { [receita.resultado]: prontas } : {} });
  return {
    save: guardado.save,
    ganho: {
      tipo: "cozinha",
      receitaId,
      porcoes: prontas,
      devolvidas: porcoes - prontas,
      vendidos: guardado.vendidos.itens,
      ouroDasVendas: guardado.ouroDasVendas,
    },
  };
}

// Comer fora de batalha ativa a refeição para o grupo; substitui a atual (a interface confirma)
export function motivoNaoCome(save, itemId) {
  if (!receitaDoPrato(itemId)) return "Isto não é uma refeição.";
  if (!(save.inventario.itens[itemId] > 0)) return "Você não tem esta refeição.";
  if (save.batalha) return "Termine a batalha em andamento antes de comer.";
  return null;
}

export function comer(save, itemId) {
  const motivo = motivoNaoCome(save, itemId);
  if (motivo) return { erro: motivo };
  const itensInventario = { ...save.inventario.itens, [itemId]: save.inventario.itens[itemId] - 1 };
  if (itensInventario[itemId] === 0) delete itensInventario[itemId];
  return {
    save: {
      ...save,
      inventario: { ...save.inventario, itens: itensInventario },
      refeicaoAtiva: { itemId, encontrosRestantes: receitaDoPrato(itemId).duracaoEncontros },
    },
  };
}

// { tipo, valor } da refeição ativa, ou null
export function efeitoDaRefeicao(save) {
  return save.refeicaoAtiva ? receitaDoPrato(save.refeicaoAtiva.itemId)?.efeito ?? null : null;
}

// Receitas que o chefe ensina na primeira vitória
export function receitaDoChefe(zonaId) {
  return Object.values(receitas).find((r) => r.zonaId === zonaId) ?? null;
}

export function aprenderReceita(save, receitaId) {
  if (!receitaId || receitas[receitaId]?.inicial || save.receitasConhecidas.includes(receitaId)) return save;
  return { ...save, receitasConhecidas: [...save.receitasConhecidas, receitaId] };
}

// Loja: uma receita por semana entre as ainda não aprendidas de zonas desbloqueadas.
// Calculada pelo relógio, sem nada guardado no save.
export function receitaDaSemana(save, agora) {
  const conhecidas = receitasConhecidas(save);
  const candidatas = Object.values(receitas).filter(
    (r) => r.zonaId && save.progresso.zonas[r.zonaId]?.desbloqueada && !conhecidas.includes(r),
  );
  if (candidatas.length === 0) return null;
  const semana = Math.floor(agora / DURACAO_ROTACAO_RECEITA_MS);
  return candidatas[semana % candidatas.length];
}

export function precoDaReceita(receita) {
  return PRECO_RECEITA_POR_ZONA * (zonas.findIndex((z) => z.id === receita.zonaId) + 1);
}

export function comprarReceita(save, agora) {
  const receita = receitaDaSemana(save, agora);
  if (!receita) return { erro: "Não há receita à venda esta semana." };
  const preco = precoDaReceita(receita);
  if (save.ouro < preco) return { erro: "Ouro insuficiente." };
  return { save: aprenderReceita({ ...save, ouro: save.ouro - preco }, receita.id), receita };
}
