// Reducer global (SPEC.md §6.4). Puro: sem storage, sem relógio, sem Math.random.
// Tempo e sementes chegam no payload, vindos de useAcoes.js.

import { classesHeroi } from "../data/classesHeroi";
import { TAMANHO_NOME_MAX } from "../data/constants";
import { golpes } from "../data/golpes";
import { NOMES_ATRIBUTO } from "../data/textos";
import { buscarZona } from "../data/zonas";
import { CONFIG_PADRAO } from "../save/armazenamento";
import { criarNovoJogo } from "../save/novoJogo";
import { criarRng, gerarId } from "../engine/rng";
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
import { relogio, registrarRelogio } from "../engine/relogio";
import { colocarNoGrupo, tirarDoGrupo, dispensarHeroi } from "../engine/grupo";
import { iniciarTreinoAtributo, iniciarTreinoGolpe } from "../engine/treino";
import { iniciarExpedicao } from "../engine/expedicoes";
import { iniciarPreparo, comer, comprarReceita } from "../engine/cozinha";
import { efeitosDoGrupo } from "../engine/reliquias";
import { forjar, aprimorar } from "../engine/ferraria";
import { receitas } from "../data/receitas";
import { coletarAtividade, cancelarAtividade, coletarTudo, atividadesConcluidas, concluidasDesde } from "../engine/coleta";
import { muralEmDia, contratarRecruta } from "../engine/recrutamento";
import { escolherAcaoAuto, decidirProximo, motivoVidaBaixa } from "../engine/autoBatalha";
import {
  AUTO_DESLIGADO,
  ligarAuto,
  pausarAuto,
  encerrarAuto,
  retomarAuto,
  autoPausadoAoVoltar,
  contabilizarBatalha,
  contarEncontro,
  resumirSessao,
} from "./autoSessao";

const CLASSES_SORTEADAS = 3;
const TELAS_DE_JOGO = ["mapa", "grupo", "atividades", "inventario", "bestiario", "mais", "ferraria", "colecao"];

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
    retorno: null, // { tempoFora } enquanto o modal "Bem-vindo de volta" estiver aberto
    aviso: null,
    auto: AUTO_DESLIGADO, // combate automático opcional (SPEC.md §3.13), fora do save
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
    efeitos: efeitosDoGrupo(save),
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

function descreverGanho(save, ganho) {
  if (ganho.tipo === "cozinha") {
    const prato = receitas[ganho.receitaId].nome;
    const vendidos = ganho.vendidos?.length ? ` Pilha cheia: ${ganho.vendidos[0].qtd} vendida(s) por ${ganho.ouroDasVendas} ouro.` : "";
    const devolvidos = ganho.devolvidas > 0 ? " Os ingredientes do resto voltaram ao inventário." : "";
    return `${prato}: ${ganho.porcoes} ${ganho.porcoes === 1 ? "porção pronta" : "porções prontas"}.${devolvidos}${vendidos}`;
  }
  const nome = save.herois[ganho.heroiId]?.nome ?? "O herói";
  if (ganho.tipo === "expedicao") {
    const qtd = Object.values(ganho.itens).reduce((s, q) => s + q, 0);
    const itens = qtd === 1 ? "1 item" : `${qtd} itens`;
    const nivel = ganho.niveisGanhos > 0 ? ` Subiu para o nível ${ganho.nivelNovo}.` : "";
    const vendidos = ganho.vendidos?.length
      ? ` Pilha cheia: ${ganho.vendidos.reduce((s, v) => s + v.qtd, 0)} vendido(s) por ${ganho.ouroDasVendas} ouro.`
      : "";
    return `${nome} voltou de ${buscarZona(ganho.zonaId).nome}: ${itens}, ${ganho.ouro} ouro e ${ganho.xp} XP.${nivel}${vendidos}`;
  }
  if (ganho.tipo === "treinoGolpe") {
    const golpe = golpes[ganho.golpeId].nome;
    return ganho.aprendeu ? `${nome} aprendeu ${golpe}.` : `${nome} parou de treinar ${golpe}.`;
  }
  if (ganho.pontos === 0) return `${nome} voltou do treino sem pontos novos.`;
  const pontos = ganho.pontos === 1 ? "1 ponto" : `${ganho.pontos} pontos`;
  return `${nome} ganhou ${pontos} de ${NOMES_ATRIBUTO[ganho.atributo]}.`;
}

