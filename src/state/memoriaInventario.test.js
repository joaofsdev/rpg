import { describe, it, expect, beforeEach } from "vitest";
import { lembrarInventario, inventarioLembrado, inventarioPadrao, esquecerInventario } from "./memoriaInventario";
import { FILTROS_PADRAO } from "./seletoresInventario";

function save({ criadoEm = 1, herois = ["ana", "bia"], equipamentos = ["espada"] } = {}) {
  return {
    criadoEm,
    herois: Object.fromEntries(herois.map((id) => [id, { id }])),
    inventario: { equipamentos: Object.fromEntries(equipamentos.map((id) => [id, { id }])), itens: {} },
  };
}

const estado = {
  aba: "itens",
  filtros: { ...FILTROS_PADRAO, busca: "ágil", slot: "arma", raridade: "Raro", heroiId: "bia" },
  ordem: "nome",
  heroiEscolhido: "ana",
  selecionadoId: "espada",
};

describe("memória do inventário na sessão", () => {
  beforeEach(esquecerInventario);

  it("sem nada lembrado, devolve o padrão", () => {
    expect(inventarioLembrado(0, save())).toEqual(inventarioPadrao());
  });

  it("devolve busca, filtros, ordem e escolhas ao voltar para o mesmo jogo", () => {
    lembrarInventario(0, save(), estado);
    expect(inventarioLembrado(0, save())).toEqual(estado);
  });

  it("outro slot ou outro jogo no mesmo slot começam do padrão", () => {
    lembrarInventario(0, save(), estado);
    expect(inventarioLembrado(1, save())).toEqual(inventarioPadrao());
    expect(inventarioLembrado(0, save({ criadoEm: 2 }))).toEqual(inventarioPadrao());
  });

  it("herói dispensado e item vendido desde então voltam ao padrão; o resto fica", () => {
    lembrarInventario(0, save(), estado);
    const depois = inventarioLembrado(0, save({ herois: ["ana"], equipamentos: [] }));
    expect(depois.filtros.heroiId).toBe("todos");
    expect(depois.selecionadoId).toBeNull();
    expect(depois.heroiEscolhido).toBe("ana");
    expect(depois.filtros.busca).toBe("ágil");
    expect(depois.ordem).toBe("nome");

    lembrarInventario(0, save(), { ...estado, heroiEscolhido: "bia" });
    expect(inventarioLembrado(0, save({ herois: ["ana"] })).heroiEscolhido).toBeNull();
  });
});
