import { describe, it, expect } from "vitest";
import { reducer, criarEstadoInicial } from "./reducer";

function aplicar(state, ...acoes) {
  return acoes.reduce(reducer, state);
}

function jogoNovo() {
  let state = aplicar(criarEstadoInicial(), { type: "INICIADO", slots: [], config: criarEstadoInicial().config });
  state = reducer(state, { type: "ABRIR_NOVO_JOGO", slot: 0, semente: 5 });
  return reducer(state, {
    type: "CRIAR_JOGO",
    nomeHeroi: "  Ana  ",
    classeId: state.novoJogo.classes[0],
    agora: 1000,
    semente: 9,
  });
}

function emBatalha(semente = 3) {
  return reducer(jogoNovo(), { type: "INICIAR_ENCONTRO", zonaId: "cemiterio", semente });
}

function terminarAnimacao(state) {
  return reducer(state, { type: "FILA_CONCLUIDA" });
}

// Joga defendendo até a batalha acabar (ou atingir o limite)
function defenderAteOFim(state) {
  let atual = state;
  for (let i = 0; i < 200 && atual.save.batalha; i++) {
    atual = terminarAnimacao(reducer(atual, { type: "ACAO_BATALHA", acao: { tipo: "defender" } }));
  }
  return atual;
}

describe("novo jogo", () => {
  it("sorteia 3 classes e cria o save no slot escolhido", () => {
    const state = jogoNovo();
    expect(state.tela).toBe("mapa");
    expect(state.slotAtivo).toBe(0);
    expect(state.save.herois[state.save.grupo[0]].nome).toBe("Ana");
    expect(state.save.grupo).toHaveLength(2);
  });

  it("recusa nome vazio e classe fora do sorteio", () => {
    let state = reducer(criarEstadoInicial(), { type: "ABRIR_NOVO_JOGO", slot: 1, semente: 5 });
    const fora = ["cavaleiro", "arqueiro", "mago", "assassino", "bardo", "barbaro"].find(
      (c) => !state.novoJogo.classes.includes(c),
    );
    expect(reducer(state, { type: "CRIAR_JOGO", nomeHeroi: " ", classeId: state.novoJogo.classes[0], agora: 1, semente: 1 }).aviso).toBeTruthy();
    expect(reducer(state, { type: "CRIAR_JOGO", nomeHeroi: "Bia", classeId: fora, agora: 1, semente: 1 }).save).toBeNull();
  });
});

describe("batalha", () => {
  it("inicia um encontro com animação dos primeiros turnos", () => {
    const state = emBatalha();
    expect(state.tela).toBe("batalha");
    expect(state.save.batalha.fase).toBe("escolhaAcao");
    expect(state.batalhaUi.inicial).toBeTruthy();
    expect(state.batalhaUi.eventos.length).toBeGreaterThan(0);
  });

  it("ignora ações enquanto a animação não terminou", () => {
    const state = emBatalha();
    const depois = reducer(state, { type: "ACAO_BATALHA", acao: { tipo: "defender" } });
    expect(depois).toBe(state);
  });

  it("aceita a ação depois da animação e guarda o estado anterior para animar", () => {
    const state = terminarAnimacao(emBatalha());
    const depois = reducer(state, { type: "ACAO_BATALHA", acao: { tipo: "defender" } });
    expect(depois.batalhaUi.inicial).toBe(state.save.batalha);
    expect(depois.batalhaUi.eventos.length).toBeGreaterThan(0);
  });

  it("consome o item usado", () => {
    const state = terminarAnimacao(emBatalha());
    const ativo = state.save.batalha.ativoId;
    const depois = reducer(state, {
      type: "ACAO_BATALHA",
      acao: { tipo: "item", itemId: "pocao_pequena", alvoId: ativo },
    });
    expect(depois.save.inventario.itens.pocao_pequena).toBe(2);
  });

  it("recusa item que acabou", () => {
    let state = terminarAnimacao(emBatalha());
    state = { ...state, save: { ...state.save, inventario: { ...state.save.inventario, itens: {} } } };
    const depois = reducer(state, {
      type: "ACAO_BATALHA",
      acao: { tipo: "item", itemId: "pocao_pequena", alvoId: state.save.batalha.ativoId },
    });
    expect(depois.aviso).toMatch(/item/);
  });

  it("não deixa enfrentar o chefe antes da hora nem abrir duas batalhas", () => {
    const state = jogoNovo();
    expect(reducer(state, { type: "INICIAR_ENCONTRO", zonaId: "cemiterio", chefe: true, semente: 1 }).aviso).toMatch(/chefe/);
    expect(reducer(state, { type: "INICIAR_ENCONTRO", zonaId: "minas", semente: 1 }).aviso).toBeTruthy();
    const batalhando = emBatalha();
    expect(reducer(batalhando, { type: "INICIAR_ENCONTRO", zonaId: "cemiterio", semente: 2 }).aviso).toMatch(/andamento/);
  });

  it("sair mantém a batalha salva e retomar volta a ela", () => {
    let state = terminarAnimacao(emBatalha());
    state = reducer(state, { type: "SAIR_DA_BATALHA" });
    expect(state.tela).toBe("mapa");
    expect(state.save.batalha).toBeTruthy();
    state = reducer(state, { type: "RETOMAR_BATALHA" });
    expect(state.tela).toBe("batalha");
  });

  it("ao terminar aplica o resultado no save e mostra o resumo depois da animação", () => {
    const state = defenderAteOFim(terminarAnimacao(emBatalha()));
    expect(state.save.batalha).toBeNull();
    expect(state.tela).toBe("resultado");
    expect(["vitoria", "derrota"]).toContain(state.resumoBatalha.resultado);
    expect(state.resumoBatalha.origem.zonaId).toBe("cemiterio");

    const fechado = reducer(state, { type: "FECHAR_RESULTADO" });
    expect(fechado.tela).toBe("mapa");
  });

  it("fugir encerra sem recompensas e conta a fuga", () => {
    let state = terminarAnimacao(emBatalha());
    state = terminarAnimacao(reducer(state, { type: "ACAO_BATALHA", acao: { tipo: "fugir" } }));
    expect(state.resumoBatalha.resultado).toBe("fuga");
    expect(state.save.estatisticas.fugas).toBe(1);
  });
});

