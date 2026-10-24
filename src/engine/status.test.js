import { describe, it, expect } from "vitest";
import {
  aplicarStatus,
  processarInicioTurno,
  processarFimTurno,
  temStatus,
  obterStatus,
  atributoEfetivo,
  velocidadeEfetiva,
} from "./status";

function combatente(extras = {}) {
  return {
    hpMax: 100,
    hpAtual: 100,
    atributos: { forca: 10, velocidade: 20, defesa: 10 },
    status: [],
    ...extras,
  };
}

describe("status", () => {
  it("veneno acumula até 3 e renova a duração", () => {
    const c = combatente();
    for (let i = 0; i < 5; i++) aplicarStatus(c, { statusId: "veneno" }, i);
    const veneno = obterStatus(c, "veneno");
    expect(veneno.acumulos).toBe(3);
    expect(veneno.turnos).toBe(4);
  });

  it("veneno causa 4% por acúmulo no início do turno", () => {
    const c = combatente();
    aplicarStatus(c, { statusId: "veneno" }, 1);
    aplicarStatus(c, { statusId: "veneno" }, 1);
    const ticks = processarInicioTurno(c);
    expect(ticks).toEqual([{ statusId: "veneno", valor: -8 }]);
    expect(c.hpAtual).toBe(92);
  });

  it("dano de status pode zerar a vida", () => {
    const c = combatente({ hpAtual: 3 });
    aplicarStatus(c, { statusId: "queimadura" }, 1);
    processarInicioTurno(c);
    expect(c.hpAtual).toBe(0);
  });

  it("não desconta a duração no mesmo turno em que foi aplicado", () => {
    const c = combatente();
    aplicarStatus(c, { statusId: "protecao", turnos: 2 }, 7);
    processarFimTurno(c, 7);
    expect(obterStatus(c, "protecao").turnos).toBe(2);
    processarFimTurno(c, 8);
    expect(obterStatus(c, "protecao").turnos).toBe(1);
    expect(processarFimTurno(c, 9)).toEqual(["protecao"]);
    expect(temStatus(c, "protecao")).toBe(false);
  });

  it("depois do atordoamento fica imune por 2 turnos", () => {
    const c = combatente();
    aplicarStatus(c, { statusId: "atordoado" }, 1);
    processarFimTurno(c, 2);
    expect(temStatus(c, "atordoado")).toBe(false);
    expect(temStatus(c, "imune_atordoado")).toBe(true);
    expect(aplicarStatus(c, { statusId: "atordoado" }, 3)).toEqual({
      aplicado: false,
      motivo: "firme",
    });
  });

  it("respeita imunidades do alvo", () => {
    const c = combatente();
    expect(aplicarStatus(c, { statusId: "veneno" }, 1, ["veneno"]).aplicado).toBe(false);
    expect(c.status).toHaveLength(0);
  });

  it("modificadores coexistem e somam no atributo efetivo", () => {
    const c = combatente();
    aplicarStatus(c, { statusId: "modificador", atributo: "forca", valor: 8, turnos: 3 }, 1);
    aplicarStatus(c, { statusId: "modificador", atributo: "forca", valor: 4, turnos: 3 }, 1);
    expect(atributoEfetivo(c, "forca")).toBe(22);
  });

  it("lentidão multiplica a velocidade por 0,7", () => {
    const c = combatente();
    aplicarStatus(c, { statusId: "lentidao" }, 1);
    expect(velocidadeEfetiva(c)).toBeCloseTo(14);
  });
});
