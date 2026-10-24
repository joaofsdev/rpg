import { describe, it, expect } from "vitest";
import {
  classesRecrutaveis,
  nivelDoRecruta,
  custoDoRecruta,
  gerarMural,
  muralEmDia,
  muralVencido,
  tempoAteRenovarMural,
  contratarRecruta,
  motivoNaoContrata,
} from "./recrutamento";
import { criarRng } from "./rng";
import { podeEquipar } from "./itens";
import { equipamentosLivres } from "./inventario";
import { DURACAO_MURAL_MS, RECRUTAS_NO_MURAL } from "../data/recrutamento";
import { MAX_GRUPO, MAX_HEROIS, SLOTS_EQUIPAMENTO, PONTOS_POR_NIVEL, MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";
import { HORA, jogoComReserva, comChefeVencido } from "./__fixtures__/atividades";

function comMural(save, agora = 0) {
  return muralEmDia(save, agora, criarRng(3));
}

describe("mural de recrutas (SPEC §3.2)", () => {
  it("oferece 3 recrutas de classes diferentes e nomes fora do save", () => {
    const { save } = jogoComReserva();
    const mural = comMural(save).recrutas;
    expect(mural.opcoes).toHaveLength(RECRUTAS_NO_MURAL);
    expect(new Set(mural.opcoes.map((o) => o.classeId)).size).toBe(RECRUTAS_NO_MURAL);
    const nomesDoSave = Object.values(save.herois).map((h) => h.nome);
    expect(mural.opcoes.some((o) => nomesDoSave.includes(o.nome))).toBe(false);
  });

  it("mantém o mural por 24 h e renova depois; relógio voltando não renova", () => {
    const { save } = jogoComReserva();
    const aberto = comMural(save, 10 * HORA);
    expect(muralEmDia(aberto, 33 * HORA, criarRng(9))).toBe(aberto);
    expect(muralVencido(aberto.recrutas, 0)).toBe(false);
    expect(tempoAteRenovarMural(aberto.recrutas, 30 * HORA)).toBe(4 * HORA);
    expect(muralEmDia(aberto, 10 * HORA + DURACAO_MURAL_MS, criarRng(9)).recrutas).not.toBe(aberto.recrutas);
  });

  it("novas classes são liberadas pelos chefes de zona", () => {
    const { save } = jogoComReserva();
    const semChefes = { ...save, herois: {} };
    expect(classesRecrutaveis(semChefes)).toEqual(["cavaleiro", "arqueiro", "mago"]);
    expect(classesRecrutaveis(comChefeVencido(semChefes, "cemiterio"))).toContain("bardo");
  });

  it("classes que o jogador já tem também aparecem", () => {
    const { save } = jogoComReserva();
    for (const heroi of Object.values(save.herois)) expect(classesRecrutaveis(save)).toContain(heroi.classeId);
  });

  it("repete classe só quando há menos classes que vagas no mural", () => {
    const mural = gerarMural(criarRng(1), { classeIds: ["mago"], agora: 0 });
    expect(mural.opcoes.map((o) => o.classeId)).toEqual(["mago", "mago", "mago"]);
  });
});

describe("contratar", () => {
  it("recruta chega com nível max(1, médio − 3), conjunto Comum e pontos livres do nível", () => {
    const { save, principalId } = jogoComReserva();
    const nivelado = { ...save, herois: { ...save.herois, [principalId]: { ...save.herois[principalId], nivel: 10 } } };
    const aberto = comMural(nivelado);
    expect(nivelDoRecruta(aberto)).toBe(7);
    const { save: depois, heroi, noGrupo } = contratarRecruta(aberto, 0, criarRng(4));
    expect(heroi.nivel).toBe(7);
    expect(heroi.pontosLivres).toBe(PONTOS_POR_NIVEL * 6);
    expect(heroi.classeId).toBe(aberto.recrutas.opcoes[0].classeId);
    for (const slot of SLOTS_EQUIPAMENTO) {
      const item = depois.inventario.equipamentos[heroi.equipamento[slot]];
      expect(item.raridade).toBe("Comum");
      expect(podeEquipar(heroi.classeId, item)).toBe(true);
    }
    expect(depois.ouro).toBe(aberto.ouro - custoDoRecruta(7));
    expect(noGrupo).toBe(true);
    expect(depois.grupo).toContain(heroi.id);
    expect(depois.recrutas.opcoes[0].contratado).toBe(true);
  });

  it("com o inventário cheio, o recruta chega equipado sem ocupar espaço livre", () => {
    const { save } = jogoComReserva();
    const extras = {};
    for (let i = equipamentosLivres(save).length; i < MAX_EQUIPAMENTOS_INVENTARIO; i++) {
      extras[`x${i}`] = { id: `x${i}`, slot: "botas", pesoArmadura: "leve", raridade: "Comum", nivel: 1, bonus: {}, aprimoramento: 0 };
    }
    const lotado = comMural({ ...save, inventario: { ...save.inventario, equipamentos: { ...save.inventario.equipamentos, ...extras } } });
    const { save: depois, heroi } = contratarRecruta(lotado, 0, criarRng(4));
    expect(equipamentosLivres(depois)).toHaveLength(MAX_EQUIPAMENTOS_INVENTARIO);
    expect(Object.values(heroi.equipamento).every(Boolean)).toBe(true);
  });

  it("nível mínimo 1", () => {
    const { save } = jogoComReserva();
    expect(nivelDoRecruta(save)).toBe(1);
  });

  it("vai para a reserva se o grupo estiver cheio ou travado", () => {
    const { save } = jogoComReserva();
    const cheio = comMural({ ...save, grupo: Array.from({ length: MAX_GRUPO }, () => save.grupo[0]) });
    expect(contratarRecruta(cheio, 0, criarRng(4)).noGrupo).toBe(false);
    const emMasmorra = comMural({ ...save, masmorraAtual: {} });
    const resultado = contratarRecruta(emMasmorra, 0, criarRng(4));
    expect(resultado.noGrupo).toBe(false);
    expect(resultado.save.grupo).toEqual(save.grupo);
  });

  it("não contrata o mesmo recruta duas vezes, sem ouro ou com 12 heróis", () => {
    const { save } = jogoComReserva();
    const aberto = comMural(save);
    const contratado = contratarRecruta(aberto, 0, criarRng(4)).save;
    expect(contratarRecruta(contratado, 0, criarRng(4)).erro).toBe("Este recruta já foi embora.");
    expect(motivoNaoContrata({ ...aberto, ouro: 0 }, 1)).toBe("Ouro insuficiente.");
    const herois = Object.fromEntries(Array.from({ length: MAX_HEROIS }, (_, i) => [`h${i}`, {}]));
    expect(motivoNaoContrata({ ...aberto, herois }, 1)).toBe(`Limite de heróis atingido (${MAX_HEROIS}/${MAX_HEROIS}).`);
  });
});
