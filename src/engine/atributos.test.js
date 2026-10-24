import { describe, it, expect } from "vitest";
import { calcularAtributosHeroi, calcularAtributosInimigo, bonusDoEquipamento } from "./atributos";
import { criarHeroi } from "./herois";
import { inimigos } from "../data/inimigos";

describe("atributos de herói", () => {
  it("escala pelo nível (exemplo do SPEC §4.1)", () => {
    const heroi = criarHeroi({ id: "h", nome: "A", classeId: "cavaleiro", nivel: 10 });
    const atributos = calcularAtributosHeroi(heroi);
    expect(atributos.vida).toBe(215);
    expect(atributos.forca).toBe(24);
    expect(atributos.manaMax).toBeNull();
  });

  it("soma pontos de nível e de treino com as taxas", () => {
    const heroi = criarHeroi({ id: "h", nome: "A", classeId: "cavaleiro", nivel: 1 });
    heroi.pontosNivel.forca = 3;
    heroi.pontosTreino.forca = 2;
    heroi.pontosNivel.vida = 1;
    const atributos = calcularAtributosHeroi(heroi);
    expect(atributos.forca).toBe(16 + 5 * 2);
    expect(atributos.vida).toBe(140 + 10);
  });

  it("soma equipamentos com aprimoramento", () => {
    const heroi = criarHeroi({ id: "h", nome: "A", classeId: "cavaleiro", nivel: 1 });
    heroi.equipamento.arma = "e1";
    const equipamentos = {
      e1: { id: "e1", slot: "arma", bonus: { forca: 10, velocidade: 2 }, aprimoramento: 5 },
    };
    const atributos = calcularAtributosHeroi(heroi, equipamentos);
    expect(atributos.forca).toBe(16 + 14);
    expect(atributos.velocidade).toBe(8 + 2);
  });

  it("calcula mana máxima só para classes de mana", () => {
    const mago = criarHeroi({ id: "m", nome: "M", classeId: "mago", nivel: 5 });
    mago.pontosNivel.manaMax = 2;
    expect(calcularAtributosHeroi(mago).manaMax).toBe(74 + 10);
  });

  it("aprimoramento +0 não altera bônus", () => {
    expect(bonusDoEquipamento({ bonus: { vida: 7 }, aprimoramento: 0 }).vida).toBe(7);
  });
});

describe("atributos de inimigo", () => {
  it("escala inimigo comum com 10% por nível (exemplo do SPEC §4.1)", () => {
    const atributos = calcularAtributosInimigo(inimigos.coveiro, 10);
    expect(atributos.vida).toBe(874);
    expect(atributos.forca).toBe(55);
  });

  it("escala chefe com 8% por nível", () => {
    const atributos = calcularAtributosInimigo(inimigos.guardiao_cripta, 10);
    expect(atributos.vida).toBe(Math.floor(1125 * 1.72));
  });
});
