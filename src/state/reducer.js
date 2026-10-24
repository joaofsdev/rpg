// Reducer global (SPEC.md §6.4). Puro: sem storage, sem relógio, sem Math.random.
// Tempo e sementes chegam no payload, vindos de useAcoes.js.

import { classesHeroi } from "../data/classesHeroi";
import { TAMANHO_NOME_MAX } from "../data/constants";
import { buscarZona } from "../data/zonas";
import { CONFIG_PADRAO } from "../save/armazenamento";
import { criarNovoJogo } from "../save/novoJogo";
import { criarRng } from "../engine/rng";
import { criarBatalha, aplicarAcao } from "../engine/combate";
import { gerarEncontro, encontroDeChefe, nivelMedio } from "../engine/encontros";
import { aplicarResultadoBatalha } from "../engine/progressao";
import { distribuirPontos, sincronizarGolpes, equiparGolpes } from "../engine/herois";
import { equipar, desequipar, venderEquipamento, heroisEmBatalha } from "../engine/inventario";
import { lojaEmDia, renovarLoja, comprarEquipamento, comprarItem } from "../engine/loja";
import { DERROTAS_PARA_BONUS_DROP } from "../engine/progressao";
import {
  entrarNaMasmorra,
  sairDaMasmorra,
  inimigosDoAndar,
  origemDoAndar,
  concluirAndar,
} from "../engine/masmorra";

const CLASSES_SORTEADAS = 3;
const TELAS_DE_JOGO = ["mapa", "grupo", "inventario", "bestiario", "mais"];

const UI_BATALHA_VAZIA = { inicial: null, eventos: [], encerrada: null };

export function criarEstadoInicial() {
  return {
    tela: "carregando",
    slots: [],
    migracao: null,
    slotAtivo: null,
    save: null,
    config: CONFIG_PADRAO,
    novoJogo: null,
    batalhaUi: UI_BATALHA_VAZIA,
    resumoBatalha: null,
    aviso: null,
  };
}

function comAviso(state, mensagem) {
  return { ...state, aviso: mensagem };
}

function sortearClasses(semente) {
  const rng = criarRng(semente);
  const ids = Object.keys(classesHeroi);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng.proximo() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, CLASSES_SORTEADAS);
}

function afinidadesDoBestiario(save) {
  return Object.fromEntries(
    Object.entries(save.bestiario).map(([id, entrada]) => [id, entrada.afinidadesReveladas]),
  );
}

function bonusDropDoBestiario(save) {
  return Object.entries(save.bestiario)
    .filter(([, entrada]) => entrada.derrotas >= DERROTAS_PARA_BONUS_DROP)
    .map(([id]) => id);
}

// Se a batalha acabou, aplica o resultado no save na hora (as recompensas ficam salvas
// mesmo que a aba feche durante a animação final)
function finalizarSeTerminou(state, save, batalha) {
  if (batalha.fase !== "fim") return { ...state, save: { ...save, batalha } };
  const aplicado = aplicarResultadoBatalha({ ...save, batalha }, batalha);
  const { save: atualizado, evento } = concluirAndar(aplicado.save, batalha, aplicado.resumo);
  return {
    ...state,
    save: atualizado,
    resumoBatalha: { ...aplicado.resumo, origem: batalha.origem, masmorra: evento },
    batalhaUi: { ...state.batalhaUi, encerrada: batalha },
  };
}

function iniciarEncontro(state, { zonaId, chefe = false, semente }) {
  const { save } = state;
  if (!save) return state;
  if (save.batalha) return comAviso(state, "Já existe uma batalha em andamento.");

  const zona = buscarZona(zonaId);
  const progresso = save.progresso.zonas[zonaId];
  if (!zona?.jogavel || !progresso?.desbloqueada) return comAviso(state, "Esta zona não está disponível.");
  if (chefe && progresso.encontrosVencidos < zona.encontrosParaChefe) {
    return comAviso(state, "O chefe ainda não apareceu nesta zona.");
  }

  const rng = criarRng(semente);
  const herois = save.grupo.map((id) => save.herois[id]);
  const inimigos = chefe ? encontroDeChefe(zona) : gerarEncontro(zona, nivelMedio(herois), rng);
  return comecarBatalha(state, save, { inimigos, origem: { tipo: "zona", zonaId, chefe }, rng });
}

