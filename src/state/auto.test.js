// Auto (SPEC.md §3.13) no reducer: o "jogador" aqui é o próprio orquestrador. O laço faz o papel da
// interface (FILA_CONCLUIDA ao fim de cada animação) e do agendador (o que ele pediria).
import { describe, it, expect } from "vitest";
import { reducer, criarEstadoInicial } from "./reducer";
import { proximoPedido } from "./agendadorAuto";
import { SEM_PARADAS, aplicar, jogo, explorar, ligar } from "./__fixtures__/auto";
import { CONFIG_PADRAO } from "../save/armazenamento";
import { validarSave } from "../save/formato";
import { migrarContaV1 } from "../save/migracaoV1";
import usuariosV1 from "../save/__fixtures__/rpgUsersV1.json";
import { equipamentosLivres } from "../engine/inventario";
import { criarRng } from "../engine/rng";
import { MAX_EQUIPAMENTOS_INVENTARIO, ANDARES_MASMORRA } from "../data/constants";


let sementes = 100;
// Um passo do Auto como a interface e o orquestrador fariam
function passo(state) {
  const pedido = proximoPedido(state);
  if (pedido === "agir") return reducer(state, { type: "AUTO_AGIR" });
  if (pedido === "fila") return reducer(state, { type: "FILA_CONCLUIDA" });
  if (pedido === "proximo") return reducer(state, { type: "AUTO_PROXIMO", semente: (sementes += 1) });
  if (state.tela === "batalha" && state.batalhaUi.eventos.length > 0) return reducer(state, { type: "FILA_CONCLUIDA" });
  return state;
}

// Roda até o Auto sair de "ativo", até `parar(state)` ou até o limite de passos
function rodar(state, { parar = () => false, limite = 20000, aoFimDeBatalha } = {}) {
  let atual = state;
  for (let i = 0; i < limite && atual.auto.estado === "ativo" && !parar(atual); i++) {
    const antes = atual;
    atual = passo(atual);
    if (aoFimDeBatalha && atual.resumoBatalha && atual.resumoBatalha !== antes.resumoBatalha) aoFimDeBatalha(atual);
    if (atual === antes) throw new Error(`Auto parado sem motivo na tela ${atual.tela}`);
  }
  return atual;
}

const naTela = (tela) => (s) => s.tela === tela;

describe("Auto: batalha, recompensas e próximo encontro", () => {
  it("resolve a batalha sem intervenção, guarda as recompensas uma vez e começa o próximo encontro", () => {
    let state = ligar(explorar(jogo({ config: SEM_PARADAS })));
    const antes = state.save;
    expect(state.auto.sessao.encontro).toBe(1);
    state = rodar(state, { parar: naTela("resultado") });
    const r = state.resumoBatalha;
    expect(r.resultado).toBe("vitoria");
    expect(state.save.batalha).toBeNull();
    expect(state.save.ouro - antes.ouro).toBe(state.auto.sessao.ouro);
    expect(state.save.estatisticas.encontrosVencidos - (antes.estatisticas.encontrosVencidos ?? 0)).toBe(1);
    expect(state.auto.sessao).toMatchObject({ vitorias: 1, derrotas: 0, xp: r.xp, concluidosNoTrecho: 1 });

    // Pedidos repetidos ou fora de hora não fazem nada
    expect(reducer(state, { type: "AUTO_AGIR" })).toBe(state);
    const proximo = reducer(state, { type: "AUTO_PROXIMO", semente: 1 });
    expect(proximo.tela).toBe("batalha");
    expect(proximo.save.batalha.origem).toMatchObject({ tipo: "zona", zonaId: "cemiterio", chefe: false });
    expect(proximo.auto.sessao.encontro).toBe(2);
    expect(reducer(proximo, { type: "AUTO_PROXIMO", semente: 2 })).toBe(proximo);
  });

  it("farm longo: 120 encontros seguidos, sem limite fixo, com estado íntegro e contas da sessão batendo", () => {
    let state = ligar(explorar(jogo({ config: SEM_PARADAS })));
    const antes = state.save;
    let xpDosResultados = 0;
    let resultados = 0;
    state = rodar(state, {
      parar: (s) => s.auto.sessao.vitorias + s.auto.sessao.derrotas >= 120,
      aoFimDeBatalha: (s) => {
        resultados += 1;
        if (s.resumoBatalha.resultado === "vitoria") xpDosResultados += s.resumoBatalha.xp;
      },
    });
    const { sessao } = state.auto;
    expect(state.auto.estado).toBe("ativo");
    expect(sessao.vitorias).toBe(120);
    expect(resultados).toBe(120);
    expect(sessao.xp).toBe(xpDosResultados);
    expect(state.save.ouro - antes.ouro).toBe(sessao.ouro);
    expect(state.save.estatisticas.encontrosVencidos - (antes.estatisticas.encontrosVencidos ?? 0)).toBe(120);
    expect(validarSave(state.save)).toEqual([]);
    expect(equipamentosLivres(state.save).length).toBeLessThanOrEqual(MAX_EQUIPAMENTOS_INVENTARIO);
    expect(sessao.encontro).toBeGreaterThanOrEqual(120);
  });
});

