import { describe, it, expect } from "vitest";
import { criarRng, inteiro, escolherPonderado, gerarId, chance } from "./rng";

describe("rng", () => {
  it("gera a mesma sequência para a mesma semente", () => {
    const a = criarRng(123);
    const b = criarRng(123);
    const sequenciaA = Array.from({ length: 20 }, () => a.proximo());
    const sequenciaB = Array.from({ length: 20 }, () => b.proximo());
    expect(sequenciaA).toEqual(sequenciaB);
  });

  it("gera valores em [0, 1)", () => {
    const rng = criarRng(7);
    for (let i = 0; i < 10000; i++) {
      const v = rng.proximo();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("continua a sequência a partir do estado salvo", () => {
    const original = criarRng(99);
    original.proximo();
    original.proximo();
    const restaurado = criarRng(original.estado);
    expect(restaurado.proximo()).toBe(original.proximo());
  });

  it("inteiro respeita os limites", () => {
    const rng = criarRng(1);
    const valores = new Set(Array.from({ length: 2000 }, () => inteiro(rng, -1, 1)));
    expect([...valores].sort()).toEqual([-1, 0, 1]);
  });

  it("escolherPonderado segue os pesos", () => {
    const rng = criarRng(5);
    const lista = [
      { id: "a", peso: 3 },
      { id: "b", peso: 1 },
    ];
    let a = 0;
    for (let i = 0; i < 10000; i++) if (escolherPonderado(rng, lista).id === "a") a++;
    expect(a / 10000).toBeGreaterThan(0.72);
    expect(a / 10000).toBeLessThan(0.78);
  });

  it("chance trata 0 e 1 sem consumir sorte", () => {
    const rng = criarRng(3);
    const antes = rng.estado;
    expect(chance(rng, 1)).toBe(true);
    expect(chance(rng, 0)).toBe(false);
    expect(rng.estado).toBe(antes);
  });

  it("gerarId tem formato de UUID e é determinístico", () => {
    const id = gerarId(criarRng(10));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(gerarId(criarRng(10))).toBe(id);
  });
});
