// Auto em segundo plano (SPEC.md §3.13) com relógio controlado: o agendador real, o reducer real e
// os criadores de ação reais. O "navegador" aqui é um documento falso cuja visibilidade muda, e um
// atraso mínimo nos temporizadores enquanto ele está oculto (como os navegadores fazem).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { reducer } from "./reducer";
import { criarAcoes } from "./criarAcoes";
import { criarAgendadorAuto } from "./agendadorAuto";
import { SEM_PARADAS, jogo, explorar, ligar } from "./__fixtures__/auto";
import { validarSave } from "../save/formato";
import { duracaoDaFila } from "../components/battle/duracoes";

const ACOES_DO_AUTO = ["AUTO_AGIR", "AUTO_PROXIMO"];

// Monta o jogo como a página faria: estado global, interface que anima a fila (useReproducao) e
// o agendador ligado ao documento. limiteOculta: menor atraso que o navegador permite oculto.
function montar(state, { limiteOculta = 1000 } = {}) {
  const documento = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const janela = new EventTarget();
  const atraso = (ms) => (documento.visibilityState === "hidden" ? Math.max(ms, limiteOculta) : ms);
  const vivos = new Set();
  const m = { estado: state, despachos: [], criados: 0, maxVivos: 0, filasConcluidas: 0, documento, janela };

  const agendar = (fn, ms) => {
    const t = setTimeout(() => {
      vivos.delete(t);
      fn();
    }, atraso(ms));
    vivos.add(t);
    m.criados += 1;
    m.maxVivos = Math.max(m.maxVivos, vivos.size);
    return t;
  };
  const cancelar = (t) => {
    vivos.delete(t);
    clearTimeout(t);
  };

  let animacao = null;
  let filaAnimada = null;
  const dispatch = (acao) => {
    m.despachos.push(acao.type);
    const novo = reducer(m.estado, acao);
    if (novo === m.estado) return;
    if (acao.type === "FILA_CONCLUIDA") m.filasConcluidas += 1;
    m.estado = novo;
    renderizar();
  };
  const acoes = criarAcoes(dispatch, {});
  const agendador = criarAgendadorAuto({ acoes, documento, duracaoDaFila, agendar, cancelar });

  function renderizar() {
    const fila = m.estado.batalhaUi.eventos;
    if (fila !== filaAnimada) {
      clearTimeout(animacao);
      filaAnimada = fila;
      const ms = duracaoDaFila(fila, m.estado.config.velocidadeAnimacao);
      if (fila.length > 0) animacao = setTimeout(() => acoes.filaConcluida(), atraso(ms));
    }
    agendador.atualizar(m.estado);
  }

  const visibilidade = (estado) => {
    documento.visibilityState = estado;
    documento.dispatchEvent(new Event("visibilitychange"));
  };
  Object.assign(m, {
    acoes,
    agendador,
    vivos: () => vivos.size,
    ocultar: () => visibilidade("hidden"),
    mostrar: () => visibilidade("visible"),
    acoesDoAuto: () => m.despachos.filter((t) => ACOES_DO_AUTO.includes(t)).length,
    encerrar: () => {
      agendador.encerrar();
      clearTimeout(animacao);
    },
  });
  agendador.iniciar();
  renderizar();
  return m;
}

const comecar = (opcoes) => montar(ligar(explorar(jogo({ config: SEM_PARADAS }))), opcoes);
const encontrosVencidos = (save) => save.estatisticas.encontrosVencidos ?? 0;

// O que a sessão do Auto diz bate com o que entrou no save, desde `inicio`
function conferirRecompensas(inicio, estado) {
  const { sessao } = estado.auto;
  expect(estado.save.ouro - inicio.ouro).toBe(sessao.ouro);
  expect(encontrosVencidos(estado.save) - encontrosVencidos(inicio)).toBe(sessao.vitorias);
  expect(validarSave(estado.save)).toEqual([]);
}

