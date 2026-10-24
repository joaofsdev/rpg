import { describe, it, expect } from "vitest";
import {
  equipar,
  desequipar,
  venderEquipamento,
  equipamentosLivres,
  heroisEmBatalha,
  guardarNoInventario,
  precoVendaItem,
} from "./inventario";
import { distribuirPontos, criarHeroi, sincronizarGolpes, equiparGolpes } from "./herois";
import { precoVenda } from "./itens";
import { criarRng } from "./rng";
import { criarBatalha } from "./combate";
import { criarNovoJogo } from "../save/novoJogo";
import { MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";

function jogo() {
  return criarNovoJogo({ nomeHeroi: "Ana", classeId: "cavaleiro", agora: 1, rng: criarRng(2) });
}

function comItem(save, item) {
  return {
    ...save,
    inventario: { ...save.inventario, equipamentos: { ...save.inventario.equipamentos, [item.id]: item } },
  };
}

const espada = { id: "espada", nome: "Espada", slot: "arma", tipoArma: "espada", raridade: "Comum", nivel: 1, bonus: { forca: 3 }, aprimoramento: 0 };
const cajado = { id: "cajado", nome: "Cajado", slot: "arma", tipoArma: "cajado", raridade: "Comum", nivel: 1, bonus: { magia: 3 }, aprimoramento: 0 };

describe("inventário", () => {
  it("equipa um item compatível", () => {
    const save = comItem(jogo(), espada);
    const heroiId = save.grupo[0];
    const { save: depois } = equipar(save, heroiId, "espada");
    expect(depois.herois[heroiId].equipamento.arma).toBe("espada");
  });

  it("recusa item incompatível com a classe", () => {
    const save = comItem(jogo(), cajado);
    expect(equipar(save, save.grupo[0], "cajado").erro).toMatch(/classe/);
  });

  it("tira o item de quem estava usando ao equipar em outro herói", () => {
    let save = comItem(jogo(), espada);
    const [a] = save.grupo;
    save = equipar(save, a, "espada").save;
    const outro = { ...save.herois[a], id: "b", nome: "B", equipamento: { ...save.herois[a].equipamento, arma: null } };
    save = { ...save, herois: { ...save.herois, b: outro } };
    save = equipar(save, "b", "espada").save;
    expect(save.herois.b.equipamento.arma).toBe("espada");
    expect(save.herois[a].equipamento.arma).toBeNull();
  });

  it("desequipa e vende", () => {
    let save = equipar(comItem(jogo(), espada), jogo().grupo[0], "espada").save;
    const heroiId = save.grupo[0];
    expect(venderEquipamento(save, "espada").erro).toMatch(/Desequipe/);
    save = desequipar(save, heroiId, "arma").save;
    const { save: vendido } = venderEquipamento(save, "espada");
    expect(vendido.ouro).toBe(save.ouro + precoVenda(espada));
    expect(vendido.inventario.equipamentos.espada).toBeUndefined();
  });

  it("não desequipa com o inventário cheio", () => {
    let save = jogo();
    for (let i = 0; i < MAX_EQUIPAMENTOS_INVENTARIO; i++) save = comItem(save, { ...espada, id: `e${i}` });
    expect(equipamentosLivres(save)).toHaveLength(MAX_EQUIPAMENTOS_INVENTARIO);
    const companheiro = save.herois[save.grupo[1]];
    expect(desequipar(save, companheiro.id, "arma").erro).toMatch(/cheio/);
  });

  it("trava equipamento de heróis em batalha", () => {
    let save = comItem(jogo(), espada);
    const herois = save.grupo.map((id) => save.herois[id]);
    const { batalha } = criarBatalha({
      herois,
      equipamentos: save.inventario.equipamentos,
      inimigos: [{ id: "rato_tumba", nivel: 1 }],
      origem: { tipo: "zona", zonaId: "cemiterio" },
      semente: 1,
    });
    save = { ...save, batalha };
    expect(heroisEmBatalha(save)).toEqual(save.grupo);
    expect(equipar(save, save.grupo[0], "espada").erro).toMatch(/batalha/);
  });
});

describe("distribuir pontos", () => {
  const heroi = { ...jogo().herois[jogo().grupo[0]], pontosLivres: 3 };

  it("gasta pontos livres", () => {
    const { heroi: depois } = distribuirPontos(heroi, { forca: 2, vida: 1 });
    expect(depois.pontosLivres).toBe(0);
    expect(depois.pontosNivel.forca).toBe(2);
    expect(depois.pontosNivel.vida).toBe(1);
  });

  it("recusa mais pontos do que o disponível ou atributo inválido", () => {
    expect(distribuirPontos(heroi, { forca: 4 }).erro).toBeTruthy();
    expect(distribuirPontos(heroi, { manaMax: 1 }).erro).toBeTruthy();
    expect(distribuirPontos(heroi, {}).erro).toBeTruthy();
  });
});

describe("golpes por nível", () => {
  it("herói criado em nível alto já conhece os golpes até o nível", () => {
    const heroi = criarHeroi({ id: "h", nome: "A", classeId: "mago", nivel: 30 });
    expect(heroi.golpesAprendidos).toEqual(
      expect.arrayContaining(["lanca_de_gelo", "corrente_eletrica", "barreira_arcana"]),
    );
    expect(heroi.golpesAprendidos).not.toContain("meteoro");
    expect(heroi.golpesEquipados).toHaveLength(4);
  });

  it("sincroniza golpes de saves antigos", () => {
    const save = jogo();
    const id = save.grupo[0];
    const antigo = { ...save, herois: { ...save.herois, [id]: { ...save.herois[id], nivel: 20 } } };
    const sincronizado = sincronizarGolpes(antigo);
    expect(sincronizado.herois[id].golpesAprendidos.length).toBe(6);
    expect(sincronizarGolpes(sincronizado)).toBe(sincronizado);
  });

  it("troca golpes equipados só entre os aprendidos", () => {
    const heroi = criarHeroi({ id: "h", nome: "A", classeId: "mago", nivel: 8 });
    const { heroi: depois } = equiparGolpes(heroi, ["lanca_de_gelo", "bola_de_fogo"]);
    expect(depois.golpesEquipados).toEqual(["lanca_de_gelo", "bola_de_fogo"]);
    expect(equiparGolpes(heroi, ["meteoro"]).erro).toBeTruthy();
    expect(equiparGolpes(heroi, ["bola_de_fogo", "bola_de_fogo"]).erro).toBeTruthy();
    expect(equiparGolpes(heroi, []).erro).toBeTruthy();
  });
});

describe("entrada de itens no inventário (SPEC §4.8)", () => {
  const botas = (id) => ({ id, slot: "botas", pesoArmadura: "leve", raridade: "Comum", nivel: 1, bonus: {}, aprimoramento: 0 });

  function lotado(save) {
    const extras = {};
    for (let i = equipamentosLivres(save).length; i < MAX_EQUIPAMENTOS_INVENTARIO; i++) extras[`x${i}`] = botas(`x${i}`);
    return { ...save, inventario: { ...save.inventario, equipamentos: { ...save.inventario.equipamentos, ...extras } } };
  }

  it("guarda tudo quando há espaço, sem vender nada", () => {
    const save = jogo();
    const r = guardarNoInventario(save, { itens: { osso_antigo: 3 }, equipamentos: [botas("n1")] });
    expect(r.save.inventario.itens.osso_antigo).toBe(3);
    expect(r.save.inventario.equipamentos.n1).toBeDefined();
    expect(r.ouroDasVendas).toBe(0);
    expect(r.save.ouro).toBe(save.ouro);
  });

  it("equipamento além dos 50 espaços livres é vendido pelo preço de venda", () => {
    const save = lotado(jogo());
    const novo = botas("n1");
    const r = guardarNoInventario(save, { equipamentos: [novo] });
    expect(r.save.inventario.equipamentos.n1).toBeUndefined();
    expect(r.vendidos.equipamentos).toEqual([{ item: novo, valor: precoVenda(novo) }]);
    expect(r.save.ouro).toBe(save.ouro + precoVenda(novo));
    expect(equipamentosLivres(r.save)).toHaveLength(MAX_EQUIPAMENTOS_INVENTARIO);
  });

  it("empilhável além do limite da pilha é vendido; o que cabe é guardado", () => {
    const base = jogo();
    const save = { ...base, inventario: { ...base.inventario, itens: { ...base.inventario.itens, osso_antigo: 997, pocao_pequena: 99 } } };
    const r = guardarNoInventario(save, { itens: { osso_antigo: 5, pocao_pequena: 2 } });
    expect(r.save.inventario.itens.osso_antigo).toBe(999);
    expect(r.save.inventario.itens.pocao_pequena).toBe(99);
    expect(r.guardados.itens).toEqual({ osso_antigo: 2 });
    expect(r.vendidos.itens).toEqual([
      { itemId: "osso_antigo", qtd: 3, valor: 3 * precoVendaItem("osso_antigo") },
      { itemId: "pocao_pequena", qtd: 2, valor: 2 * precoVendaItem("pocao_pequena") },
    ]);
    expect(r.save.ouro).toBe(save.ouro + r.ouroDasVendas);
  });

  it("todo material e consumível tem preço de venda de pelo menos 1", () => {
    for (const id of ["osso_antigo", "minerio_de_ferro", "pocao_pequena", "erva_revigorante"]) {
      expect(precoVendaItem(id)).toBeGreaterThanOrEqual(1);
    }
  });
});
