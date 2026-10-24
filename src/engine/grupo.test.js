import { describe, it, expect } from "vitest";
import { colocarNoGrupo, tirarDoGrupo, heroisDaReserva, motivoNaoEntraNoGrupo, dispensarHeroi } from "./grupo";
import { equipamentosLivres } from "./inventario";
import { iniciarTreinoAtributo } from "./treino";
import { MAX_GRUPO, MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";
import { jogoComReserva } from "./__fixtures__/atividades";

describe("grupo e reserva (SPEC §3.2)", () => {
  it("move heróis entre grupo e reserva", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    expect(heroisDaReserva(save).map((h) => h.id)).toEqual([reservaId]);
    const junto = colocarNoGrupo(save, reservaId).save;
    expect(junto.grupo).toEqual([principalId, reservaId]);
    expect(tirarDoGrupo(junto, principalId).save.grupo).toEqual([reservaId]);
  });

  it("o grupo precisa de pelo menos 1 herói", () => {
    const { save, principalId } = jogoComReserva();
    expect(tirarDoGrupo(save, principalId).erro).toBe("O grupo precisa de pelo menos 1 herói.");
  });

  it("não passa de 4 heróis", () => {
    const { save, reservaId } = jogoComReserva();
    const cheio = { ...save, grupo: Array.from({ length: MAX_GRUPO }, () => save.grupo[0]) };
    expect(colocarNoGrupo(cheio, reservaId).erro).toBe(`O grupo está cheio (${MAX_GRUPO}/${MAX_GRUPO}).`);
  });

  it("herói em treino não entra no grupo", () => {
    const { save, reservaId } = jogoComReserva();
    const treinando = iniciarTreinoAtributo(save, { id: "t", heroiId: reservaId, atributo: "forca", horas: 1, agora: 0 }).save;
    expect(motivoNaoEntraNoGrupo(treinando, reservaId)).toBe("Em treino");
    expect(colocarNoGrupo(treinando, reservaId).erro).toBe("Em treino");
  });

  it("grupo travado durante batalha ou masmorra", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    expect(colocarNoGrupo({ ...save, batalha: {} }, reservaId).erro).toBe("Há uma batalha em andamento.");
    const junto = colocarNoGrupo(save, reservaId).save;
    expect(tirarDoGrupo({ ...junto, masmorraAtual: {} }, principalId).erro).toBe("O grupo está em uma masmorra.");
  });
});

describe("dispensar herói", () => {
  it("tira o herói do save e o equipamento dele volta ao inventário", () => {
    const { save, reservaId } = jogoComReserva();
    const equipados = Object.values(save.herois[reservaId].equipamento).filter(Boolean);
    const livresAntes = equipamentosLivres(save).length;
    const { save: depois, equipamentos } = dispensarHeroi(save, reservaId);
    expect(depois.herois[reservaId]).toBeUndefined();
    expect(equipamentos).toBe(equipados.length);
    for (const id of equipados) expect(depois.inventario.equipamentos[id]).toBeDefined();
    expect(equipamentosLivres(depois).length).toBe(livresAntes + equipados.length);
  });

  it("pode dispensar um herói do grupo, mas não o último", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    const junto = colocarNoGrupo(save, reservaId).save;
    const depois = dispensarHeroi(junto, principalId).save;
    expect(depois.grupo).toEqual([reservaId]);
    expect(dispensarHeroi(depois, reservaId).erro).toBe("O último herói do grupo não pode ser dispensado.");
  });

  it("não dispensa quem está em treino, batalha ou masmorra", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    const treinando = iniciarTreinoAtributo(save, { id: "t", heroiId: reservaId, atributo: "forca", horas: 1, agora: 0 }).save;
    expect(dispensarHeroi(treinando, reservaId).erro).toBe("Em treino. Colete ou cancele o treino antes.");

    const junto = colocarNoGrupo(save, reservaId).save;
    const batalha = { combatentes: { c1: { lado: "herois", refId: principalId } } };
    expect(dispensarHeroi({ ...junto, batalha }, principalId).erro).toBe("Está em uma batalha em andamento.");
    expect(dispensarHeroi({ ...junto, masmorraAtual: {} }, principalId).erro).toBe("Está em uma masmorra com o grupo.");
    expect(dispensarHeroi({ ...save, masmorraAtual: {} }, reservaId).erro).toBeUndefined();
  });

  it("não dispensa se o equipamento não couber no inventário", () => {
    const { save, reservaId } = jogoComReserva();
    const cheio = Object.fromEntries(Array.from({ length: MAX_EQUIPAMENTOS_INVENTARIO }, (_, i) => [`x${i}`, { id: `x${i}` }]));
    const lotado = { ...save, inventario: { ...save.inventario, equipamentos: { ...save.inventario.equipamentos, ...cheio } } };
    expect(dispensarHeroi(lotado, reservaId).erro).toMatch(/Sem espaço no inventário/);
  });
});
