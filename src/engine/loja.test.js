import { describe, it, expect } from "vitest";
import { lojaEmDia, lojaVencida, tempoAteRenovar, renovarLoja, custoRenovar, comprarEquipamento, comprarItem } from "./loja";
import { criarRng } from "./rng";
import { criarNovoJogo } from "../save/novoJogo";
import { DURACAO_LOJA_MS, EQUIPAMENTOS_NA_LOJA } from "../data/loja";

const HORA = 60 * 60 * 1000;

function jogo(semente = 1, ouro = 10000) {
  const save = criarNovoJogo({ nomeHeroi: "Ana", classeId: "mago", agora: 0, rng: criarRng(semente) });
  return { ...save, ouro };
}

describe("loja", () => {
  it("gera 5 equipamentos com preço na primeira visita", () => {
    const save = lojaEmDia(jogo(), 1000, criarRng(2));
    expect(save.loja.itens).toHaveLength(EQUIPAMENTOS_NA_LOJA);
    expect(save.loja.itens.every((i) => i.preco > 0)).toBe(true);
    expect(save.loja.renovadaEm).toBe(1000);
  });

  it("mantém os mesmos itens por 24 h e renova depois", () => {
    const save = lojaEmDia(jogo(), 0, criarRng(2));
    expect(lojaEmDia(save, 23 * HORA, criarRng(3))).toBe(save);
    expect(lojaEmDia(save, DURACAO_LOJA_MS, criarRng(3)).loja).not.toBe(save.loja);
    expect(tempoAteRenovar(save.loja, 20 * HORA)).toBe(4 * HORA);
  });

  it("relógio voltando no tempo não renova a loja", () => {
    const save = lojaEmDia(jogo(), 10 * HORA, criarRng(2));
    expect(lojaVencida(save.loja, 0)).toBe(false);
  });

  it("dois saves diferentes têm lojas diferentes (SPEC §3.11)", () => {
    const a = lojaEmDia(jogo(1), 0, criarRng(10));
    const b = lojaEmDia(jogo(2), 0, criarRng(20));
    expect(a.loja.itens.map((i) => i.nome)).not.toEqual(b.loja.itens.map((i) => i.nome));
  });

  it("comprar equipamento cobra, marca como vendido e guarda no inventário", () => {
    const save = lojaEmDia(jogo(), 0, criarRng(2));
    const oferta = save.loja.itens[0];
    const { save: depois } = comprarEquipamento(save, 0);
    expect(depois.ouro).toBe(save.ouro - oferta.preco);
    expect(depois.loja.vendidos[0]).toBe(true);
    expect(depois.inventario.equipamentos[oferta.id]).toBeDefined();
    expect(depois.inventario.equipamentos[oferta.id].preco).toBeUndefined();
    expect(comprarEquipamento(depois, 0).erro).toBeTruthy();
  });

  it("recusa compra sem ouro", () => {
    const save = lojaEmDia({ ...jogo(), ouro: 0 }, 0, criarRng(2));
    expect(comprarEquipamento(save, 0).erro).toMatch(/Ouro/);
    expect(comprarItem(save, "pocao_pequena", 1).erro).toMatch(/Ouro/);
  });

  it("compra consumíveis respeitando o limite da pilha", () => {
    const save = jogo();
    const { save: depois } = comprarItem(save, "erva_revigorante", 2);
    expect(depois.inventario.itens.erva_revigorante).toBe(2);
    expect(depois.ouro).toBe(save.ouro - 240);
    expect(comprarItem(depois, "erva_revigorante", 98).erro).toMatch(/máximo/);
    expect(comprarItem(save, "osso_antigo", 1).erro).toBeTruthy();
  });

  it("renovar antes da hora custa ouro proporcional ao nível do grupo", () => {
    const save = lojaEmDia(jogo(), 0, criarRng(2));
    expect(custoRenovar(save)).toBe(50);
    const { save: depois } = renovarLoja(save, 5, criarRng(9));
    expect(depois.ouro).toBe(save.ouro - 50);
    expect(depois.loja.renovadaEm).toBe(5);
    expect(renovarLoja({ ...save, ouro: 10 }, 5, criarRng(9)).erro).toBeTruthy();
  });
});