describe("Auto: paradas", () => {
  it("derrota encerra o Auto e nada começa sozinho", () => {
    let state = explorar(jogo({ nivel: 1, config: SEM_PARADAS }));
    const herois = Object.fromEntries(
      Object.entries(state.save.batalha.combatentes).map(([id, c]) => [id, c.lado === "herois" ? { ...c, hpAtual: 1 } : c]),
    );
    state = ligar({ ...state, save: { ...state.save, batalha: { ...state.save.batalha, combatentes: herois } } });
    state = rodar(state);
    expect(state.auto).toMatchObject({ estado: "encerrado", motivo: "Derrota: o grupo recuou." });
    expect(state.auto.sessao.derrotas).toBe(1);
    expect(proximoPedido(state)).toBeNull();
    expect(reducer(state, { type: "AUTO_PROXIMO", semente: 1 })).toBe(state);
    expect(reducer(state, { type: "AUTO_RETOMAR", agora: 1 })).toBe(state);
  });

  it("inventário cheio pausa antes do próximo; retomar passa uma vez e a parada volta a valer", () => {
    let state = explorar(jogo({ config: { ...SEM_PARADAS, autoPararInventario: true } }));
    const base = Object.values(state.save.inventario.equipamentos)[0];
    const cheio = { ...state.save.inventario.equipamentos };
    for (let i = 0; i < MAX_EQUIPAMENTOS_INVENTARIO; i++) cheio[`x${i}`] = { ...base, id: `x${i}` };
    state = ligar({ ...state, save: { ...state.save, inventario: { ...state.save.inventario, equipamentos: cheio } } });
    state = rodar(state);
    expect(state.tela).toBe("resultado");
    expect(state.auto).toMatchObject({ estado: "pausado", pausaOpcional: true });
    expect(state.auto.motivo).toMatch(/Inventário cheio/);
    expect(equipamentosLivres(state.save).length).toBe(MAX_EQUIPAMENTOS_INVENTARIO);

    state = reducer(state, { type: "AUTO_RETOMAR", agora: 5 });
    state = passo(state);
    expect(state.tela).toBe("batalha");
    state = rodar(state);
    expect(state.auto.motivo).toMatch(/Inventário cheio/);
  });

  it("para quando o chefe da zona aparece (padrão) e segue explorando ao retomar, sem iniciar o chefe", () => {
    let state = jogo({ config: { ...SEM_PARADAS, autoPararChefe: true } });
    state.save.progresso.zonas.cemiterio.encontrosVencidos = 9;
    state = rodar(ligar(explorar(state)));
    expect(state.auto.motivo).toBe("O chefe de Cemitério Antigo apareceu.");
    state = passo(reducer(state, { type: "AUTO_RETOMAR", agora: 5 }));
    expect(state.save.batalha.origem.chefe).toBe(false);
  });

  it("limite de encontros conta desde que foi ligado ou retomado", () => {
    let state = rodar(ligar(explorar(jogo({ config: { ...SEM_PARADAS, autoLimiteEncontros: 10 } }))));
    expect(state.auto.motivo).toBe("Limite de 10 encontros atingido.");
    expect(state.auto.sessao.vitorias).toBe(10);
    state = rodar(reducer(state, { type: "AUTO_RETOMAR", agora: 5 }));
    expect(state.auto.sessao.vitorias).toBe(20);
  });

  it("chefe vencido encerra: o Auto não repete chefes", () => {
    let state = jogo({ config: SEM_PARADAS });
    state.save.progresso.zonas.cemiterio.encontrosVencidos = 10;
    state = reducer(state, { type: "INICIAR_ENCONTRO", zonaId: "cemiterio", chefe: true, semente: 4 });
    state = rodar(ligar(state));
    expect(state.auto.estado).toBe("encerrado");
    expect(state.auto.motivo).toMatch(/chefe foi vencido/);
  });

  it("vida baixa pausa durante a batalha; ao retomar, a mesma batalha não pausa de novo", () => {
    let state = explorar(jogo({ config: { ...SEM_PARADAS, autoVidaMinima: 0.5 } }));
    const [id, heroi] = Object.entries(state.save.batalha.combatentes).find(([, c]) => c.lado === "herois");
    const combatentes = { ...state.save.batalha.combatentes, [id]: { ...heroi, hpAtual: Math.floor(heroi.hpMax * 0.3) } };
    state = ligar({ ...state, save: { ...state.save, batalha: { ...state.save.batalha, combatentes } } });
    state = passo(state);
    expect(state.auto.estado).toBe("pausado");
    expect(state.auto.motivo).toMatch(/^Vida baixa: .+ está com \d+% da vida\.$/);
    state = reducer(state, { type: "AUTO_RETOMAR", agora: 5 });
    const depois = passo(state);
    expect(depois.auto.estado).toBe("ativo");
    expect(depois.save).not.toBe(state.save);
  });

  it("masmorra: desce os andares, pausa antes do chefe e encerra ao concluir", () => {
    let state = jogo({ config: { ...SEM_PARADAS, autoPararChefe: true } });
    state.save.progresso.masmorras.cripta_esquecida.desbloqueada = true;
    state = aplicar(state, { type: "ENTRAR_MASMORRA", zonaId: "cemiterio" }, { type: "DESCER_ANDAR", semente: 8 });
    state = rodar(ligar(state));
    expect(state.auto.motivo).toBe("O próximo andar é o do chefe.");
    expect(state.save.masmorraAtual.andar).toBe(ANDARES_MASMORRA);
    expect(state.auto.sessao.vitorias).toBe(ANDARES_MASMORRA - 1);
    state = rodar(reducer(state, { type: "AUTO_RETOMAR", agora: 5 }));
    expect(state.auto).toMatchObject({ estado: "encerrado", motivo: "Masmorra concluída." });
    expect(state.save.masmorraAtual).toBeNull();
    expect(state.save.progresso.masmorras.cripta_esquecida.concluida).toBe(true);
  });

  it("estado inesperado encerra em vez de repetir ações inválidas", () => {
    let state = ligar(explorar(jogo({ config: SEM_PARADAS })));
    const inimigo = Object.values(state.save.batalha.combatentes).find((c) => c.lado === "inimigos");
    state = { ...state, save: { ...state.save, batalha: { ...state.save.batalha, ativoId: inimigo.id } } };
    state = reducer(state, { type: "AUTO_AGIR" });
    expect(state.auto.estado).toBe("encerrado");
    expect(state.auto.motivo).toMatch(/Estado inesperado/);
  });
});