// Coleta, cancelamento ou "Coletar tudo": aplica no save e avisa o que cada herói ganhou
function encerrarAtividades(state, resultado, agora) {
  if (resultado.erro) return comAviso(state, resultado.erro);
  const ganhos = resultado.ganhos ?? [resultado.ganho];
  const save = registrarRelogio(resultado.save, agora);
  const texto = ganhos.map((g) => descreverGanho(save, g)).join(" ");
  return { ...state, save, retorno: null, aviso: texto || state.aviso };
}

function iniciarTreino(state, action) {
  const { save } = state;
  if (!save) return state;
  const agora = relogio(save, action.agora);
  const id = gerarId(criarRng(action.semente));
  const parametros = { id, heroiId: action.heroiId, agora };
  const resultado = action.golpeId
    ? iniciarTreinoGolpe(save, { ...parametros, golpeId: action.golpeId })
    : iniciarTreinoAtributo(save, { ...parametros, atributo: action.atributo, horas: action.horas });
  if (resultado.erro) return comAviso(state, resultado.erro);
  return { ...state, save: registrarRelogio(resultado.save, agora) };
}

// Ao voltar para a aba: mostra o resumo só se algo terminou enquanto o jogador estava fora
function voltouAoJogo(state, action) {
  const { save } = state;
  if (!save) return state;
  const agora = relogio(save, action.agora);
  const novas = concluidasDesde(save, save.ultimaVisita, agora);
  const retorno = novas.length > 0 ? { tempoFora: agora - save.ultimaVisita } : state.retorno;
  return { ...state, save: registrarRelogio(save, agora), retorno };
}