describe("grupo e inventário", () => {
  it("erros do motor viram aviso sem mudar o save", () => {
    const state = jogoNovo();
    const depois = reducer(state, { type: "EQUIPAR", heroiId: state.save.grupo[0], equipamentoId: "nao-existe" });
    expect(depois.aviso).toBeTruthy();
    expect(depois.save).toBe(state.save);
  });

  it("navega só para telas de jogo com save aberto", () => {
    expect(reducer(criarEstadoInicial(), { type: "NAVEGAR", tela: "grupo" }).tela).toBe("carregando");
    expect(reducer(jogoNovo(), { type: "NAVEGAR", tela: "grupo" }).tela).toBe("grupo");
    expect(reducer(jogoNovo(), { type: "NAVEGAR", tela: "batalha" }).tela).toBe("mapa");
  });
});

describe("masmorra", () => {
  function comMasmorraAberta() {
    const state = jogoNovo();
    const save = state.save;
    return {
      ...state,
      save: {
        ...save,
        progresso: {
          ...save.progresso,
          masmorras: { ...save.progresso.masmorras, cripta_esquecida: { desbloqueada: true, concluida: false, melhorAndar: 0 } },
        },
      },
    };
  }

  it("não entra em masmorra fechada", () => {
    expect(reducer(jogoNovo(), { type: "ENTRAR_MASMORRA", zonaId: "cemiterio" }).aviso).toMatch(/chefe/);
  });

  it("entra, desce para o andar 1 e volta para a masmorra depois do resultado", () => {
    let state = reducer(comMasmorraAberta(), { type: "ENTRAR_MASMORRA", zonaId: "cemiterio" });
    expect(state.tela).toBe("masmorra");
    state = reducer(state, { type: "DESCER_ANDAR", semente: 4 });
    expect(state.tela).toBe("batalha");
    expect(state.save.batalha.origem).toMatchObject({ tipo: "masmorra", andar: 1, chefe: false });

    state = terminarAnimacao(reducer(terminarAnimacao(state), { type: "ACAO_BATALHA", acao: { tipo: "fugir" } }));
    expect(state.resumoBatalha.masmorra.tipo).toBe("saiu");
    expect(state.save.masmorraAtual).toBeNull();
    expect(reducer(state, { type: "FECHAR_RESULTADO" }).tela).toBe("mapa");
  });

  it("sair da masmorra entre andares volta ao mapa", () => {
    let state = reducer(comMasmorraAberta(), { type: "ENTRAR_MASMORRA", zonaId: "cemiterio" });
    state = reducer(state, { type: "SAIR_DA_MASMORRA" });
    expect(state.tela).toBe("mapa");
    expect(state.save.masmorraAtual).toBeNull();
  });

  it("navega para a masmorra só se houver uma em andamento", () => {
    expect(reducer(jogoNovo(), { type: "NAVEGAR", tela: "masmorra" }).tela).toBe("mapa");
    const dentro = reducer(comMasmorraAberta(), { type: "ENTRAR_MASMORRA", zonaId: "cemiterio" });
    const noMapa = reducer(dentro, { type: "NAVEGAR", tela: "mapa" });
    expect(reducer(noMapa, { type: "NAVEGAR", tela: "masmorra" }).tela).toBe("masmorra");
  });
});

