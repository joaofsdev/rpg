import { describe, it, expect } from "vitest";
import { decorrido, atividadeConcluida, tempoRestante, atividadeDoHeroi, heroiOcupado } from "./atividades";
import { relogio, registrarRelogio, prazoVencido, tempoAtePrazo } from "./relogio";
import { HORA, jogoComReserva } from "./__fixtures__/atividades";

const atividade = { id: "a", tipo: "treinoAtributo", heroiId: "h", inicio: 10 * HORA, duracao: 2 * HORA };

describe("tempo das atividades (SPEC §4.10)", () => {
  it("decorrido fica entre 0 e a duração", () => {
    expect(decorrido(atividade, 10 * HORA)).toBe(0);
    expect(decorrido(atividade, 11 * HORA)).toBe(HORA);
    expect(decorrido(atividade, 50 * HORA)).toBe(2 * HORA);
  });

  it("relógio antes do início não dá progresso negativo", () => {
    expect(decorrido(atividade, 0)).toBe(0);
    expect(tempoRestante(atividade, 0)).toBe(2 * HORA);
  });

  it("concluída quando agora ≥ início + duração", () => {
    expect(atividadeConcluida(atividade, 12 * HORA - 1)).toBe(false);
    expect(atividadeConcluida(atividade, 12 * HORA)).toBe(true);
    expect(tempoRestante(atividade, 11.5 * HORA)).toBe(0.5 * HORA);
  });

  it("acha a atividade do herói", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    const comAtividade = { ...save, atividades: { a: { ...atividade, heroiId: reservaId } } };
    expect(atividadeDoHeroi(comAtividade, reservaId).id).toBe("a");
    expect(heroiOcupado(comAtividade, principalId)).toBe(false);
  });
});

describe("relógio monotônico", () => {
  it("se o relógio do sistema voltar, o tempo do jogo não regride", () => {
    const save = registrarRelogio({ ultimaVisita: 0 }, 5 * HORA);
    expect(save.ultimaVisita).toBe(5 * HORA);
    expect(relogio(save, 2 * HORA)).toBe(5 * HORA);
    expect(registrarRelogio(save, 2 * HORA)).toBe(save);
    expect(decorrido(atividade, relogio(save, 0))).toBe(0);
  });

  it("prazos não vencem com o relógio voltando", () => {
    expect(prazoVencido(10, 5, 15)).toBe(true);
    expect(prazoVencido(10, 5, 2)).toBe(false);
    expect(tempoAtePrazo(10, 5, 2)).toBe(5);
    expect(tempoAtePrazo(10, 5, 12)).toBe(3);
  });
});
