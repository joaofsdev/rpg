import { describe, it, expect } from "vitest";
import {
  calcularDanoBase,
  calcularDano,
  faixaDano,
  afinidadeContra,
  chanceAcerto,
  chanceCritico,
} from "./dano";
import { calcularAtributosHeroi, calcularAtributosInimigo } from "./atributos";
import { criarHeroi } from "./herois";
import { inimigos } from "../data/inimigos";

describe("dano", () => {
  it("reproduz o exemplo do SPEC §4.2 (Mago nv 5 × Esqueleto nv 5)", () => {
    const mago = calcularAtributosHeroi(criarHeroi({ id: "m", nome: "M", classeId: "mago", nivel: 5 }));
    const esqueleto = calcularAtributosInimigo(inimigos.esqueleto_fraco, 5);
    expect(mago.magia).toBe(32);
    expect(esqueleto.resistencia).toBe(5);
    expect(esqueleto.vida).toBe(448);
    expect(calcularDanoBase(28, mago.magia, esqueleto.resistencia)).toBeCloseTo(86.57, 1);
    expect(faixaDano({ poder: 28, ataque: 32, defesa: 5 })).toEqual({ min: 77, max: 95 });
  });

  it("aplica afinidade, crítico e modificadores", () => {
    const base = { poder: 20, ataque: 20, defesa: 0, variacao: 1 };
    expect(calcularDano(base)).toBe(40);
    expect(calcularDano({ ...base, afinidade: "fraco" })).toBe(60);
    expect(calcularDano({ ...base, afinidade: "resiste" })).toBe(20);
    expect(calcularDano({ ...base, critico: true })).toBe(60);
    expect(calcularDano({ ...base, modificador: 0.5 })).toBe(20);
  });

  it("imune causa 0 e o mínimo nos demais casos é 1", () => {
    expect(calcularDano({ poder: 20, ataque: 20, defesa: 0, afinidade: "imune" })).toBe(0);
    expect(calcularDano({ poder: 1, ataque: 1, defesa: 500 })).toBe(1);
  });

  it("identifica afinidades a partir dos dados do inimigo", () => {
    const zumbi = inimigos.zumbi_fraco;
    expect(afinidadeContra(zumbi, "fogo")).toBe("fraco");
    expect(afinidadeContra(zumbi, "sombra")).toBe("resiste");
    expect(afinidadeContra(zumbi, "corte")).toBe("neutro");
    expect(afinidadeContra({ imunidades: ["gelo"] }, "gelo")).toBe("imune");
  });
});

describe("acerto e crítico", () => {
  it("reproduz o exemplo do SPEC §4.3 (91%)", () => {
    expect(chanceAcerto({ velAtacante: 17, velAlvo: 25 })).toBe(91);
  });

  it("limita a chance entre 70 e 100", () => {
    expect(chanceAcerto({ velAtacante: 0, velAlvo: 200 })).toBe(70);
    expect(chanceAcerto({ velAtacante: 200, velAlvo: 0 })).toBe(100);
  });

  it("evasão reduz 30 pontos com mínimo de 40", () => {
    expect(chanceAcerto({ velAtacante: 10, velAlvo: 10, evasao: true })).toBe(65);
    expect(chanceAcerto({ velAtacante: 0, velAlvo: 200, evasao: true })).toBe(40);
  });

  it("precisão 100 ignora a fórmula, mas não a evasão", () => {
    expect(chanceAcerto({ precisao: 100, velAtacante: 0, velAlvo: 200 })).toBe(100);
    expect(chanceAcerto({ precisao: 100, velAtacante: 0, velAlvo: 200, evasao: true })).toBe(70);
  });

  it("crítico base é 5% mais bônus", () => {
    expect(chanceCritico()).toBeCloseTo(0.05);
    expect(chanceCritico(0.15)).toBeCloseTo(0.2);
  });
});