describe("Fase 7: grupo, treino, retorno e taverna", () => {
  const HORA = 60 * 60 * 1000;

  // Jogo novo com o companheiro (nível 12) na reserva e ouro de sobra
  function comReserva() {
    let state = jogoNovo();
    const reservaId = state.save.grupo[1];
    state = reducer(state, { type: "TIRAR_DO_GRUPO", heroiId: reservaId });
    const herois = { ...state.save.herois, [reservaId]: { ...state.save.herois[reservaId], nivel: 12 } };
    return { state: { ...state, save: { ...state.save, ouro: 100000, herois } }, reservaId };
  }

  function treinando(horas = 2) {
    const { state, reservaId } = comReserva();
    return {
      state: reducer(state, { type: "INICIAR_TREINO", heroiId: reservaId, atributo: "forca", horas, agora: 1000, semente: 1 }),
      reservaId,
    };
  }

  // Simula fechar o jogo e abrir o mesmo save mais tarde
  function reabrir(state, agora) {
    return reducer(state, { type: "SAVE_ABERTO", slot: 0, save: state.save, agora });
  }

  it("tira e põe heróis no grupo, sem deixar o grupo vazio", () => {
    const { state, reservaId } = comReserva();
    expect(state.save.grupo).toHaveLength(1);
    expect(reducer(state, { type: "TIRAR_DO_GRUPO", heroiId: state.save.grupo[0] }).aviso).toMatch(/pelo menos 1/);
    expect(reducer(state, { type: "COLOCAR_NO_GRUPO", heroiId: reservaId }).save.grupo).toHaveLength(2);
  });

  it("inicia treino, cobra o ouro e trava o herói fora do grupo", () => {
    const { state, reservaId } = treinando();
    expect(Object.values(state.save.atividades)).toHaveLength(1);
    expect(state.save.ouro).toBeLessThan(100000);
    expect(reducer(state, { type: "COLOCAR_NO_GRUPO", heroiId: reservaId }).aviso).toBe("Em treino");
  });

  it("abrir o jogo com treino concluído mostra o resumo de retorno com o tempo fora", () => {
    const { state } = treinando(2);
    const aberto = reabrir(state, 1000 + 3 * HORA);
    expect(aberto.retorno).toEqual({ tempoFora: 3 * HORA });
    expect(aberto.save.ultimaVisita).toBe(1000 + 3 * HORA);
  });

  it("abrir o jogo com treino em andamento não mostra o resumo", () => {
    const { state } = treinando(2);
    expect(reabrir(state, 1000 + HORA).retorno).toBeNull();
  });

  it("voltar para a aba mostra o resumo só se algo terminou enquanto estava fora", () => {
    const { state } = treinando(2);
    const cedo = reducer(state, { type: "VOLTOU_AO_JOGO", agora: 1000 + HORA });
    expect(cedo.retorno).toBeNull();
    const depois = reducer(cedo, { type: "VOLTOU_AO_JOGO", agora: 1000 + 2 * HORA });
    expect(depois.retorno).toEqual({ tempoFora: HORA });
    const fechado = reducer(depois, { type: "FECHAR_RETORNO" });
    expect(reducer(fechado, { type: "VOLTOU_AO_JOGO", agora: 1000 + 3 * HORA }).retorno).toBeNull();
  });

  it("coletar tudo entrega os pontos, fecha o resumo e avisa o ganho; repetir não entrega de novo", () => {
    const { state, reservaId } = treinando(2);
    const aberto = reabrir(state, 1000 + 3 * HORA);
    const coletado = reducer(aberto, { type: "COLETAR_TUDO", agora: 1000 + 3 * HORA });
    expect(coletado.save.herois[reservaId].pontosTreino.forca).toBe(2);
    expect(coletado.retorno).toBeNull();
    expect(coletado.aviso).toMatch(/2 pontos de Força/);
    const denovo = reducer(coletado, { type: "COLETAR_TUDO", agora: 1000 + 3 * HORA });
    expect(denovo.save.herois[reservaId].pontosTreino.forca).toBe(2);
  });

  it("coletar a mesma atividade duas vezes (duplo clique) entrega uma vez só", () => {
    const { state, reservaId } = treinando(2);
    const id = Object.keys(state.save.atividades)[0];
    const acao = { type: "COLETAR_ATIVIDADE", atividadeId: id, agora: 1000 + 2 * HORA };
    const duas = aplicar(state, acao, acao);
    expect(duas.save.herois[reservaId].pontosTreino.forca).toBe(2);
  });

  it("relógio do sistema voltando não regride o treino", () => {
    const { state, reservaId } = treinando(2);
    const id = Object.keys(state.save.atividades)[0];
    let atual = reducer(state, { type: "RELOGIO", agora: 1000 + 2 * HORA });
    atual = reducer(atual, { type: "COLETAR_ATIVIDADE", atividadeId: id, agora: 0 });
    expect(atual.save.herois[reservaId].pontosTreino.forca).toBe(2);
  });

  it("taverna gera o mural e contrata um recruta para o grupo", () => {
    const { state } = comReserva();
    const taverna = reducer(state, { type: "ABRIR_TAVERNA", agora: 1000, semente: 3 });
    expect(taverna.tela).toBe("taverna");
    expect(taverna.save.recrutas.opcoes).toHaveLength(3);
    const contratado = reducer(taverna, { type: "CONTRATAR_RECRUTA", indice: 0, semente: 4 });
    expect(Object.keys(contratado.save.herois)).toHaveLength(3);
    expect(contratado.save.grupo).toHaveLength(2);
    expect(contratado.aviso).toMatch(/entrou no grupo/);
    expect(reducer(contratado, { type: "CONTRATAR_RECRUTA", indice: 0, semente: 4 }).aviso).toMatch(/foi embora/);
  });

  it("navega para Atividades", () => {
    expect(reducer(jogoNovo(), { type: "NAVEGAR", tela: "atividades" }).tela).toBe("atividades");
  });
});

