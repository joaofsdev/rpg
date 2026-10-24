// Expedições (SPEC.md §3.6, §4.10). Funções puras; `agora` vem de relogio().
// As rolagens são recalculadas a partir da semente guardada na atividade: recarregar a página
// ou consultar o progresso várias vezes nunca muda o resultado.

import { zonas, buscarZona } from "../data/zonas";
import {
  DURACOES_EXPEDICAO_MINUTOS,
  MINUTOS_POR_ROLAGEM,
  OURO_POR_ROLAGEM_POR_ZONA,
  FRACAO_XP_EXPEDICAO,
  VAGAS_EXPEDICAO_INICIAIS,
  ZONAS_QUE_LIBERAM_VAGA_EXPEDICAO,
} from "../data/expedicoes";
import { criarRng, escolherPonderado } from "./rng";
import { decorrido, heroiOcupado, listarAtividades, adicionarAtividade, removerAtividade } from "./atividades";
import { ganharXp, xpPorInimigo } from "./progressao";

const MINUTO_MS = 60 * 1000;
const ROLAGEM_MS = MINUTOS_POR_ROLAGEM * MINUTO_MS;

export function vagasDeExpedicao(save) {
  const chefes = ZONAS_QUE_LIBERAM_VAGA_EXPEDICAO.filter((id) => save.progresso.zonas[id]?.chefeDerrotado);
  return VAGAS_EXPEDICAO_INICIAIS + chefes.length;
}

export function expedicoesEmAndamento(save) {
  return listarAtividades(save, ["expedicao"]);
}

// Por que o herói não pode partir agora (null = pode)
export function motivoNaoViaja(save, heroiId) {
  if (!save.herois[heroiId]) return "Herói não encontrado.";
  if (save.grupo.includes(heroiId)) return "Está no grupo. Mova para a reserva para viajar.";
  if (heroiOcupado(save, heroiId)) return "Já está em uma atividade.";
  const vagas = vagasDeExpedicao(save);
  if (expedicoesEmAndamento(save).length >= vagas) return `Todas as vagas de expedição estão ocupadas (${vagas}/${vagas}).`;
  return null;
}

// Zonas com o motivo de estarem fechadas para este herói (null = pode ir)
export function opcoesDeZona(save, heroi) {
  return zonas.map((zona) => {
    let motivo = null;
    if (!save.progresso.zonas[zona.id]?.desbloqueada) motivo = "Zona bloqueada";
    else if (heroi.nivel < zona.nivelMin) motivo = `Exige nível ${zona.nivelMin}`;
    return { zona, motivo };
  });
}

export function iniciarExpedicao(save, { id, heroiId, zonaId, minutos, agora, semente }) {
  const motivo = motivoNaoViaja(save, heroiId);
  if (motivo) return { erro: motivo };
  const opcao = opcoesDeZona(save, save.herois[heroiId]).find((o) => o.zona.id === zonaId);
  if (!opcao) return { erro: "Zona desconhecida." };
  if (opcao.motivo) return { erro: opcao.motivo };
  if (!DURACOES_EXPEDICAO_MINUTOS.includes(minutos)) return { erro: "Duração inválida." };
  const atividade = {
    id,
    tipo: "expedicao",
    heroiId,
    inicio: agora,
    duracao: minutos * MINUTO_MS,
    semente: semente >>> 0,
    parametros: { zonaId },
    custoPago: 0,
  };
  return { save: adicionarAtividade(save, atividade) };
}

export function rolagensCompletas(atividade, agora) {
  return Math.floor(decorrido(atividade, agora) / ROLAGEM_MS);
}

export function totalDeRolagens(atividade) {
  return Math.floor(atividade.duracao / ROLAGEM_MS);
}

// Recompensa das primeiras `rolagens` rolagens: { itens: { [itemId]: qtd }, ouro, xp }.
// Cada rolagem i usa a semente da expedição + i (§4.10).
export function recompensaDaExpedicao(atividade, rolagens) {
  const zona = buscarZona(atividade.parametros.zonaId);
  const indice = zonas.indexOf(zona);
  const xpPorRolagem = Math.floor(
    xpPorInimigo(Math.floor((zona.nivelMin + zona.nivelMax) / 2)) * FRACAO_XP_EXPEDICAO,
  );
  const itens = {};
  for (let i = 0; i < rolagens; i++) {
    const { itemId } = escolherPonderado(criarRng(atividade.semente + i), zona.tabelaExpedicao);
    itens[itemId] = (itens[itemId] || 0) + 1;
  }
  return {
    itens,
    ouro: rolagens * OURO_POR_ROLAGEM_POR_ZONA * (indice + 1),
    xp: rolagens * xpPorRolagem,
  };
}

// Encerra (concluída ou cancelada): entrega as rolagens completas e libera o herói.
// Retorna { save, ganho }.
export function encerrarExpedicao(save, atividade, agora) {
  const rolagens = rolagensCompletas(atividade, agora);
  const { itens, ouro, xp } = recompensaDaExpedicao(atividade, rolagens);
  const semAtividade = removerAtividade(save, atividade.id);
  const ganho = { tipo: "expedicao", heroiId: atividade.heroiId, zonaId: atividade.parametros.zonaId, rolagens, itens, ouro, xp };

  const inventario = { ...semAtividade.inventario.itens };
  for (const [itemId, qtd] of Object.entries(itens)) inventario[itemId] = (inventario[itemId] || 0) + qtd;
  let herois = semAtividade.herois;
  const heroi = herois[atividade.heroiId];
  if (heroi && xp > 0) {
    const { heroi: atualizado, niveisGanhos, golpesNovos } = ganharXp(heroi, xp);
    herois = { ...herois, [heroi.id]: atualizado };
    ganho.niveisGanhos = niveisGanhos;
    ganho.nivelNovo = atualizado.nivel;
    ganho.golpesNovos = golpesNovos;
  }
  return {
    save: {
      ...semAtividade,
      ouro: semAtividade.ouro + ouro,
      herois,
      inventario: { ...semAtividade.inventario, itens: inventario },
    },
    ganho,
  };
}
