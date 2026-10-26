// Regressão da capacidade do inventário (SPEC.md §4.8): no máximo MAX_EQUIPAMENTOS_INVENTARIO
// equipamentos livres; os equipados não contam. Nenhuma operação pode passar do limite.
import { describe, it, expect } from "vitest";
import { equipar, desequipar, venderEquipamento, equipamentosLivres, guardarNoInventario } from "./inventario";
import { criarHeroi } from "./herois";
import { criarRng, inteiro, escolher } from "./rng";
import { criarNovoJogo } from "../save/novoJogo";
import { MAX_EQUIPAMENTOS_INVENTARIO as MAX } from "../data/constants";

function espada(id) {
  return { id, nome: `Espada ${id}`, slot: "arma", tipoArma: "espada", raridade: "Comum", nivel: 1, bonus: { forca: 1 }, aprimoramento: 0 };
}

// Ana e Bia (cavaleiras): Ana usa "da-ana", Bia usa "da-bia"; Caio (cavaleiro) está com a arma vazia.
// "livres" espadas livres no inventário.
function jogo(livres) {
  const base = criarNovoJogo({ nomeHeroi: "X", classeId: "cavaleiro", agora: 1, rng: criarRng(1) });
  const ana = criarHeroi({ id: "ana", nome: "Ana", classeId: "cavaleiro" });
  const bia = criarHeroi({ id: "bia", nome: "Bia", classeId: "cavaleiro" });
  const caio = criarHeroi({ id: "caio", nome: "Caio", classeId: "cavaleiro" });
  ana.equipamento.arma = "da-ana";
  bia.equipamento.arma = "da-bia";
  const equipamentos = { "da-ana": espada("da-ana"), "da-bia": espada("da-bia") };
  for (let i = 0; i < livres; i++) equipamentos[`l${i}`] = espada(`l${i}`);
  return {
    ...base,
    herois: { ana, bia, caio },
    grupo: ["ana", "bia", "caio"],
    inventario: { ...base.inventario, equipamentos },
    batalha: null,
  };
}

const livres = (save) => equipamentosLivres(save).length;

describe("capacidade: inventário cheio (50 livres)", () => {
  it("trocar um item livre pelo que o herói usa mantém a contagem", () => {
    const { save } = equipar(jogo(MAX), "ana", "l0");
    expect(save.herois.ana.equipamento.arma).toBe("l0");
    expect(livres(save)).toBe(MAX);
  });

  it("equipar num espaço vazio libera um espaço", () => {
    const { save } = equipar(jogo(MAX), "caio", "l0");
    expect(livres(save)).toBe(MAX - 1);
  });

  it("passar um item de um herói a outro que já usa algo no espaço é recusado, sem mudar nada", () => {
    const antes = jogo(MAX);
    const resultado = equipar(antes, "bia", "da-ana");
    expect(resultado.save).toBeUndefined();
    expect(resultado.erro).toBe(
      "Inventário cheio: Espada da-bia sairia de Bia e não há espaço para guardá-lo. Venda algum equipamento antes.",
    );
  });

  it("passar um item de um herói a outro com o espaço vazio continua possível", () => {
    const { save } = equipar(jogo(MAX), "caio", "da-ana");
    expect(save.herois.caio.equipamento.arma).toBe("da-ana");
    expect(save.herois.ana.equipamento.arma).toBeNull();
    expect(livres(save)).toBe(MAX);
  });

  it("reequipar o mesmo item no mesmo herói não muda nada", () => {
    expect(livres(equipar(jogo(MAX), "ana", "da-ana").save)).toBe(MAX);
  });

  it("tirar é recusado com mensagem clara", () => {
    expect(desequipar(jogo(MAX), "ana", "arma").erro).toBe("Inventário cheio. Venda algum equipamento antes.");
  });

  it("vender libera espaço e então tirar e passar entre heróis voltam a funcionar", () => {
    let save = venderEquipamento(jogo(MAX), "l0").save;
    expect(livres(save)).toBe(MAX - 1);
    expect(livres(equipar(save, "bia", "da-ana").save)).toBe(MAX);
    save = desequipar(save, "ana", "arma").save;
    expect(livres(save)).toBe(MAX);
  });

  it("novos equipamentos são vendidos na hora, nunca guardados além do limite", () => {
    const resultado = guardarNoInventario(jogo(MAX), { equipamentos: [espada("novo")] });
    expect(resultado.vendidos.equipamentos).toHaveLength(1);
    expect(livres(resultado.save)).toBe(MAX);
  });
});

describe("capacidade: com espaço", () => {
  it("passar entre heróis com 49 livres chega a 50 e para aí", () => {
    const { save } = equipar(jogo(MAX - 1), "bia", "da-ana");
    expect(livres(save)).toBe(MAX);
    expect(equipar(save, "ana", "da-bia").erro).toBeUndefined(); // Ana está vazia: 50 → 50
    expect(equipar(save, "bia", "l0").save).toBeDefined(); // troca com livre: 50 → 50
  });
});

describe("capacidade: save antigo acima do limite (52 livres)", () => {
  it("nada é descartado e só o que aumentaria a contagem é recusado", () => {
    const save = jogo(MAX + 2);
    expect(livres(save)).toBe(MAX + 2);
    expect(livres(equipar(save, "ana", "l0").save)).toBe(MAX + 2); // troca com livre
    expect(livres(equipar(save, "caio", "l0").save)).toBe(MAX + 1); // espaço vazio
    expect(livres(equipar(save, "caio", "da-ana").save)).toBe(MAX + 2); // entre heróis, vazio
    expect(equipar(save, "bia", "da-ana").erro).toMatch(/Inventário cheio/);
    expect(desequipar(save, "ana", "arma").erro).toMatch(/Inventário cheio/);
    expect(livres(venderEquipamento(save, "l0").save)).toBe(MAX + 1);
  });
});

describe("capacidade: sequência aleatória de ações", () => {
  it("equipar, tirar e vender nunca passam de 50 livres", () => {
    for (const semente of [1, 2, 3, 4, 5]) {
      const rng = criarRng(semente);
      let save = jogo(MAX);
      for (let passo = 0; passo < 400; passo++) {
        const heroiId = escolher(rng, ["ana", "bia", "caio"]);
        const ids = Object.keys(save.inventario.equipamentos);
        const acao = inteiro(rng, 0, 9);
        let resultado;
        if (acao < 6) resultado = equipar(save, heroiId, escolher(rng, ids));
        else if (acao < 9) resultado = desequipar(save, heroiId, "arma");
        else resultado = venderEquipamento(save, escolher(rng, ids));
        if (resultado.save) save = resultado.save;
        // repõe o que foi vendido para manter o inventário perto do limite
        if (ids.length > Object.keys(save.inventario.equipamentos).length) {
          save = guardarNoInventario(save, { equipamentos: [espada(`r${semente}-${passo}`)] }).save;
        }
        expect(livres(save)).toBeLessThanOrEqual(MAX);
      }
    }
  });
});