function comecarBatalha(state, save, { inimigos, origem, rng, vidaInicial }) {
  const { batalha, eventos, inicial } = criarBatalha({
    herois: save.grupo.map((id) => save.herois[id]),
    equipamentos: save.inventario.equipamentos,
    inimigos,
    origem,
    semente: Math.floor(rng.proximo() * 4294967296),
    afinidadesConhecidas: afinidadesDoBestiario(save),
    bonusDrop: bonusDropDoBestiario(save),
    vidaInicial,
  });

  const proximo = {
    ...state,
    tela: "batalha",
    resumoBatalha: null,
    batalhaUi: { inicial, eventos, encerrada: null },
  };
  return finalizarSeTerminou(proximo, save, batalha);
}

function descerAndar(state, { semente }) {
  const { save } = state;
  const atual = save?.masmorraAtual;
  if (!atual) return state;
  if (save.batalha) return comAviso(state, "Já existe uma batalha em andamento.");
  const rng = criarRng(semente);
  const semFogueira = { ...save, masmorraAtual: { ...atual, fogueira: null } };
  return comecarBatalha(state, semFogueira, {
    inimigos: inimigosDoAndar(buscarZona(atual.zonaId), atual.andar, rng),
    origem: origemDoAndar(atual),
    rng,
    vidaInicial: atual.vida,
  });
}

function agir(state, acao) {
  const { save } = state;
  if (!save?.batalha) return state;
  // Defesa em profundidade: nenhuma ação enquanto a animação anterior não terminou
  if (state.batalhaUi.eventos.length > 0) return state;

  if (acao.tipo === "item" && !(save.inventario.itens[acao.itemId] > 0)) {
    return comAviso(state, "Você não tem mais este item.");
  }

  const resultado = aplicarAcao(save.batalha, acao);
  if (resultado.erro) return comAviso(state, resultado.erro);

  const itens = { ...save.inventario.itens };
  for (const evento of resultado.eventos) {
    if (evento.tipo !== "itemUsado") continue;
    itens[evento.itemId] -= 1;
    if (itens[evento.itemId] <= 0) delete itens[evento.itemId];
  }

  const proximo = {
    ...state,
    batalhaUi: { inicial: save.batalha, eventos: resultado.eventos, encerrada: null },
  };
  const saveComItens = { ...save, inventario: { ...save.inventario, itens } };
  return finalizarSeTerminou(proximo, saveComItens, resultado.batalha);
}

function alterarSave(state, resultado) {
  if (resultado.erro) return comAviso(state, resultado.erro);
  return { ...state, save: resultado.save };
}

