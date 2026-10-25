// XP, níveis e aplicação do resultado de uma batalha no save (SPEC.md §4.7, §3.4, §3.10)

import { zonas } from "../data/zonas";
import {
  PONTOS_POR_NIVEL,
  NIVEL_MAXIMO,
  MULT_OURO_CHEFE,
  ELEMENTOS,
} from "../data/constants";
import { guardarNoInventario } from "./inventario";
import { aumentarPercentual } from "./atributos";
import { aprenderGolpesDoNivel } from "./herois";
import { efeitoDaRefeicao, receitaDoChefe, aprenderReceita } from "./cozinha";

// Marcos do bestiário (SPEC.md §3.10)
export const DERROTAS_PARA_REVELAR_AFINIDADES = 10;
export const DERROTAS_PARA_BONUS_DROP = 50;
export const DERROTAS_PARA_TROFEU = 100;

export function xpParaProximoNivel(nivel) {
  return Math.floor(100 * Math.pow(nivel, 1.6) + 100);
}

export function xpPorInimigo(nivelInimigo) {
  return Math.floor(20 * Math.pow(nivelInimigo, 1.2) + 20);
}

export function ouroPorInimigo(nivelInimigo, chefe = false) {
  return Math.floor((2 + nivelInimigo * 1.5) * (chefe ? MULT_OURO_CHEFE : 1));
}

// Retorna { heroi, niveisGanhos, golpesNovos } sem alterar o herói recebido
export function ganharXp(heroi, xp) {
  const resultado = { ...heroi };
  let niveisGanhos = 0;
  if (resultado.nivel >= NIVEL_MAXIMO) return { heroi: { ...resultado, xp: 0 }, niveisGanhos, golpesNovos: [] };

  resultado.xp += xp;
  while (resultado.nivel < NIVEL_MAXIMO && resultado.xp >= xpParaProximoNivel(resultado.nivel)) {
    resultado.xp -= xpParaProximoNivel(resultado.nivel);
    resultado.nivel += 1;
    niveisGanhos += 1;
  }
  if (resultado.nivel >= NIVEL_MAXIMO) resultado.xp = 0;
  resultado.pontosLivres += niveisGanhos * PONTOS_POR_NIVEL;
  const { heroi: comGolpes, novos } = aprenderGolpesDoNivel(resultado);
  return { heroi: comGolpes, niveisGanhos, golpesNovos: novos };
}

function atualizarBestiario(bestiario, batalha) {
  const resultado = { ...bestiario };
  const inimigosBatalha = Object.values(batalha.combatentes).filter((c) => c.lado === "inimigos");
  for (const inimigo of inimigosBatalha) {
    const anterior = resultado[inimigo.refId] || {
      visto: false,
      derrotas: 0,
      afinidadesReveladas: [],
      dropsVistos: [],
    };
    const entrada = {
      ...anterior,
      visto: true,
      derrotas: anterior.derrotas + (inimigo.nocauteado ? 1 : 0),
    };
    const vistos = batalha.recompensas?.dropsPorInimigo?.[inimigo.refId] || [];
    entrada.dropsVistos = [...new Set([...anterior.dropsVistos, ...vistos])];
    const conhecidas = batalha.afinidadesConhecidas?.[inimigo.refId] || [];
    entrada.afinidadesReveladas =
      entrada.derrotas >= DERROTAS_PARA_REVELAR_AFINIDADES
        ? [...ELEMENTOS]
        : [...new Set([...anterior.afinidadesReveladas, ...conhecidas])];
    resultado[inimigo.refId] = entrada;
  }
  return resultado;
}

function atualizarProgressoZona(progresso, origem, resultado) {
  if (origem?.tipo !== "zona" || resultado !== "vitoria") return progresso;
  const indice = zonas.findIndex((z) => z.id === origem.zonaId);
  const zona = zonas[indice];
  const novo = {
    zonas: { ...progresso.zonas },
    masmorras: { ...progresso.masmorras },
  };
  const atual = { ...novo.zonas[zona.id] };

  if (origem.chefe) {
    atual.chefeDerrotado = true;
    novo.masmorras[zona.masmorra.id] = { ...novo.masmorras[zona.masmorra.id], desbloqueada: true };
    const proxima = zonas[indice + 1];
    if (proxima) novo.zonas[proxima.id] = { ...novo.zonas[proxima.id], desbloqueada: true };
  } else {
    atual.encontrosVencidos += 1;
  }
  novo.zonas[zona.id] = atual;
  return novo;
}

