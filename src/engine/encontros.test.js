import { describe, it, expect } from "vitest";
import { gerarEncontro, encontroDeChefe, nivelMedio } from "./encontros";
import { criarRng } from "./rng";
import { buscarZona } from "../data/zonas";

const cemiterio = buscarZona("cemiterio");

describe("encontros", () => {
  it("com grupo de nível médio 4, inimigos ficam entre 3 e 5", () => {
    const rng = criarRng(11);
    for (let i = 0; i < 500; i++) {
      for (const inimigo of gerarEncontro(cemiterio, 4, rng)) {
        expect(inimigo.nivel).toBeGreaterThanOrEqual(3);
        expect(inimigo.nivel).toBeLessThanOrEqual(5);
      }
    }
  });

  it("respeita os limites de nível da zona", () => {
    const rng = criarRng(12);
    for (let i = 0; i < 200; i++) {
      for (const inimigo of gerarEncontro(cemiterio, 50, rng)) expect(inimigo.nivel).toBe(10);
      for (const inimigo of gerarEncontro(cemiterio, 1, rng)) expect(inimigo.nivel).toBeGreaterThanOrEqual(1);
    }
  });

  it("gera de 1 a 3 inimigos da zona", () => {
    const rng = criarRng(13);
    for (let i = 0; i < 200; i++) {
      const encontro = gerarEncontro(cemiterio, 5, rng);
      expect(encontro.length).toBeGreaterThanOrEqual(1);
      expect(encontro.length).toBeLessThanOrEqual(3);
      for (const inimigo of encontro) expect(cemiterio.inimigos).toContain(inimigo.id);
    }
  });

  it("chefe tem o nível máximo da zona", () => {
    expect(encontroDeChefe(cemiterio)).toEqual([{ id: "guardiao_cripta", nivel: 10 }]);
  });

  it("nível médio arredonda", () => {
    expect(nivelMedio([{ nivel: 3 }, { nivel: 6 }])).toBe(5);
    expect(nivelMedio([])).toBe(1);
  });
});