export function reducer(state, action) {
  switch (action.type) {
    case "INICIADO":
      return {
        ...state,
        tela: "slots",
        slots: action.slots,
        config: action.config,
        migracao: action.migracao ?? null,
      };

    case "SLOTS_ATUALIZADOS":
      return { ...state, slots: action.slots };

    case "MIGRACAO_CONCLUIDA":
      return { ...state, migracao: null, slots: action.slots };

    case "ABRIR_NOVO_JOGO":
      return {
        ...state,
        tela: "novoJogo",
        novoJogo: { slot: action.slot, classes: sortearClasses(action.semente) },
      };

    case "CANCELAR_NOVO_JOGO":
      return { ...state, tela: "slots", novoJogo: null };

    case "CRIAR_JOGO": {
      const nome = action.nomeHeroi.trim();
      if (!state.novoJogo) return state;
      if (nome.length === 0 || nome.length > TAMANHO_NOME_MAX) {
        return comAviso(state, `O nome precisa ter de 1 a ${TAMANHO_NOME_MAX} letras.`);
      }
      if (!state.novoJogo.classes.includes(action.classeId)) return comAviso(state, "Escolha uma das classes sorteadas.");
      const save = criarNovoJogo({
        nomeHeroi: nome,
        classeId: action.classeId,
        agora: action.agora,
        rng: criarRng(action.semente),
      });
      return { ...state, tela: "mapa", slotAtivo: state.novoJogo.slot, novoJogo: null, save };
    }

    case "SAVE_ABERTO":
      return {
        ...state,
        tela: "mapa",
        slotAtivo: action.slot,
        save: sincronizarGolpes({ ...action.save, ultimaVisita: action.agora }),
        batalhaUi: UI_BATALHA_VAZIA,
        resumoBatalha: null,
      };

    case "FECHAR_SLOT":
      return {
        ...criarEstadoInicial(),
        tela: "slots",
        slots: action.slots,
        config: state.config,
      };

    case "NAVEGAR":
      if (!state.save) return state;
      if (action.tela === "masmorra" && state.save.masmorraAtual) return { ...state, tela: "masmorra" };
      if (!TELAS_DE_JOGO.includes(action.tela)) return state;
      return { ...state, tela: action.tela };

    case "ENTRAR_MASMORRA": {
      const resultado = entrarNaMasmorra(state.save, action.zonaId);
      if (resultado.erro) return comAviso(state, resultado.erro);
      return { ...state, tela: "masmorra", save: resultado.save };
    }

    case "DESCER_ANDAR":
      return descerAndar(state, action);

    case "SAIR_DA_MASMORRA":
      if (!state.save?.masmorraAtual) return state;
      return { ...state, tela: "mapa", save: sairDaMasmorra(state.save) };

    case "RETOMAR_BATALHA":
      if (!state.save?.batalha) return state;
      return { ...state, tela: "batalha", batalhaUi: UI_BATALHA_VAZIA };

    case "INICIAR_ENCONTRO":
      return iniciarEncontro(state, action);

    case "ACAO_BATALHA":
      return agir(state, action.acao);

    case "FILA_CONCLUIDA":
      if (state.batalhaUi.encerrada) {
        return { ...state, tela: "resultado", batalhaUi: UI_BATALHA_VAZIA };
      }
      return { ...state, batalhaUi: UI_BATALHA_VAZIA };

    case "SAIR_DA_BATALHA":
      if (state.batalhaUi.encerrada) {
        return { ...state, tela: "resultado", batalhaUi: UI_BATALHA_VAZIA };
      }
      return { ...state, tela: "mapa", batalhaUi: UI_BATALHA_VAZIA };

    case "FECHAR_RESULTADO":
      return { ...state, tela: state.save?.masmorraAtual ? "masmorra" : "mapa", resumoBatalha: null };

    case "DISTRIBUIR_PONTOS": {
      const heroi = state.save?.herois[action.heroiId];
      if (!heroi) return state;
      const resultado = distribuirPontos(heroi, action.pontos);
      if (resultado.erro) return comAviso(state, resultado.erro);
      return {
        ...state,
        save: { ...state.save, herois: { ...state.save.herois, [heroi.id]: resultado.heroi } },
      };
    }

    case "EQUIPAR_GOLPES": {
      const heroi = state.save?.herois[action.heroiId];
      if (!heroi) return state;
      if (heroisEmBatalha(state.save).includes(heroi.id)) {
        return comAviso(state, "Este herói está em uma batalha em andamento.");
      }
      const resultado = equiparGolpes(heroi, action.golpes);
      if (resultado.erro) return comAviso(state, resultado.erro);
      return {
        ...state,
        save: { ...state.save, herois: { ...state.save.herois, [heroi.id]: resultado.heroi } },
      };
    }

    case "ABRIR_LOJA":
      if (!state.save) return state;
      return {
        ...state,
        tela: "loja",
        save: lojaEmDia(state.save, action.agora, criarRng(action.semente)),
      };

    case "RENOVAR_LOJA":
      return alterarSave(state, renovarLoja(state.save, action.agora, criarRng(action.semente)));

    case "COMPRAR_EQUIPAMENTO":
      return alterarSave(state, comprarEquipamento(state.save, action.indice));

    case "COMPRAR_ITEM":
      return alterarSave(state, comprarItem(state.save, action.itemId, action.quantidade));

    case "EQUIPAR":
      return alterarSave(state, equipar(state.save, action.heroiId, action.equipamentoId));

    case "DESEQUIPAR":
      return alterarSave(state, desequipar(state.save, action.heroiId, action.slot));

    case "VENDER_EQUIPAMENTO":
      return alterarSave(state, venderEquipamento(state.save, action.equipamentoId));

    case "CONFIG_ALTERADA":
      return { ...state, config: { ...state.config, ...action.mudancas } };

    case "AVISO":
      return comAviso(state, action.mensagem);

    case "AVISO_LIMPO":
      return { ...state, aviso: null };

    default:
      return state;
  }
}
