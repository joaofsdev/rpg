import { describe, it, expect } from "vitest";
import {
  gerarEquipamento,
  sortearEquipamento,
  sortearRaridade,
  conjuntoComum,
  podeEquipar,
  precoCompra,
  precoVenda,
  flexionar,
} from "./itens";
import { criarRng } from "./rng";
import { classesHeroi } from "../data/classesHeroi";
import { SLOTS_EQUIPAMENTO } from "../data/constants";

describe("equipamentos", () => {
  it("armas mágicas dão magia em vez de força", () => {
    const rng = criarRng(1);
    const cajado = gerarEquipamento(rng, { nivel: 10, raridade: "Raro", slot: "arma", tipoArma: "cajado" });
    const espada = gerarEquipamento(rng, { nivel: 10, raridade: "Raro", slot: "arma", tipoArma: "espada" });
    expect(cajado.bonus.magia).toBeGreaterThan(0);
    expect(cajado.bonus.forca).toBe(0);
    expect(espada.bonus.forca).toBeGreaterThan(0);
    expect(espada.bonus.magia).toBe(0);
  });

  it("conjunto Comum cobre os 5 slots e é compatível com a classe", () => {
    for (const classeId of Object.keys(classesHeroi)) {
      const itens = conjuntoComum(criarRng(2), classeId, 5);
      expect(itens.map((i) => i.slot).sort()).toEqual([...SLOTS_EQUIPAMENTO].sort());
      for (const item of itens) {
        expect(item.raridade).toBe("Comum");
        expect(podeEquipar(classeId, item)).toBe(true);
      }
    }
  });

  it("cerca de 60% ou mais dos drops servem para o grupo", () => {
    const rng = criarRng(3);
    let compativeis = 0;
    for (let i = 0; i < 2000; i++) {
      const item = sortearEquipamento(rng, { nivel: 5, classeIds: ["mago"] });
      if (podeEquipar("mago", item)) compativeis++;
    }
    expect(compativeis / 2000).toBeGreaterThan(0.6);
  });

  it("raridade de chefe nunca é pior que a tabela permite", () => {
    const rng = criarRng(4);
    const vistas = new Set(Array.from({ length: 3000 }, () => sortearRaridade(rng, true)));
    expect(vistas.has("Lendário")).toBe(true);
    const comuns = new Set(Array.from({ length: 3000 }, () => sortearRaridade(rng, false)));
    expect(comuns.has("Lendário")).toBe(false);
  });

  it("raridade mínima é respeitada", () => {
    const rng = criarRng(5);
    for (let i = 0; i < 200; i++) {
      const item = sortearEquipamento(rng, { nivel: 5, chefe: true, raridadeMin: "Raro" });
      expect(["Raro", "Épico", "Lendário"]).toContain(item.raridade);
    }
  });

  it("preço de venda é 40% do preço de compra", () => {
    const item = { nivel: 10, raridade: "Incomum" };
    expect(precoCompra(item)).toBe((50 + 80) * 3);
    expect(precoVenda(item)).toBe(Math.floor(390 * 0.4));
  });
});

describe("nomes de equipamento", () => {
  it("o adjetivo concorda com o nome base", () => {
    expect(flexionar("Gasto", "f")).toBe("Gasta");
    expect(flexionar("Velho", "fp")).toBe("Velhas");
    expect(flexionar("Ancestral", "mp")).toBe("Ancestrais");
    expect(flexionar("Brilhante", "f")).toBe("Brilhante");
    expect(flexionar("Simples", "fp")).toBe("Simples");
  });

  it("gera nomes concordados para luvas e botas", () => {
    const rng = criarRng(12);
    for (let i = 0; i < 200; i++) {
      const item = gerarEquipamento(rng, { nivel: 5, raridade: "Comum", slot: "luvas", pesoArmadura: "leve" });
      expect(item.nome).not.toMatch(/ (Velho|Gasto|Básico|Enferrujado) /);
    }
  });
});