let semente = 0;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  semente = 0;
  vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((a) => {
    a[0] = (semente += 7919);
    return a;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Auto: foco, mouse e visibilidade não pausam", () => {
  it("mover o mouse, clicar em áreas neutras e perder ou ganhar o foco não interrompem", () => {
    const m = comecar();
    for (const tipo of ["mousemove", "pointermove", "pointerdown", "click", "blur", "focus", "focusout"]) {
      m.janela.dispatchEvent(new Event(tipo));
      m.documento.dispatchEvent(new Event(tipo));
      vi.advanceTimersByTime(1000);
    }
    vi.advanceTimersByTime(30000);
    expect(m.estado.auto).toMatchObject({ estado: "ativo", motivo: null });
    expect(m.estado.auto.sessao.vitorias).toBeGreaterThan(0);
    expect(m.despachos).not.toContain("AUTO_PAUSAR");
    expect(m.despachos).not.toContain("AUTO_PARAR");
    m.encerrar();
  });

  it("trocar de aba: segue ativo e joga vários encontros oculto, sem duplicar nada", () => {
    const m = comecar();
    const inicio = m.estado.save;
    vi.advanceTimersByTime(5000);
    m.ocultar();
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(m.estado.auto).toMatchObject({ estado: "ativo", motivo: null });
    expect(m.estado.auto.sessao.vitorias).toBeGreaterThanOrEqual(10);
    expect(m.estado.auto.sessao.encontro).toBeGreaterThan(10);
    expect(m.maxVivos).toBe(1);
    // Cada fila de animação termina uma vez só (pela interface ou pelo Auto, nunca pelos dois)
    expect(m.despachos.filter((t) => t === "FILA_CONCLUIDA").length).toBe(m.filasConcluidas);
    conferirRecompensas(inicio, m.estado);
    m.encerrar();
  });

  it("oculto não joga mais rápido que visível: o Auto espera o tempo que a animação levaria", () => {
    const visivel = comecar();
    vi.advanceTimersByTime(10 * 60 * 1000);
    const naTela = visivel.estado.auto.sessao;
    visivel.encerrar();

    const oculto = comecar({ limiteOculta: 0 }); // mesmo sem limite do navegador
    oculto.ocultar();
    vi.advanceTimersByTime(10 * 60 * 1000);
    const escondido = oculto.estado.auto.sessao;
    oculto.encerrar();
    expect(escondido.vitorias).toBeGreaterThan(0);
    expect(escondido.vitorias).toBeLessThanOrEqual(naTela.vitorias);
    expect(escondido.encontro).toBeLessThanOrEqual(naTela.encontro);
  });

  it("ao voltar para a aba: continua ativo, mostra o estado real e não compensa o tempo fora", () => {
    const m = comecar();
    const inicio = m.estado.save;
    m.ocultar();
    vi.advanceTimersByTime(2 * 60 * 1000);
    const antes = { acoes: m.acoesDoAuto(), sessao: m.estado.auto.sessao };
    m.mostrar();
    expect(m.estado.auto.estado).toBe("ativo");
    expect(m.estado.auto.sessao).toBe(antes.sessao); // voltar não muda nada sozinho
    expect(m.acoesDoAuto()).toBe(antes.acoes);
    vi.advanceTimersByTime(399);
    expect(m.acoesDoAuto()).toBe(antes.acoes); // sem rajada: o próximo passo vem no ritmo normal
    vi.advanceTimersByTime(30000);
    expect(m.acoesDoAuto()).toBeGreaterThan(antes.acoes);
    expect(m.estado.auto.estado).toBe("ativo");
    conferirRecompensas(inicio, m.estado);
    m.encerrar();
  });

  it("'Parar Auto' depois de voltar encerra na hora: nenhum temporizador e nenhuma ação nova", () => {
    const m = comecar();
    m.ocultar();
    vi.advanceTimersByTime(60000);
    m.mostrar();
    vi.advanceTimersByTime(1500);
    m.acoes.pararAuto();
    expect(m.estado.auto.estado).toBe("desligado");
    expect(m.agendador.pendente()).toBe(false);
    expect(m.vivos()).toBe(0);
    const save = m.estado.save;
    const acoes = m.acoesDoAuto();
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(m.acoesDoAuto()).toBe(acoes);
    expect(m.estado.save).toBe(save);
    m.encerrar();
  });
});

