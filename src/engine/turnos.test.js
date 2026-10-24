import { describe, it, expect } from "vitest";
import { calcularOrdem } from "./turnos";

function c(id, lado, velocidade, posicao, modVelocidade = 0) {
  const status =
    modVelocidade !== 0
      ? [{ statusId: "modificador", atributo: "velocidade", valor: modVelocidade, turnos: 2 }]
      : [];
  return { id, lado, posicao, nocauteado: false, atributos: { velocidade }, status };
}

describe("ordem de turnos", () => {
  it("segue o exemplo do critério de aceite do SPEC §3.1", () => {
    const combatentes = {
      A: c("A", "inimigos", 30, 0),
      B: c("B", "inimigos", 22, 1),
      X: c("X", "herois", 20, 0, 2),
      Y: c("Y", "herois", 18, 1, 4),
    };
    expect(calcularOrdem(combatentes)).toEqual(["A", "B", "X", "Y"]);
  });

  it("com mesma velocidade e mesma base, heróis vêm antes de inimigos", () => {
    const combatentes = {
      B: c("B", "inimigos", 22, 0),
      X: c("X", "herois", 22, 0),
    };
    expect(calcularOrdem(combatentes)).toEqual(["X", "B"]);
  });

  it("ignora nocauteados e desempata por posição", () => {
    const combatentes = {
      h0: c("h0", "herois", 10, 0),
      h1: c("h1", "herois", 10, 1),
      h2: { ...c("h2", "herois", 50, 2), nocauteado: true },
    };
    expect(calcularOrdem(combatentes)).toEqual(["h0", "h1"]);
  });

  it("é determinística", () => {
    const combatentes = {
      a: c("a", "inimigos", 12, 0),
      b: c("b", "herois", 12, 1),
      d: c("d", "herois", 12, 0),
    };
    expect(calcularOrdem(combatentes)).toEqual(calcularOrdem(structuredClone(combatentes)));
  });
});