describe("Auto: pausar, parar, retomar", () => {
  it("pausado não age; retomar continua do estado atual", () => {
    let state = reducer(ligar(explorar(jogo())), { type: "AUTO_PAUSAR" });
    expect(state.auto).toMatchObject({ estado: "pausado", motivo: "Pausado por você." });
    expect(proximoPedido(state)).toBeNull();
    expect(reducer(state, { type: "AUTO_AGIR" })).toBe(state);
    const batalha = state.save.batalha;
    state = reducer(state, { type: "AUTO_RETOMAR", agora: 5 });
    expect(state.save.batalha).toBe(batalha);
    expect(state.auto.sessao.encontro).toBe(1);
    expect(passo(state).save.batalha.turnoGlobal).toBeGreaterThan(batalha.turnoGlobal);
  });

  it("página oculta não pausa: o Auto não espera a interface animar, e o jogo sai igual ao visível", () => {
    const inicio = ligar(explorar(jogo({ config: SEM_PARADAS })));
    const agiu = reducer(inicio, { type: "AUTO_AGIR" });
    expect(agiu.batalhaUi.eventos.length).toBeGreaterThan(0);
    expect(proximoPedido(agiu)).toBeNull(); // visível: a interface avisa quando a animação termina
    expect(proximoPedido(agiu, { oculta: true })).toBe("fila"); // oculta: o Auto encerra a fila

    // Duas batalhas inteiras, uma visível e outra oculta: mesmas ações, mesmo save
    const oculto = (state) => {
      const pedido = proximoPedido(state, { oculta: true });
      if (pedido === "agir") return reducer(state, { type: "AUTO_AGIR" });
      if (pedido === "fila") return reducer(state, { type: "FILA_CONCLUIDA" });
      return state;
    };
    const ate = (state, fn) => {
      for (let i = 0; i < 1000 && state.tela !== "resultado"; i++) state = fn(state);
      return state;
    };
    const visivel = ate(inicio, passo);
    const escondido = ate(inicio, oculto);
    expect(escondido.tela).toBe("resultado");
    expect(escondido.save).toEqual(visivel.save);
    expect(escondido.auto).toEqual(visivel.auto);
    expect(proximoPedido(escondido, { oculta: true })).toBe("proximo");
  });

  it("parar durante a animação: a ação já confirmada termina, nenhuma nova começa, e o manual volta", () => {
    let state = passo(ligar(explorar(jogo())));
    expect(state.batalhaUi.eventos.length).toBeGreaterThan(0);
    state = reducer(state, { type: "AUTO_PARAR" });
    expect(state.auto.estado).toBe("desligado");
    expect(state.config.autoRetomar).toBeNull();
    expect(state.aviso).toMatch(/^Auto parado: 0 vitórias, 0 ouro\.$/);
    state = reducer(state, { type: "FILA_CONCLUIDA" });
    expect(reducer(state, { type: "AUTO_AGIR" })).toBe(state);
    const manual = reducer(state, { type: "ACAO_BATALHA", acao: { tipo: "defender" } });
    expect(manual.save.batalha.turnoGlobal).toBeGreaterThan(state.save.batalha.turnoGlobal);
  });

  it("sair para outra tela desliga o Auto e apaga a marca", () => {
    let state = rodar(ligar(explorar(jogo({ config: SEM_PARADAS }))), { parar: naTela("resultado") });
    expect(state.config.autoRetomar).toEqual({ slot: 0, criadoEm: state.save.criadoEm });
    state = reducer(state, { type: "NAVEGAR", tela: "inventario" });
    expect(state.auto.estado).toBe("desligado");
    expect(state.config.autoRetomar).toBeNull();
  });
});

