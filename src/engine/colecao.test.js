import { describe, it, expect } from "vitest";
import { chaveDoEquipamento, chavesDeEquipamento, registrarNaColecao, progressoDaColecao, adicionarReliquia } from "./colecao";
import { guardarNoInventario } from "./inventario";
import { comprarItem } from "./loja";
import { criarRng } from "./rng";
import { criarNovoJogo } from "../save/novoJogo";
import { RARIDADES, TIPOS_ARMA, PESOS_ARMADURA } from "../data/equipamentos";
import { itens } from "../data/itens";
import { reliquias } from "../data/reliquias";

const vazia = { equipamentos: {}, itens: [], reliquias: [] };

function jogo() {
  return criarNovoJogo({ nomeHeroi: "Ana", classeId: "cavaleiro", agora: 0, rng: criarRng(8) });
}

const espada = (raridade, id = `e-${raridade}`) => ({ id, slot: "arma", tipoArma: "espada", raridade, nivel: 1, bonus: {}, aprimoramento: 0 });

describe("coleção (SPEC §3.10)", () => {
  it("equipamentos contam por slot + tipo × raridade", () => {
    expect(chaveDoEquipamento(espada("Raro"))).toBe("arma:espada");
    expect(chaveDoEquipamento({ slot: "peitoral", pesoArmadura: "leve" })).toBe("peitoral:leve");
    expect(chavesDeEquipamento()).toHaveLength(TIPOS_ARMA.length + 4 * PESOS_ARMADURA.length);
  });

  it("registra uma vez cada raridade e devolve o mesmo save quando nada é novo", () => {
    const save = { ...jogo(), colecao: vazia };
    const um = registrarNaColecao(save, { equipamentos: [espada("Raro"), espada("Raro", "outra")], itens: { osso_antigo: 3 } });
    expect(um.colecao.equipamentos["arma:espada"]).toEqual(["Raro"]);
    expect(um.colecao.itens).toEqual(["osso_antigo"]);
    expect(registrarNaColecao(um, { equipamentos: [espada("Raro")], itens: ["osso_antigo"] })).toBe(um);
  });

  it("um jogo novo já começa com o conjunto Comum e os consumíveis iniciais", () => {
    const save = jogo();
    expect(Object.values(save.colecao.equipamentos).flat().every((r) => r === "Comum")).toBe(true);
    expect(Object.keys(save.colecao.equipamentos).length).toBeGreaterThanOrEqual(5);
    expect(save.colecao.itens).toEqual(expect.arrayContaining(["pocao_pequena", "eter_menor", "tonico"]));
  });

  it("o que é vendido por falta de espaço também conta como obtido", () => {
    const base = jogo();
    const save = { ...base, inventario: { ...base.inventario, itens: { osso_antigo: 999 } }, colecao: vazia };
    const r = guardarNoInventario(save, { itens: { osso_antigo: 2 } });
    expect(r.vendidos.itens).toHaveLength(1);
    expect(r.save.colecao.itens).toContain("osso_antigo");
  });

  it("compras na loja entram na coleção", () => {
    const save = { ...jogo(), ouro: 1000, colecao: vazia };
    expect(comprarItem(save, "antidoto", 1).save.colecao.itens).toEqual(["antidoto"]);
  });

  it("percentual de conclusão soma equipamentos, itens e relíquias", () => {
    const save = adicionarReliquia({ ...jogo(), colecao: vazia }, "coroa_do_guardiao");
    const p = progressoDaColecao(registrarNaColecao(save, { equipamentos: [espada("Raro")], itens: ["osso_antigo"] }));
    expect(p.equipamentos).toEqual({ obtidos: 1, total: chavesDeEquipamento().length * RARIDADES.length });
    expect(p.itens).toEqual({ obtidos: 1, total: Object.keys(itens).length });
    expect(p.reliquias).toEqual({ obtidos: 1, total: Object.keys(reliquias).length });
    expect(p.total.obtidos).toBe(3);
    expect(p.total.percentual).toBe(Math.floor((100 * 3) / p.total.total));
  });
});
