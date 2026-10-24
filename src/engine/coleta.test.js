import { describe, it, expect } from "vitest";
import { coletarTudo, concluidasDesde, resumoDoRetorno } from "./coleta";
import { iniciarTreinoAtributo } from "./treino";
import { HORA, jogoComReserva, comChefeVencido } from "./__fixtures__/atividades";

// Dois heróis na reserva: um treinando 1 h e outro 4 h, ambos começando em 0
function doisTreinos() {
  const { save, reservaId, principalId } = jogoComReserva();
  const outroId = "outro";
  let atual = comChefeVencido(
    { ...save, herois: { ...save.herois, [outroId]: { ...save.herois[reservaId], id: outroId } } },
    "planicie_mortos",
  );
  atual = iniciarTreinoAtributo(atual, { id: "curto", heroiId: reservaId, atributo: "forca", horas: 1, agora: 0 }).save;
  atual = iniciarTreinoAtributo(atual, { id: "longo", heroiId: outroId, atributo: "defesa", horas: 4, agora: 0 }).save;
  return { save: atual, reservaId, outroId, principalId };
}

describe("resumo de retorno (SPEC §3.9)", () => {
  it("separa concluídas e em andamento, com o tempo restante", () => {
    const { save } = doisTreinos();
    const resumo = resumoDoRetorno(save, 2 * HORA);
    expect(resumo.concluidas.map((a) => a.id)).toEqual(["curto"]);
    expect(resumo.emAndamento).toEqual([{ atividade: save.atividades.longo, restante: 2 * HORA }]);
  });

  it("concluidasDesde mostra só o que terminou enquanto o jogador estava fora", () => {
    const { save } = doisTreinos();
    expect(concluidasDesde(save, 0, 2 * HORA).map((a) => a.id)).toEqual(["curto"]);
    expect(concluidasDesde(save, 1.5 * HORA, 2 * HORA)).toEqual([]);
    expect(concluidasDesde(save, 1.5 * HORA, 5 * HORA).map((a) => a.id)).toEqual(["longo"]);
  });
});

describe("coletar tudo", () => {
  it("coleta só o que está pronto e deixa o resto em andamento", () => {
    const { save, reservaId } = doisTreinos();
    const { save: depois, ganhos } = coletarTudo(save, 2 * HORA);
    expect(ganhos).toEqual([{ tipo: "treinoAtributo", heroiId: reservaId, atributo: "forca", pontos: 1 }]);
    expect(Object.keys(depois.atividades)).toEqual(["longo"]);
  });

  it("coletar tudo duas vezes não entrega nada a mais", () => {
    const { save, reservaId } = doisTreinos();
    const primeira = coletarTudo(save, 5 * HORA).save;
    const segunda = coletarTudo(primeira, 5 * HORA);
    expect(segunda.ganhos).toEqual([]);
    expect(segunda.save.herois[reservaId].pontosTreino.forca).toBe(1);
  });
});
