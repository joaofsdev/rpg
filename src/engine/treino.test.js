import { describe, it, expect } from "vitest";
import {
  vagasDeTreino,
  custoTreinoAtributo,
  opcoesTreinoAtributo,
  opcoesTreinoGolpe,
  iniciarTreinoAtributo,
  iniciarTreinoGolpe,
  motivoNaoTreina,
} from "./treino";
import { coletarAtividade, cancelarAtividade } from "./coleta";
import { calcularAtributosHeroi } from "./atributos";
import { classesHeroi } from "../data/classesHeroi";
import { golpes } from "../data/golpes";
import { HORA, jogoComReserva, comChefeVencido } from "./__fixtures__/atividades";

function treinarForca(save, heroiId, horas = 4, agora = 0) {
  return iniciarTreinoAtributo(save, { id: "t1", heroiId, atributo: "forca", horas, agora });
}

describe("treino de atributo (SPEC §3.8)", () => {
  it("herói nv 12 treinando força por 4 h ganha +4 pontos (+8 força)", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 12 });
    const antes = calcularAtributosHeroi(save.herois[reservaId], save.inventario.equipamentos).forca;
    const treinando = treinarForca(save, reservaId).save;
    const { save: depois, ganho } = coletarAtividade(treinando, "t1", 4 * HORA);
    expect(ganho.pontos).toBe(4);
    expect(depois.herois[reservaId].pontosTreino.forca).toBe(4);
    expect(calcularAtributosHeroi(depois.herois[reservaId], depois.inventario.equipamentos).forca).toBe(antes + 8);
    expect(depois.atividades).toEqual({});
  });

  it("cobra 10 × nível × horas no início", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 12, ouro: 1000 });
    expect(custoTreinoAtributo(save.herois[reservaId], 4)).toBe(480);
    expect(treinarForca(save, reservaId).save.ouro).toBe(520);
  });

  it("com força de treino em 12/12, treinar força fica desabilitado com 'Limite 12/12'", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 12 });
    const heroi = { ...save.herois[reservaId], pontosTreino: { ...save.herois[reservaId].pontosTreino, forca: 12 } };
    const noLimite = { ...save, herois: { ...save.herois, [reservaId]: heroi } };
    const forca = opcoesTreinoAtributo(noLimite, heroi).find((o) => o.atributo === "forca");
    expect(forca.motivo).toBe("Limite 12/12");
    expect(forca.duracoes.every((d) => d.motivo === "Limite 12/12")).toBe(true);
    expect(treinarForca(noLimite, reservaId, 1).erro).toBe("Limite 12/12");
  });

  it("durações que passam do limite ficam desabilitadas", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 12 });
    const heroi = { ...save.herois[reservaId], pontosTreino: { ...save.herois[reservaId].pontosTreino, forca: 10 } };
    const forca = opcoesTreinoAtributo(save, heroi).find((o) => o.atributo === "forca");
    expect(forca.duracoes.map((d) => d.motivo)).toEqual([null, null, "Passa do limite (faltam 2)", "Passa do limite (faltam 2)"]);
  });

  it("manaMax só aparece para classes de mana", () => {
    const { save, reservaId } = jogoComReserva();
    const heroi = save.herois[reservaId];
    const temMana = classesHeroi[heroi.classeId].recurso === "mana";
    expect(opcoesTreinoAtributo(save, heroi).some((o) => o.atributo === "manaMax")).toBe(temMana);
  });

  it("cancelar entrega as horas completas e não devolve ouro", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 12, ouro: 1000 });
    const treinando = treinarForca(save, reservaId, 4).save;
    const { save: depois, ganho } = cancelarAtividade(treinando, "t1", 2.5 * HORA);
    expect(ganho.pontos).toBe(2);
    expect(depois.herois[reservaId].pontosTreino.forca).toBe(2);
    expect(depois.ouro).toBe(520);
    expect(depois.atividades).toEqual({});
  });

  it("não coleta antes do fim e não coleta duas vezes", () => {
    const { save, reservaId } = jogoComReserva();
    const treinando = treinarForca(save, reservaId, 2).save;
    expect(coletarAtividade(treinando, "t1", HORA).erro).toBe("Esta atividade ainda não terminou.");
    const coletado = coletarAtividade(treinando, "t1", 2 * HORA).save;
    expect(coletarAtividade(coletado, "t1", 2 * HORA).erro).toBe("Esta atividade já foi coletada.");
    expect(coletado.herois[reservaId].pontosTreino.forca).toBe(2);
  });

  it("tempo além da duração não gera pontos extras", () => {
    const { save, reservaId } = jogoComReserva();
    const treinando = treinarForca(save, reservaId, 2).save;
    expect(coletarAtividade(treinando, "t1", 30 * HORA).ganho.pontos).toBe(2);
  });

  it("recusa herói do grupo, herói ocupado e ouro insuficiente", () => {
    const { save, reservaId, principalId } = jogoComReserva({ ouro: 0 });
    expect(motivoNaoTreina(save, principalId)).toBe("Está no grupo. Mova para a reserva para treinar.");
    expect(treinarForca(save, reservaId, 1).erro).toBe("Ouro insuficiente");
    const rico = { ...save, ouro: 100000 };
    const treinando = treinarForca(rico, reservaId, 1).save;
    expect(motivoNaoTreina(treinando, reservaId)).toBe("Já está em uma atividade.");
  });
});