describe("Auto: recarregar e trocar de slot", () => {
  // Recarregar = estado inicial novo com a config e o save gravados
  function recarregar(state, slot = 0) {
    const gravado = JSON.parse(JSON.stringify(state.save));
    return aplicar(
      criarEstadoInicial(),
      { type: "INICIADO", slots: [], config: state.config },
      { type: "SAVE_ABERTO", slot, save: gravado, agora: 999999 },
    );
  }

  it("no meio da batalha: volta pausado com 'Retomar', sem repetir ação nem recompensa", () => {
    let state = ligar(explorar(jogo({ config: SEM_PARADAS })));
    state = rodar(state, { parar: (s) => s.save.batalha?.turnoGlobal > 2 && s.batalhaUi.eventos.length === 0 });
    const vencidosAntes = state.save.estatisticas.encontrosVencidos ?? 0;
    let novo = recarregar(state);
    expect(novo.tela).toBe("mapa");
    expect(novo.auto.estado).toBe("desligado");
    novo = reducer(novo, { type: "RETOMAR_BATALHA" });
    expect(novo.auto).toMatchObject({ estado: "pausado", sessao: null });
    expect(novo.auto.motivo).toMatch(/recarregada/);
    expect(novo.save.batalha.turnoGlobal).toBe(state.save.batalha.turnoGlobal);
    expect(reducer(novo, { type: "AUTO_AGIR" })).toBe(novo);

    novo = reducer(novo, { type: "AUTO_RETOMAR", agora: 5 });
    expect(novo.auto.sessao).toMatchObject({ encontro: 1, vitorias: 0 });
    novo = rodar(novo, { parar: naTela("resultado") });
    expect(novo.save.estatisticas.encontrosVencidos - vencidosAntes).toBe(1);
  });

  it("depois do fim da batalha: as recompensas já gravadas não voltam a ser dadas", () => {
    const state = rodar(ligar(explorar(jogo({ config: SEM_PARADAS }))), { parar: naTela("resultado") });
    const novo = reducer(recarregar(state), { type: "RETOMAR_BATALHA" });
    expect(novo.save.batalha).toBeNull();
    expect(novo.save.ouro).toBe(state.save.ouro);
    expect(novo.tela).toBe("mapa");
  });

  it("outro slot não herda o Auto; fechar o slot apaga a marca", () => {
    const state = rodar(ligar(explorar(jogo({ config: SEM_PARADAS }))), { parar: (s) => s.save.batalha?.turnoGlobal > 1 });
    const outro = reducer(recarregar(state, 1), { type: "RETOMAR_BATALHA" });
    expect(outro.auto.estado).toBe("desligado");

    const fechado = reducer(state, { type: "FECHAR_SLOT", slots: [] });
    expect(fechado.auto.estado).toBe("desligado");
    expect(fechado.config.autoRetomar).toBeNull();
    expect(reducer(recarregar({ ...state, config: fechado.config }), { type: "RETOMAR_BATALHA" }).auto.estado).toBe("desligado");
  });

  it("jogo novo no mesmo slot não herda o Auto", () => {
    const state = rodar(ligar(explorar(jogo({ config: SEM_PARADAS }))), { parar: (s) => s.save.batalha?.turnoGlobal > 1 });
    const outroJogo = { ...state.save, criadoEm: state.save.criadoEm + 1 };
    const novo = reducer(recarregar({ ...state, save: outroJogo }), { type: "RETOMAR_BATALHA" });
    expect(novo.auto.estado).toBe("desligado");
  });
});

describe("Auto: saves antigos", () => {
  it("um save migrado do formato antigo joga 10 encontros com o Auto", () => {
    const [username] = Object.keys(usuariosV1).filter((u) => usuariosV1[u].character);
    const save = migrarContaV1(username, usuariosV1[username], { agora: 5000, rng: criarRng(9) });
    let state = aplicar(
      criarEstadoInicial(),
      { type: "INICIADO", slots: [], config: { ...CONFIG_PADRAO, ...SEM_PARADAS } },
      { type: "SAVE_ABERTO", slot: 0, save, agora: 6000 },
    );
    const zonaId = Object.keys(state.save.progresso.zonas).find((id) => state.save.progresso.zonas[id].desbloqueada);
    state = ligar(reducer(state, { type: "INICIAR_ENCONTRO", zonaId, semente: 3 }));
    state = rodar(state, { parar: (s) => s.auto.sessao.vitorias + s.auto.sessao.derrotas >= 10 });
    expect(state.auto.sessao.vitorias + state.auto.sessao.derrotas).toBeGreaterThanOrEqual(state.auto.estado === "ativo" ? 10 : 1);
    expect(validarSave(state.save)).toEqual([]);
  });
});