describe("dispensar herói", () => {
  it("dispensa com aviso e recusa o último herói do grupo", () => {
    let state = jogoNovo();
    const [principalId, companheiroId] = state.save.grupo;
    const nome = state.save.herois[companheiroId].nome;
    state = reducer(state, { type: "DISPENSAR_HEROI", heroiId: companheiroId });
    expect(state.save.herois[companheiroId]).toBeUndefined();
    expect(state.save.grupo).toEqual([principalId]);
    expect(state.aviso).toBe(`${nome} deixou a companhia. 5 equipamentos voltaram ao inventário.`);
    const recusado = reducer(state, { type: "DISPENSAR_HEROI", heroiId: principalId });
    expect(recusado.save).toBe(state.save);
    expect(recusado.aviso).toMatch(/último herói/);
  });
});

describe("expedições", () => {
  const HORA = 60 * 60 * 1000;

  function viajando(minutos = 60) {
    let state = jogoNovo();
    const reservaId = state.save.grupo[1];
    state = reducer(state, { type: "TIRAR_DO_GRUPO", heroiId: reservaId });
    state = reducer(state, { type: "INICIAR_EXPEDICAO", heroiId: reservaId, zonaId: "cemiterio", minutos, agora: 1000, semente: 8 });
    return { state, reservaId };
  }

  it("parte, trava o herói e mostra o resumo ao reabrir depois do fim", () => {
    const { state, reservaId } = viajando(60);
    expect(Object.values(state.save.atividades)[0]).toMatchObject({ tipo: "expedicao", heroiId: reservaId, duracao: HORA });
    expect(reducer(state, { type: "COLOCAR_NO_GRUPO", heroiId: reservaId }).aviso).toBe("Em expedição");
    const aberto = reducer(state, { type: "SAVE_ABERTO", slot: 0, save: state.save, agora: 1000 + 2 * HORA });
    expect(aberto.retorno).toEqual({ tempoFora: 2 * HORA });
  });

  it("coletar tudo entrega itens, ouro e XP e descreve o ganho", () => {
    const { state, reservaId } = viajando(60);
    const ouroAntes = state.save.ouro;
    const coletado = reducer(state, { type: "COLETAR_TUDO", agora: 1000 + HORA });
    expect(coletado.save.ouro).toBe(ouroAntes + 4 * 5);
    expect(coletado.save.herois[reservaId].xp + coletado.save.herois[reservaId].nivel).toBeGreaterThan(1);
    expect(coletado.aviso).toMatch(/voltou de Cemitério Antigo: 4 itens, 20 ouro e \d+ XP/);
  });

  it("recusa zona bloqueada", () => {
    let state = jogoNovo();
    const reservaId = state.save.grupo[1];
    state = reducer(state, { type: "TIRAR_DO_GRUPO", heroiId: reservaId });
    expect(reducer(state, { type: "INICIAR_EXPEDICAO", heroiId: reservaId, zonaId: "minas", minutos: 60, agora: 1, semente: 1 }).aviso).toBe("Zona bloqueada");
  });
});