describe("vagas de treino", () => {
  it("1 vaga no início e +1 depois do chefe da zona 4", () => {
    const { save } = jogoComReserva();
    expect(vagasDeTreino(save)).toBe(1);
    expect(vagasDeTreino(comChefeVencido(save, "planicie_mortos"))).toBe(2);
  });

  it("com a vaga ocupada, outro herói não começa a treinar", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    const outroId = "outro";
    const comOutro = {
      ...save,
      herois: { ...save.herois, [outroId]: { ...save.herois[principalId], id: outroId } },
    };
    const treinando = treinarForca(comOutro, reservaId, 1).save;
    expect(motivoNaoTreina(treinando, outroId)).toBe("Todas as vagas de treino estão ocupadas (1/1).");
    expect(motivoNaoTreina(comChefeVencido(treinando, "planicie_mortos"), outroId)).toBeNull();
  });
});

describe("treino de golpe", () => {
  it("aprende antes do nível um golpe com nível exigido ≤ nível + 5", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 3 });
    const heroi = save.herois[reservaId];
    const [primeiro, segundo] = classesHeroi[heroi.classeId].golpesPorNivel;
    const opcoes = opcoesTreinoGolpe(save, heroi);
    expect(opcoes.find((o) => o.golpeId === primeiro.golpeId).motivo).toBeNull();
    expect(opcoes.find((o) => o.golpeId === segundo.golpeId).motivo).toBe(`Exige nível ${segundo.nivel - 5}`);

    const { horas, ouro } = golpes[primeiro.golpeId].treino;
    const treinando = iniciarTreinoGolpe(save, { id: "g", heroiId: reservaId, golpeId: primeiro.golpeId, agora: 0 }).save;
    expect(treinando.ouro).toBe(save.ouro - ouro);
    expect(coletarAtividade(treinando, "g", horas * HORA - 1).erro).toBeTruthy();
    const { save: depois, ganho } = coletarAtividade(treinando, "g", horas * HORA);
    expect(ganho.aprendeu).toBe(true);
    expect(depois.herois[reservaId].golpesAprendidos).toContain(primeiro.golpeId);
  });

  it("cancelar um treino de golpe não ensina o golpe", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 3 });
    const golpeId = classesHeroi[save.herois[reservaId].classeId].golpesPorNivel[0].golpeId;
    const treinando = iniciarTreinoGolpe(save, { id: "g", heroiId: reservaId, golpeId, agora: 0 }).save;
    const { save: depois, ganho } = cancelarAtividade(treinando, "g", HORA);
    expect(ganho.aprendeu).toBe(false);
    expect(depois.herois[reservaId].golpesAprendidos).not.toContain(golpeId);
  });

  it("golpes já aprendidos não aparecem para treino", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 20 });
    const heroi = { ...save.herois[reservaId] };
    const classe = classesHeroi[heroi.classeId];
    heroi.golpesAprendidos = [...heroi.golpesAprendidos, classe.golpesPorNivel[0].golpeId];
    expect(opcoesTreinoGolpe(save, heroi).map((o) => o.golpeId)).not.toContain(classe.golpesPorNivel[0].golpeId);
  });
});
