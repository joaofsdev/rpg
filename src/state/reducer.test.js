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
