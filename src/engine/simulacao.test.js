// Teste de calibração (SPEC.md §4.9). Determinístico pela semente fixa.
import { describe, it, expect } from "vitest";
import { simularEncontros, simularChefe, simularMasmorra } from "./__fixtures__/simulacao";
import { zonas } from "../data/zonas";

const zonasJogaveis = zonas.filter((z) => z.jogavel);

describe.each(zonasJogaveis)("calibração: $nome", (zona) => {
  it("encontros comuns: vitória ≥ 90% e 3 a 6 rodadas em média", () => {
    const { taxaVitoria, mediaRodadas } = simularEncontros(zona, 1000);
    expect(taxaVitoria).toBeGreaterThanOrEqual(0.9);
    expect(mediaRodadas).toBeGreaterThanOrEqual(3);
    expect(mediaRodadas).toBeLessThanOrEqual(6);
  });

  it("chefe sem itens: vitória entre 60% e 85%", () => {
    const { taxaVitoria } = simularChefe(zona, 300);
    expect(taxaVitoria).toBeGreaterThanOrEqual(0.6);
    expect(taxaVitoria).toBeLessThanOrEqual(0.85);
  });
});

describe.each(zonasJogaveis)("calibração da masmorra: $nome", (zona) => {
  it("masmorra completa sem itens: conclusão entre 40% e 80%", () => {
    const { taxaConclusao } = simularMasmorra(zona, 150);
    expect(taxaConclusao).toBeGreaterThanOrEqual(0.4);
    expect(taxaConclusao).toBeLessThanOrEqual(0.8);
  });
});
