import { describe, it, expect } from "vitest";
import { escolherIntencao } from "./ia";
import { criarRng } from "./rng";
import { batalhaTeste, heroiTeste, ajustar } from "./__fixtures__/batalhas";

function batalhaComChefe() {
  return batalhaTeste({
    herois: [heroiTeste("cavaleiro", 10), heroiTeste("mago", 10)],
    inimigos: [{ id: "guardiao_cripta", nivel: 10 }],
  }).batalha;
}

describe("IA dos inimigos", () => {
  it("segue o padrão em ciclo", () => {
    const batalha = batalhaComChefe();
    const chefe = { ...batalha.combatentes.i0, cicloIa: 0, historicoIa: {}, turnosAgidos: 0 };
    const sequencia = [0, 1, 2, 3, 4].map(
      (ciclo) => escolherIntencao(batalha, { ...chefe, cicloIa: ciclo }, criarRng(1), 1).golpeId,
    );
    expect(sequencia).toEqual([
      "espada_enferrujada",
      "chuva_de_ossos",
      "espada_enferrujada",
      "grito_dos_mortos",
      "espada_enferrujada",
    ]);
  });

  it("aplica a regra de regeneração abaixo de 50% de vida", () => {
    const batalha = batalhaComChefe();
    const chefe = batalha.combatentes.i0;
    const ferido = { ...chefe, hpAtual: Math.floor(chefe.hpMax * 0.4), historicoIa: {} };
    const intencao = escolherIntencao(batalha, ferido, criarRng(1), 2);
    expect(intencao.golpeId).toBe("regeneracao_necrotica");
    expect(intencao.origem).toBe("regra");
    expect(intencao.alvos).toEqual(["i0"]);
  });

  it("não repete a regeneração antes de 3 turnos", () => {
    const batalha = batalhaComChefe();
    const chefe = batalha.combatentes.i0;
    const ferido = {
      ...chefe,
      hpAtual: Math.floor(chefe.hpMax * 0.4),
      turnosAgidos: 5,
      historicoIa: { regeneracao_necrotica: 4 },
    };
    expect(escolherIntencao(batalha, ferido, criarRng(1), 2).origem).toBe("padrao");
  });

  it("marca golpes telegrafados", () => {
    const batalha = batalhaComChefe();
    const chefe = { ...batalha.combatentes.i0, cicloIa: 3 };
    expect(escolherIntencao(batalha, chefe, criarRng(1), 1).telegrafado).toBe(true);
  });

  it("provocação força o alvo de golpes de alvo único", () => {
    let batalha = batalhaComChefe();
    batalha = ajustar(batalha, "h1", {
      status: [{ statusId: "provocacao", turnos: 2, acumulos: 1, aplicadoEm: 0 }],
    });
    const chefe = { ...batalha.combatentes.i0, cicloIa: 0 };
    for (let semente = 0; semente < 10; semente++) {
      expect(escolherIntencao(batalha, chefe, criarRng(semente), 1).alvos).toEqual(["h1"]);
    }
  });

  it("é determinística para o mesmo estado e a mesma semente", () => {
    const batalha = batalhaComChefe();
    const chefe = batalha.combatentes.i0;
    expect(escolherIntencao(batalha, chefe, criarRng(77), 1)).toEqual(
      escolherIntencao(batalha, chefe, criarRng(77), 1),
    );
  });
});