function reducerBase(state, action) {
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

    case "SAVE_ABERTO": {
      const agora = relogio(action.save, action.agora);
      const prontas = atividadesConcluidas(action.save, agora);
      return {
        ...state,
        tela: "mapa",
        slotAtivo: action.slot,
        save: sincronizarGolpes(registrarRelogio(action.save, agora)),
        batalhaUi: UI_BATALHA_VAZIA,
        resumoBatalha: null,
        retorno: prontas.length > 0 ? { tempoFora: agora - action.save.ultimaVisita } : null,
      };
    }

    case "RELOGIO":
      if (!state.save) return state;
      return { ...state, save: registrarRelogio(state.save, action.agora) };

    case "VOLTOU_AO_JOGO":
      return voltouAoJogo(state, action);

    case "FECHAR_RETORNO":
      return { ...state, retorno: null };

    case "COLETAR_ATIVIDADE": {
      if (!state.save) return state;
      const agora = relogio(state.save, action.agora);
      return encerrarAtividades(state, coletarAtividade(state.save, action.atividadeId, agora), agora);
    }

    case "CANCELAR_ATIVIDADE": {
      if (!state.save) return state;
      const agora = relogio(state.save, action.agora);
      return encerrarAtividades(state, cancelarAtividade(state.save, action.atividadeId, agora), agora);
    }

    case "COLETAR_TUDO": {
      if (!state.save) return state;
      const agora = relogio(state.save, action.agora);
      return encerrarAtividades(state, coletarTudo(state.save, agora), agora);
    }

    case "INICIAR_TREINO":
      return iniciarTreino(state, action);

    case "INICIAR_EXPEDICAO": {
      if (!state.save) return state;
      const agora = relogio(state.save, action.agora);
      const rng = criarRng(action.semente);
      const resultado = iniciarExpedicao(state.save, {
        id: gerarId(rng),
        heroiId: action.heroiId,
        zonaId: action.zonaId,
        minutos: action.minutos,
        agora,
        semente: Math.floor(rng.proximo() * 4294967296),
      });
      if (resultado.erro) return comAviso(state, resultado.erro);
      return { ...state, save: registrarRelogio(resultado.save, agora) };
    }

    case "PREPARAR_RECEITA": {
      if (!state.save) return state;
      const agora = relogio(state.save, action.agora);
      const resultado = iniciarPreparo(state.save, {
        id: gerarId(criarRng(action.semente)),
        receitaId: action.receitaId,
        porcoes: action.porcoes,
        agora,
      });
      if (resultado.erro) return comAviso(state, resultado.erro);
      return { ...state, save: registrarRelogio(resultado.save, agora) };
    }

    case "COMER":
      return alterarSave(state, comer(state.save, action.itemId));

    case "COMPRAR_RECEITA": {
      if (!state.save) return state;
      const resultado = comprarReceita(state.save, relogio(state.save, action.agora));
      if (resultado.erro) return comAviso(state, resultado.erro);
      return comAviso({ ...state, save: resultado.save }, `Você aprendeu a receita ${resultado.receita.nome}.`);
    }

    case "FORJAR": {
      if (!state.save) return state;
      const resultado = forjar(state.save, { zonaId: action.zonaId, slot: action.slot, tipo: action.tipo }, criarRng(action.semente));
      if (resultado.erro) return comAviso(state, resultado.erro);
      return comAviso({ ...state, save: resultado.save }, `Forjado: ${resultado.item.nome} (${resultado.item.raridade}).`);
    }

    case "APRIMORAR": {
      if (!state.save) return state;
      const resultado = aprimorar(state.save, action.equipamentoId);
      if (resultado.erro) return comAviso(state, resultado.erro);
      return comAviso({ ...state, save: resultado.save }, `${resultado.item.nome} agora é +${resultado.item.aprimoramento}.`);
    }

    case "COLOCAR_NO_GRUPO":
      return alterarSave(state, colocarNoGrupo(state.save, action.heroiId));

    case "TIRAR_DO_GRUPO":
      return alterarSave(state, tirarDoGrupo(state.save, action.heroiId));

    case "DISPENSAR_HEROI": {
      if (!state.save) return state;
      const resultado = dispensarHeroi(state.save, action.heroiId);
      if (resultado.erro) return comAviso(state, resultado.erro);
      const itens = resultado.equipamentos === 1 ? "1 equipamento voltou" : `${resultado.equipamentos} equipamentos voltaram`;
      return comAviso({ ...state, save: resultado.save }, `${resultado.heroi.nome} deixou a companhia. ${itens} ao inventário.`);
    }

    case "ABRIR_TAVERNA":
      if (!state.save) return state;
      return {
        ...state,
        tela: "taverna",
        save: muralEmDia(state.save, relogio(state.save, action.agora), criarRng(action.semente)),
      };

    case "CONTRATAR_RECRUTA": {
      if (!state.save) return state;
      const resultado = contratarRecruta(state.save, action.indice, criarRng(action.semente));
      if (resultado.erro) return comAviso(state, resultado.erro);
      const onde = resultado.noGrupo ? "entrou no grupo" : "foi para a reserva";
      return comAviso({ ...state, save: resultado.save }, `${resultado.heroi.nome} ${onde}.`);
    }

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

    case "AUTO_LIGAR":
    case "AUTO_PAUSAR":
    case "AUTO_RETOMAR":
    case "AUTO_PARAR":
    case "AUTO_AGIR":
    case "AUTO_PROXIMO":
      return reduzirAuto(state, action);

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Auto (SPEC.md §3.13): só dispara os fluxos de sempre (agir, iniciar encontro, descer andar)
// ---------------------------------------------------------------------------

const TELAS_DO_AUTO = ["batalha", "resultado", "masmorra"];
const MOTIVO_RECARREGOU = "A página foi recarregada. Confira a batalha e retome o Auto quando quiser.";

// Em qual jogo o Auto estava ligado (config do aparelho), para pausar ao voltar depois de recarregar
function marcaDoJogo(state) {
  return { slot: state.slotAtivo, criadoEm: state.save.criadoEm };
}

function comMarca(state, marca) {
  return { ...state, config: { ...state.config, autoRetomar: marca } };
}

function autoAgir(state) {
  const { save, auto } = state;
  if (auto.estado !== "ativo" || state.tela !== "batalha" || !save?.batalha) return state;
  if (state.batalhaUi.eventos.length > 0 || save.batalha.fase !== "escolhaAcao") return state;

  const vidaBaixa =
    auto.vidaLiberadaNaBatalha === save.batalha.id ? null : motivoVidaBaixa(save.batalha, state.config.autoVidaMinima);
  if (vidaBaixa) return { ...state, auto: pausarAuto(auto, vidaBaixa) };

  let acao;
  let depois;
  try {
    acao = escolherAcaoAuto(save.batalha);
    depois = acao ? agir(state, acao) : null;
  } catch {
    acao = null; // erro do motor num estado que ele não esperava: para em vez de repetir
  }
  if (!acao || !depois) return { ...state, auto: encerrarAuto(auto, "Estado inesperado: o Auto não encontrou uma ação válida.") };
  // Ação recusada: nada mudou no save; para em vez de tentar de novo
  if (depois.save === save) return { ...depois, auto: encerrarAuto(auto, `O motor recusou a ação: ${depois.aviso}`) };
  if (!depois.resumoBatalha || depois.resumoBatalha === state.resumoBatalha) return depois;

  // A batalha acabou neste passo: as recompensas já estão no save (finalizarSeTerminou)
  const sessao = contabilizarBatalha(auto.sessao, depois.resumoBatalha, depois.save.ouro - save.ouro);
  const proximoAuto = { ...auto, sessao };
  const derrota = depois.resumoBatalha.resultado === "derrota";
  return { ...depois, auto: derrota ? encerrarAuto(proximoAuto, "Derrota: o grupo recuou.") : proximoAuto };
}

function autoProximo(state, { semente }) {
  const { save, auto } = state;
  if (auto.estado !== "ativo" || !save) return state;
  if (state.tela === "masmorra" && save.batalha) return { ...state, tela: "batalha", batalhaUi: UI_BATALHA_VAZIA };
  const noResultado = state.tela === "resultado";
  if (!noResultado && !(state.tela === "masmorra" && save.masmorraAtual)) return state;

  const sempreValem = { autoPararChefe: false, autoPararInventario: false, autoVidaMinima: 0, autoLimiteEncontros: 0 };
  const decisao = decidirProximo(
    save,
    { resumo: noResultado ? state.resumoBatalha : null, encontrosNoTrecho: auto.sessao.concluidosNoTrecho },
    auto.liberarProximo ? sempreValem : state.config,
  );
  if (decisao.motivo) {
    return {
      ...state,
      auto: decisao.obrigatorio ? encerrarAuto(auto, decisao.motivo) : pausarAuto(auto, decisao.motivo, { opcional: true }),
    };
  }

  const fechado = { ...state, resumoBatalha: null, tela: save.masmorraAtual ? "masmorra" : "mapa" };
  const iniciado =
    decisao.proximo.tipo === "andar"
      ? descerAndar(fechado, { semente })
      : iniciarEncontro(fechado, { zonaId: decisao.proximo.zonaId, semente });
  if (iniciado.tela !== "batalha") {
    return { ...state, auto: encerrarAuto(auto, `Não foi possível começar o próximo encontro: ${iniciado.aviso}`) };
  }
  return {
    ...iniciado,
    auto: { ...auto, sessao: contarEncontro(auto.sessao), vidaLiberadaNaBatalha: null, liberarProximo: false },
  };
}

function reduzirAuto(state, action) {
  const { auto } = state;
  const naTelaDoAuto = Boolean(state.save) && TELAS_DO_AUTO.includes(state.tela);
  switch (action.type) {
    case "AUTO_LIGAR":
      if (!naTelaDoAuto || auto.estado === "ativo" || auto.estado === "pausado") return state;
      return { ...comMarca(state, marcaDoJogo(state)), auto: ligarAuto(auto, action.agora, Boolean(state.save.batalha)) };
    case "AUTO_PAUSAR":
      return { ...state, auto: pausarAuto(auto, action.motivo ?? "Pausado por você.") };
    case "AUTO_RETOMAR":
      if (!naTelaDoAuto || auto.estado !== "pausado") return state;
      return {
        ...comMarca(state, marcaDoJogo(state)),
        auto: retomarAuto(auto, action.agora, {
          batalhaId: state.tela === "batalha" ? state.save.batalha?.id ?? null : null,
          comBatalha: Boolean(state.save.batalha),
        }),
      };
    case "AUTO_PARAR": {
      if (auto.estado === "desligado") return state;
      const parado = { ...comMarca(state, null), auto: AUTO_DESLIGADO };
      return auto.sessao ? comAviso(parado, `Auto parado: ${resumirSessao(auto.sessao)}.`) : parado;
    }
    case "AUTO_AGIR":
      return autoAgir(state);
    case "AUTO_PROXIMO":
      return autoProximo(state, action);
    default:
      return state;
  }
}

// Depois de cada ação: sair da batalha, do resultado e da masmorra desliga o Auto; voltar a essas
// telas no jogo em que ele estava ligado antes de recarregar a página mostra o Auto pausado.
// Fechar o slot apaga a marca: outro jogo nunca herda o Auto.
function ajustarAuto(antes, depois, action) {
  if (!depois.auto || !depois.config) return depois; // estados parciais (testes de outras telas)
  if (action.type === "FECHAR_SLOT") return comMarca({ ...depois, auto: AUTO_DESLIGADO }, null);
  const naTela = TELAS_DO_AUTO.includes(depois.tela);
  if (depois.auto.estado !== "desligado" && (!naTela || !depois.save)) {
    return { ...comMarca(depois, null), auto: AUTO_DESLIGADO };
  }
  const marca = depois.config.autoRetomar;
  const entrou = naTela && !TELAS_DO_AUTO.includes(antes.tela);
  if (
    entrou &&
    depois.auto.estado === "desligado" &&
    marca &&
    depois.save &&
    marca.slot === depois.slotAtivo &&
    marca.criadoEm === depois.save.criadoEm
  ) {
    return { ...depois, auto: autoPausadoAoVoltar(MOTIVO_RECARREGOU) };
  }
  return depois;
}

export function reducer(state, action) {
  return ajustarAuto(state, reducerBase(state, action), action);
}
