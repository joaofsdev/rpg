import { describe, it, expect } from "vitest";
import {
  vagasDeExpedicao,
  motivoNaoViaja,
  opcoesDeZona,
  iniciarExpedicao,
  rolagensCompletas,
  totalDeRolagens,
  recompensaDaExpedicao,
} from "./expedicoes";
import { coletarAtividade, cancelarAtividade, coletarTudo, resumoDoRetorno } from "./coleta";
import { motivoNaoEntraNoGrupo, dispensarHeroi } from "./grupo";
import { iniciarTreinoAtributo } from "./treino";
import { relogio } from "./relogio";
import { HORA, jogoComReserva, comChefeVencido } from "./__fixtures__/atividades";

const MINUTO = 60 * 1000;

function partir(save, heroiId, { minutos = 120, zonaId = "cemiterio", agora = 0, semente = 42 } = {}) {
  return iniciarExpedicao(save, { id: "e1", heroiId, zonaId, minutos, agora, semente });
}

describe("expedições (SPEC §3.6)", () => {
  it("expedição de 2 h vista depois de 3 h entrega 8 rolagens, não 12", () => {
    const { save, reservaId } = jogoComReserva();
    const viajando = partir(save, reservaId).save;
    const atividade = viajando.atividades.e1;
    expect(totalDeRolagens(atividade)).toBe(8);
    expect(rolagensCompletas(atividade, 3 * HORA)).toBe(8);
    const { ganho } = coletarAtividade(viajando, "e1", 3 * HORA);
    expect(ganho.rolagens).toBe(8);
    expect(Object.values(ganho.itens).reduce((s, q) => s + q, 0)).toBe(8);
  });

  it("cancelar uma expedição de 2 h depois de 50 min entrega 3 rolagens", () => {
    const { save, reservaId } = jogoComReserva();
    const viajando = partir(save, reservaId).save;
    const { save: depois, ganho } = cancelarAtividade(viajando, "e1", 50 * MINUTO);
    expect(ganho.rolagens).toBe(3);
    expect(depois.atividades).toEqual({});
  });

  it("coletar a mesma expedição duas vezes entrega uma vez só", () => {
    const { save, reservaId } = jogoComReserva();
    const viajando = partir(save, reservaId).save;
    const uma = coletarAtividade(viajando, "e1", 2 * HORA).save;
    expect(coletarAtividade(uma, "e1", 2 * HORA).erro).toBe("Esta atividade já foi coletada.");
    expect(coletarTudo(uma, 2 * HORA).ganhos).toEqual([]);
  });

  it("relógio voltando no tempo não deixa o progresso negativo nem regredir", () => {
    const { save, reservaId } = jogoComReserva();
    const viajando = { ...partir(save, reservaId, { agora: 10 * HORA }).save, ultimaVisita: 11 * HORA };
    const atividade = viajando.atividades.e1;
    expect(rolagensCompletas(atividade, 0)).toBe(0);
    expect(rolagensCompletas(atividade, relogio(viajando, 0))).toBe(4);
  });

  it("Cemitério por 2 h: 40 ouro e 624 XP (exemplo de §4.10)", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 5, ouro: 0 });
    const viajando = partir(save, reservaId).save;
    const { save: depois, ganho } = coletarAtividade(viajando, "e1", 2 * HORA);
    expect(ganho.ouro).toBe(40);
    expect(ganho.xp).toBe(624);
    expect(depois.ouro).toBe(40);
    for (const [itemId, qtd] of Object.entries(ganho.itens)) {
      expect(depois.inventario.itens[itemId]).toBe((save.inventario.itens[itemId] || 0) + qtd);
    }
  });

  it("a mesma semente dá sempre os mesmos itens, e as rolagens parciais são o começo das completas", () => {
    const { save, reservaId } = jogoComReserva();
    const atividade = partir(save, reservaId, { minutos: 480 }).save.atividades.e1;
    expect(recompensaDaExpedicao(atividade, 32)).toEqual(recompensaDaExpedicao(atividade, 32));
    const parcial = recompensaDaExpedicao(atividade, 10).itens;
    const total = recompensaDaExpedicao(atividade, 32).itens;
    for (const [id, qtd] of Object.entries(parcial)) expect(total[id]).toBeGreaterThanOrEqual(qtd);
  });

  it("os itens seguem os pesos da tabela da zona", () => {
    const { save, reservaId } = jogoComReserva();
    const atividade = { ...partir(save, reservaId, { minutos: 480 }).save.atividades.e1, duracao: 4000 * 15 * MINUTO };
    const { itens } = recompensaDaExpedicao(atividade, 4000);
    // Cemitério: osso 5, erva 2, pano 1
    expect(itens.osso_antigo / 4000).toBeCloseTo(5 / 8, 1);
    expect(itens.pano_mortuario / 4000).toBeCloseTo(1 / 8, 1);
  });

  it("itens além do limite da pilha são vendidos na coleta", () => {
    const { save, reservaId } = jogoComReserva();
    const cheio = { ...save, inventario: { ...save.inventario, itens: { osso_antigo: 999, erva_da_nevoa: 999, pano_mortuario: 999 } } };
    const viajando = partir(cheio, reservaId).save;
    const { save: depois, ganho } = coletarAtividade(viajando, "e1", 2 * HORA);
    expect(depois.inventario.itens).toEqual(cheio.inventario.itens);
    expect(ganho.vendidos.reduce((s, v) => s + v.qtd, 0)).toBe(8);
    expect(depois.ouro).toBe(cheio.ouro + ganho.ouro + ganho.ouroDasVendas);
    expect(ganho.ouroDasVendas).toBeGreaterThan(0);
  });

  it("XP da expedição pode subir o nível do herói", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 1 });
    const viajando = partir(save, reservaId, { minutos: 480 }).save;
    const { save: depois, ganho } = coletarAtividade(viajando, "e1", 8 * HORA);
    expect(ganho.niveisGanhos).toBeGreaterThan(0);
    expect(depois.herois[reservaId].nivel).toBe(ganho.nivelNovo);
  });
});

