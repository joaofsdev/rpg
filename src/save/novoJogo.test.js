import { describe, it, expect } from "vitest";
import { criarNovoJogo } from "./novoJogo";
import { validarSave } from "./formato";
import { criarRng } from "../engine/rng";
import { CONSUMIVEIS_INICIAIS } from "../data/constants";

describe("novo jogo", () => {
  const save = criarNovoJogo({ nomeHeroi: "Ana", classeId: "arqueiro", agora: 42, rng: criarRng(8) });

  it("cria o herói escolhido e um companheiro de outra classe", () => {
    expect(save.grupo).toHaveLength(2);
    const [principal, companheiro] = save.grupo.map((id) => save.herois[id]);
    expect(principal).toMatchObject({ nome: "Ana", classeId: "arqueiro", nivel: 1 });
    expect(companheiro.classeId).not.toBe("arqueiro");
    expect(companheiro.nome).not.toBe("Ana");
  });

  it("os dois heróis começam com um conjunto Comum compatível", () => {
    for (const id of save.grupo) {
      const heroi = save.herois[id];
      for (const itemId of Object.values(heroi.equipamento)) {
        expect(save.inventario.equipamentos[itemId]?.raridade).toBe("Comum");
      }
    }
  });

  it("começa no Cemitério com consumíveis iniciais e é válido", () => {
    expect(save.progresso.zonas.cemiterio.desbloqueada).toBe(true);
    expect(save.progresso.zonas.minas.desbloqueada).toBe(false);
    expect(save.inventario.itens).toEqual(CONSUMIVEIS_INICIAIS);
    expect(save.ouro).toBe(0);
    expect(validarSave(save)).toEqual([]);
  });

  it("é determinístico para a mesma semente", () => {
    const outro = criarNovoJogo({ nomeHeroi: "Ana", classeId: "arqueiro", agora: 42, rng: criarRng(8) });
    expect(outro).toEqual(save);
  });
});
