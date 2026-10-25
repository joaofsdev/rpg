// Formato do save (SPEC.md §5.4). Versão atual: VERSAO_SAVE.

import { zonas } from "../data/zonas";
import { classesHeroi } from "../data/classesHeroi";
import { MAX_GRUPO, SLOTS_EQUIPAMENTO } from "../data/constants";

export const VERSAO_SAVE = 4;

function progressoInicial() {
  const progresso = { zonas: {}, masmorras: {} };
  zonas.forEach((zona, i) => {
    progresso.zonas[zona.id] = {
      desbloqueada: i === 0,
      encontrosVencidos: 0,
      chefeDerrotado: false,
    };
    progresso.masmorras[zona.masmorra.id] = {
      desbloqueada: false,
      concluida: false,
      melhorAndar: 0,
    };
  });
  return progresso;
}

export function criarSaveVazio(agora) {
  return {
    versao: VERSAO_SAVE,
    criadoEm: agora,
    atualizadoEm: agora,
    ultimaVisita: agora,
    tempoJogado: 0,
    ouro: 0,
    herois: {},
    grupo: [],
    inventario: { equipamentos: {}, itens: {} },
    progresso: progressoInicial(),
    batalha: null,
    masmorraAtual: null,
    atividades: {},
    refeicaoAtiva: null,
    loja: null,
    recrutas: null,
    bestiario: {},
    colecao: { equipamentos: {}, itens: [], reliquias: [] },
    receitasConhecidas: [],
    estatisticas: { encontrosVencidos: 0, derrotas: 0, fugas: 0 },
  };
}

function ehObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

// Validação estrutural. Retorna a lista de problemas encontrados (vazia = válido).
export function validarSave(save) {
  const erros = [];
  if (!ehObjeto(save)) return ["O save não é um objeto."];
  if (save.versao !== VERSAO_SAVE) erros.push(`Versão ${save.versao} diferente de ${VERSAO_SAVE}.`);
  if (typeof save.ouro !== "number" || save.ouro < 0) erros.push("Ouro inválido.");
  if (!ehObjeto(save.herois) || Object.keys(save.herois).length === 0) {
    erros.push("O save não tem heróis.");
  }
  if (!Array.isArray(save.grupo) || save.grupo.length === 0 || save.grupo.length > MAX_GRUPO) {
    erros.push("Grupo inválido.");
  } else if (save.grupo.some((id) => !save.herois?.[id])) {
    erros.push("Grupo referencia herói inexistente.");
  } else if (new Set(save.grupo).size !== save.grupo.length) {
    erros.push("Grupo com herói repetido.");
  }
  if (!ehObjeto(save.atividades)) {
    erros.push("Atividades inválidas.");
  } else if (Object.values(save.atividades).some((a) => a.heroiId !== undefined && !save.herois?.[a.heroiId])) {
    erros.push("Atividade de herói inexistente.");
  }
  if (!ehObjeto(save.inventario?.equipamentos) || !ehObjeto(save.inventario?.itens)) {
    erros.push("Inventário inválido.");
  }
  if (!ehObjeto(save.progresso?.zonas) || !ehObjeto(save.progresso?.masmorras)) {
    erros.push("Progresso inválido.");
  }

  if (ehObjeto(save.herois) && ehObjeto(save.inventario?.equipamentos)) {
    for (const heroi of Object.values(save.herois)) {
      if (!classesHeroi[heroi.classeId]) erros.push(`Herói ${heroi.nome}: classe desconhecida.`);
      for (const slot of SLOTS_EQUIPAMENTO) {
        const id = heroi.equipamento?.[slot];
        if (id && !save.inventario.equipamentos[id]) {
          erros.push(`Herói ${heroi.nome}: equipamento ${slot} não está no inventário.`);
        }
      }
    }
  }
  return erros;
}
