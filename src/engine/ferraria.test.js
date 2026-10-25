import { describe, it, expect } from "vitest";
import {
  materiaisDaZona,
  zonaDoNivel,
  custoDaForja,
  motivoNaoForja,
  forjar,
  custoDoAprimoramento,
  motivoNaoAprimora,
  aprimorar,
} from "./ferraria";
import { bonusDoEquipamento } from "./atributos";
import { equipamentosLivres } from "./inventario";
import { criarRng } from "./rng";
import { criarNovoJogo } from "../save/novoJogo";
import { buscarZona } from "../data/zonas";
import { ATRIBUTOS, MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";
import { RARIDADES } from "../data/equipamentos";

const cemiterio = buscarZona("cemiterio");

function jogo({ ouro = 100000, itens = { osso_antigo: 500, pano_mortuario: 500 } } = {}) {
  const save = criarNovoJogo({ nomeHeroi: "Ana", classeId: "cavaleiro", agora: 0, rng: criarRng(5) });
  return { ...save, ouro, inventario: { ...save.inventario, itens: { ...save.inventario.itens, ...itens } } };
}

// Uma arma do nível 10 no inventário, com o aprimoramento pedido
function comArma(save, aprimoramento = 0) {
  const arma = {
    id: "arma1",
    nome: "Espada de Teste",
    slot: "arma",
    tipoArma: "espada",
    raridade: "Raro",
    nivel: 10,
    bonus: { vida: 10, forca: 20, magia: 0, defesa: 0, resistencia: 0, velocidade: 5 },
    aprimoramento,
  };
  return { ...save, inventario: { ...save.inventario, equipamentos: { ...save.inventario.equipamentos, arma1: arma } } };
}

describe("materiais da zona", () => {
  it("principal é o material mais comum da expedição; ingredientes ficam de fora", () => {
    expect(materiaisDaZona(cemiterio)).toEqual(["osso_antigo", "pano_mortuario"]);
  });

  it("cada nível de item usa os materiais da zona daquele nível", () => {
    expect(zonaDoNivel(1).id).toBe("cemiterio");
    expect(zonaDoNivel(10).id).toBe("cemiterio");
    expect(zonaDoNivel(11).id).toBe("minas");
    expect(zonaDoNivel(102).id).toBe("campos_caos");
  });
});

describe("forjar (SPEC §3.11)", () => {
  it("gera um item do nível da zona com raridade Incomum ou melhor e cobra materiais e ouro", () => {
    const save = jogo();
    const custo = custoDaForja(cemiterio, "arma");
    const { save: depois, item } = forjar(save, { zonaId: "cemiterio", slot: "arma", tipo: "espada" }, criarRng(1));
    expect(item).toMatchObject({ slot: "arma", tipoArma: "espada", nivel: cemiterio.nivelMax, aprimoramento: 0 });
    expect(RARIDADES.indexOf(item.raridade)).toBeGreaterThanOrEqual(RARIDADES.indexOf("Incomum"));
    expect(depois.inventario.equipamentos[item.id]).toEqual(item);
    expect(depois.ouro).toBe(save.ouro - custo.ouro);
    for (const { itemId, qtd } of custo.materiais) expect(depois.inventario.itens[itemId]).toBe(500 - qtd);
    expect(depois.colecao.equipamentos["arma:espada"]).toContain(item.raridade);
  });

  it("armaduras usam o peso escolhido", () => {
    const { item } = forjar(jogo(), { zonaId: "cemiterio", slot: "peitoral", tipo: "pesada" }, criarRng(2));
    expect(item).toMatchObject({ slot: "peitoral", pesoArmadura: "pesada" });
  });

  it("nunca sai Comum", () => {
    for (let s = 1; s <= 200; s++) {
      const { item } = forjar(jogo(), { zonaId: "cemiterio", slot: "botas", tipo: "leve" }, criarRng(s));
      expect(item.raridade).not.toBe("Comum");
    }
  });

  it("recusa zona bloqueada, tipo inválido, materiais ou ouro insuficientes e inventário cheio", () => {
    const save = jogo();
    expect(motivoNaoForja(save, { zonaId: "minas", slot: "arma", tipo: "espada" })).toBe("Desbloqueie a zona para usar os materiais dela.");
    expect(motivoNaoForja(save, { zonaId: "cemiterio", slot: "arma", tipo: "pesada" })).toBe("Tipo de equipamento inválido.");
    expect(motivoNaoForja(jogo({ itens: { osso_antigo: 1 } }), { zonaId: "cemiterio", slot: "arma", tipo: "espada" })).toBe("Materiais insuficientes.");
    expect(motivoNaoForja(jogo({ ouro: 0 }), { zonaId: "cemiterio", slot: "arma", tipo: "espada" })).toBe("Ouro insuficiente.");
    const extras = {};
    for (let i = equipamentosLivres(save).length; i < MAX_EQUIPAMENTOS_INVENTARIO; i++) {
      extras[`x${i}`] = { id: `x${i}`, slot: "botas", pesoArmadura: "leve", raridade: "Comum", nivel: 1, bonus: {}, aprimoramento: 0 };
    }
    const lotado = { ...save, inventario: { ...save.inventario, equipamentos: { ...save.inventario.equipamentos, ...extras } } };
    expect(motivoNaoForja(lotado, { zonaId: "cemiterio", slot: "arma", tipo: "espada" })).toBe("Inventário cheio. Venda algum equipamento antes.");
  });
});

describe("aprimorar (SPEC §3.11)", () => {
  it("também nos itens Comuns de bônus pequenos: +2 → +3 aumenta os bônus exibidos", () => {
    const base = jogo();
    const comum = { ...base.inventario.equipamentos[base.herois[base.grupo[0]].equipamento.capacete], aprimoramento: 2 };
    const save = { ...base, inventario: { ...base.inventario, equipamentos: { ...base.inventario.equipamentos, [comum.id]: comum } } };
    const antes = bonusDoEquipamento(comum);
    const depois = bonusDoEquipamento(aprimorar(save, comum.id).item);
    for (const a of ATRIBUTOS) {
      if (antes[a] > 0) expect(depois[a]).toBeGreaterThan(antes[a]);
      else expect(depois[a]).toBe(0);
    }
  });

  it("aprimorar um item +2 → +3 sempre tem sucesso e aumenta os bônus exibidos", () => {
    for (let tentativa = 0; tentativa < 20; tentativa++) {
      const save = comArma(jogo(), 2);
      const antes = bonusDoEquipamento(save.inventario.equipamentos.arma1);
      const { save: depois, item } = aprimorar(save, "arma1");
      expect(item.aprimoramento).toBe(3);
      const agora = bonusDoEquipamento(depois.inventario.equipamentos.arma1);
      expect(agora.forca).toBeGreaterThan(antes.forca);
      for (const a of ATRIBUTOS) expect(agora[a]).toBeGreaterThanOrEqual(antes[a]);
    }
  });

  it("cada nível soma +8% aos bônus do item", () => {
    const save = comArma(jogo(), 0);
    let atual = save;
    for (let n = 1; n <= 5; n++) atual = aprimorar(atual, "arma1").save;
    expect(bonusDoEquipamento(atual.inventario.equipamentos.arma1).forca).toBe(Math.floor(20 * 1.4));
  });

  it("o custo cresce a cada nível e o máximo é +5", () => {
    const custos = [0, 1, 2, 3, 4].map((n) => custoDoAprimoramento({ nivel: 10, aprimoramento: n }));
    for (let i = 1; i < custos.length; i++) {
      expect(custos[i].ouro).toBeGreaterThan(custos[i - 1].ouro);
      expect(custos[i].materiais[0].qtd).toBeGreaterThan(custos[i - 1].materiais[0].qtd);
    }
    expect(custoDoAprimoramento({ nivel: 10, aprimoramento: 5 })).toBeNull();
    expect(motivoNaoAprimora(comArma(jogo(), 5), "arma1")).toBe("Já está no máximo (+5).");
  });

  it("paga materiais da zona do nível do item e ouro", () => {
    const save = comArma(jogo(), 0);
    const custo = custoDoAprimoramento(save.inventario.equipamentos.arma1);
    const depois = aprimorar(save, "arma1").save;
    expect(depois.ouro).toBe(save.ouro - custo.ouro);
    expect(depois.inventario.itens.osso_antigo).toBe(500 - custo.materiais[0].qtd);
  });

  it("recusa sem materiais, sem ouro e com o dono em batalha", () => {
    expect(motivoNaoAprimora(comArma(jogo({ itens: { osso_antigo: 0, pano_mortuario: 0 } })), "arma1")).toBe("Materiais insuficientes.");
    expect(motivoNaoAprimora(comArma(jogo({ ouro: 0 })), "arma1")).toBe("Ouro insuficiente.");
    const save = jogo();
    const heroi = save.herois[save.grupo[0]];
    const batalha = { combatentes: { h0: { lado: "herois", refId: heroi.id } } };
    expect(motivoNaoAprimora({ ...save, batalha }, heroi.equipamento.arma)).toBe("Este item está com um herói em batalha.");
  });
});