describe("requisitos e vagas", () => {
  it("zona bloqueada e nível abaixo do mínimo ficam desabilitados com o motivo", () => {
    const { save, reservaId } = jogoComReserva({ nivel: 5 });
    const heroi = save.herois[reservaId];
    expect(opcoesDeZona(save, heroi).find((o) => o.zona.id === "minas").motivo).toBe("Zona bloqueada");
    const aberto = { ...save, progresso: { ...save.progresso, zonas: { ...save.progresso.zonas, minas: { ...save.progresso.zonas.minas, desbloqueada: true } } } };
    expect(opcoesDeZona(aberto, heroi).find((o) => o.zona.id === "minas").motivo).toBe("Exige nível 11");
    expect(partir(aberto, reservaId, { zonaId: "minas" }).erro).toBe("Exige nível 11");
  });

  it("recusa herói do grupo, herói ocupado e duração fora da lista", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    expect(motivoNaoViaja(save, principalId)).toBe("Está no grupo. Mova para a reserva para viajar.");
    expect(partir(save, reservaId, { minutos: 45 }).erro).toBe("Duração inválida.");
    const treinando = iniciarTreinoAtributo(save, { id: "t", heroiId: reservaId, atributo: "forca", horas: 1, agora: 0 }).save;
    expect(motivoNaoViaja(treinando, reservaId)).toBe("Já está em uma atividade.");
  });

  it("1 vaga no início, +1 após o chefe da zona 3 e +1 após o da zona 6", () => {
    const { save } = jogoComReserva();
    expect(vagasDeExpedicao(save)).toBe(1);
    const zona3 = comChefeVencido(save, "costa");
    expect(vagasDeExpedicao(zona3)).toBe(2);
    expect(vagasDeExpedicao(comChefeVencido(zona3, "fortaleza"))).toBe(3);
  });

  it("com a vaga ocupada, outro herói não parte", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    const comOutro = { ...save, herois: { ...save.herois, outro: { ...save.herois[principalId], id: "outro" } } };
    const viajando = partir(comOutro, reservaId).save;
    expect(motivoNaoViaja(viajando, "outro")).toBe("Todas as vagas de expedição estão ocupadas (1/1).");
  });

  it("herói em expedição não entra no grupo nem é dispensado", () => {
    const { save, reservaId } = jogoComReserva();
    const viajando = partir(save, reservaId).save;
    expect(motivoNaoEntraNoGrupo(viajando, reservaId)).toBe("Em expedição");
    expect(dispensarHeroi(viajando, reservaId).erro).toBe("Em expedição. Colete ou cancele a expedição antes.");
  });
});

describe("resumo de retorno (SPEC §3.9)", () => {
  it("após 1 h: expedição de 1 h concluída no resumo e treino de 4 h (começado 1 h antes) com 'faltam 2h'", () => {
    const { save, reservaId, principalId } = jogoComReserva();
    let atual = comChefeVencido(
      { ...save, herois: { ...save.herois, outro: { ...save.herois[principalId], id: "outro", nivel: 12 } } },
      "planicie_mortos",
    );
    atual = partir(atual, reservaId, { minutos: 60 }).save;
    atual = iniciarTreinoAtributo(atual, { id: "t", heroiId: "outro", atributo: "forca", horas: 4, agora: -HORA }).save;
    const resumo = resumoDoRetorno(atual, HORA);
    expect(resumo.concluidas.map((a) => a.id)).toEqual(["e1"]);
    expect(resumo.emAndamento).toEqual([{ atividade: atual.atividades.t, restante: 2 * HORA }]);
  });
});