describe("Auto: temporizadores", () => {
  it("um temporizador por vez: o mesmo passo não cria outro, e trocar a visibilidade não duplica", () => {
    const m = comecar();
    const criados = m.criados;
    for (let i = 0; i < 50; i++) m.agendador.atualizar(m.estado);
    expect(m.criados).toBe(criados);
    expect(m.vivos()).toBe(1);
    for (let i = 0; i < 10; i++) {
      m.ocultar();
      m.mostrar();
    }
    expect(m.vivos()).toBeLessThanOrEqual(1);
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(m.maxVivos).toBe(1);
    m.encerrar();
    expect(m.vivos()).toBe(0);
  });

  it("disparo atrasado ou repetido não faz nada: cada passo é executado uma única vez", () => {
    // Navegador que entrega os disparos quando quer e ignora o cancelamento
    const disparos = [];
    let state = ligar(explorar(jogo({ config: SEM_PARADAS })));
    const despachos = [];
    const dispatch = (acao) => {
      despachos.push(acao.type);
      state = reducer(state, acao);
    };
    const agendador = criarAgendadorAuto({
      acoes: criarAcoes(dispatch, {}),
      documento: { visibilityState: "hidden" },
      duracaoDaFila,
      agendar: (fn) => disparos.push(fn),
      cancelar: () => {},
    });
    agendador.atualizar(state);
    const primeiro = disparos[0];
    primeiro();
    expect(despachos).toEqual(["AUTO_AGIR"]);
    const depoisDoPrimeiro = state;
    primeiro(); // repetido
    expect(despachos).toEqual(["AUTO_AGIR"]);

    agendador.atualizar(state);
    const segundo = disparos[1];
    agendador.atualizar({ ...state, auto: { ...state.auto, estado: "pausado" } }); // o estado mudou antes do disparo
    segundo(); // atrasado: o passo dele já passou
    expect(despachos).toEqual(["AUTO_AGIR"]);
    expect(state).toBe(depoisDoPrimeiro);

    agendador.atualizar(state);
    disparos.at(-1)();
    expect(despachos).toEqual(["AUTO_AGIR", "FILA_CONCLUIDA"]); // o passo novo, uma vez
    expect(validarSave(state.save)).toEqual([]);
  });

  it("navegador que limita a um disparo por minuto: o Auto segue devagar, um passo por disparo", () => {
    const m = comecar({ limiteOculta: 60000 });
    const inicio = m.estado.save;
    m.ocultar();
    const passos = m.despachos.length;
    vi.advanceTimersByTime(10 * 60 * 1000);
    const feitos = m.despachos.length - passos;
    expect(feitos).toBeGreaterThanOrEqual(9);
    expect(feitos).toBeLessThanOrEqual(11);
    expect(m.estado.auto.estado).toBe("ativo");
    conferirRecompensas(inicio, m.estado);
    m.encerrar();
  });

  it("página suspensa: nada roda enquanto isso, e ao continuar faz um passo só, sem simular o tempo parado", () => {
    const m = comecar();
    const inicio = m.estado.save;
    m.ocultar();
    vi.advanceTimersByTime(3000);
    const antes = { acoes: m.acoesDoAuto(), passos: m.despachos.length, sessao: m.estado.auto.sessao };
    // Suspensa por 1 hora: o relógio anda, nenhum temporizador dispara
    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    expect(m.acoesDoAuto()).toBe(antes.acoes);
    vi.advanceTimersToNextTimer();
    expect(m.despachos.length - antes.passos).toBe(1); // um passo só, nada de recuperar a hora parada
    expect(m.estado.auto.sessao.vitorias - antes.sessao.vitorias).toBeLessThanOrEqual(1);
    expect(m.estado.auto.estado).toBe("ativo");
    conferirRecompensas(inicio, m.estado);
    m.encerrar();
  });
});