// Aplica uma batalha encerrada no save. Retorna { save, resumo } sem alterar a entrada.
export function aplicarResultadoBatalha(save, batalha) {
  if (batalha.fase !== "fim") throw new Error("A batalha ainda não terminou.");

  // Refeição de XP ou de ouro aumenta as recompensas desta batalha (SPEC.md §3.7)
  const refeicao = efeitoDaRefeicao(save);
  const bonusXp = refeicao?.tipo === "xp" ? refeicao.valor : 0;
  const bonusOuro = refeicao?.tipo === "ouro" ? refeicao.valor : 0;
  const recompensas = {
    ...batalha.recompensas,
    xp: aumentarPercentual(batalha.recompensas.xp, bonusXp),
    ouro: aumentarPercentual(batalha.recompensas.ouro, bonusOuro),
  };
  const resumo = {
    resultado: batalha.resultado,
    xp: recompensas.xp,
    ouro: recompensas.ouro,
    itens: { ...recompensas.itens },
    equipamentos: [],
    equipamentosVendidos: [],
    itensVendidos: [],
    niveis: [],
    receitaNova: null,
  };

  const herois = { ...save.herois };
  const heroisNaBatalha = Object.values(batalha.combatentes).filter((c) => c.lado === "herois");
  for (const combatente of heroisNaBatalha) {
    const heroi = herois[combatente.refId];
    if (!heroi || recompensas.xp === 0) continue;
    const { heroi: atualizado, niveisGanhos, golpesNovos } = ganharXp(heroi, recompensas.xp);
    herois[heroi.id] = atualizado;
    if (niveisGanhos > 0) {
      resumo.niveis.push({ heroiId: heroi.id, de: heroi.nivel, para: atualizado.nivel, golpesNovos });
    }
  }

  // Inventário cheio ou pilha no limite: o excedente é vendido automaticamente (SPEC.md §4.8)
  const guardado = guardarNoInventario(
    { ...save, ouro: save.ouro + recompensas.ouro },
    { itens: recompensas.itens, equipamentos: recompensas.equipamentos },
  );
  resumo.itens = guardado.guardados.itens;
  resumo.equipamentos = guardado.guardados.equipamentos;
  resumo.itensVendidos = guardado.vendidos.itens;
  resumo.equipamentosVendidos = guardado.vendidos.equipamentos;

  const estatisticas = { ...save.estatisticas };
  const chave = { vitoria: "encontrosVencidos", derrota: "derrotas", fuga: "fugas" }[
    batalha.resultado
  ];
  estatisticas[chave] = (estatisticas[chave] || 0) + 1;

  let refeicaoAtiva = save.refeicaoAtiva;
  if (refeicaoAtiva) {
    const restantes = refeicaoAtiva.encontrosRestantes - 1;
    refeicaoAtiva = restantes > 0 ? { ...refeicaoAtiva, encontrosRestantes: restantes } : null;
  }

  // O chefe da zona ensina a receita dela, se ainda não for conhecida
  let comReceita = guardado.save;
  const { origem } = batalha;
  if (batalha.resultado === "vitoria" && origem?.tipo === "zona" && origem.chefe) {
    const receita = receitaDoChefe(origem.zonaId);
    comReceita = aprenderReceita(guardado.save, receita?.id);
    if (comReceita !== guardado.save) resumo.receitaNova = receita.id;
  }

  return {
    save: {
      ...comReceita,
      herois,
      progresso: atualizarProgressoZona(save.progresso, batalha.origem, batalha.resultado),
      bestiario: atualizarBestiario(save.bestiario, batalha),
      estatisticas,
      refeicaoAtiva,
      batalha: null,
    },
    resumo,
  };
}
