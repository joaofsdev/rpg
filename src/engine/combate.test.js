import { describe, it, expect } from "vitest";
import { aplicarAcao, acoesDisponiveis, preverAcao, alvosParaItem } from "./combate";
import { xpPorInimigo } from "./progressao";
import { batalhaTeste, heroiTeste, ajustar, golpeQualquer } from "./__fixtures__/batalhas";
import { RARIDADES } from "../data/equipamentos";
import { MAX_LOG_BATALHA } from "../data/constants";

const certeiro = { velocidade: 999 };

function eventosDo(eventos, tipo, extras = {}) {
  return eventos.filter(
    (e) => e.tipo === tipo && Object.entries(extras).every(([k, v]) => e[k] === v),
  );
}

describe("criação da batalha", () => {
  it("resolve turnos de inimigos mais rápidos e para no primeiro herói", () => {
    const { batalha, eventos } = batalhaTeste();
    expect(batalha.fase).toBe("escolhaAcao");
    expect(batalha.ativoId).toBe("h0");
    expect(eventosDo(eventos, "golpeUsado", { origemId: "i0" })).toHaveLength(1);
    expect(eventosDo(eventos, "intencao").length).toBeGreaterThanOrEqual(1);
  });

  it("todo inimigo começa com uma intenção visível", () => {
    const { batalha } = batalhaTeste({
      inimigos: [
        { id: "rato_tumba", nivel: 2 },
        { id: "zumbi_fraco", nivel: 2 },
      ],
    });
    for (const c of Object.values(batalha.combatentes).filter((c) => c.lado === "inimigos")) {
      expect(c.intencao?.golpeId).toBeTruthy();
    }
  });

  it("vigor começa em 40 e mana começa cheia", () => {
    const { batalha } = batalhaTeste({
      herois: [heroiTeste("cavaleiro", 1), heroiTeste("mago", 1)],
      inimigos: [{ id: "zumbi_fraco", nivel: 1 }],
    });
    // Os dois heróis ainda não começaram o turno: o zumbi é o mais lento, o mago age primeiro
    expect(batalha.ativoId).toBe("h1");
    expect(batalha.combatentes.h0.recurso).toEqual({ tipo: "vigor", atual: 40, max: 100 });
    const mana = batalha.combatentes.h1.recurso;
    expect(mana.atual).toBe(mana.max);
  });
});

describe("ações do herói", () => {
  it("golpe sem recurso aparece desabilitado com o custo e é recusado", () => {
    let { batalha } = batalhaTeste();
    batalha = ajustar(batalha, "h0", { recurso: { tipo: "vigor", atual: 10, max: 100 } });
    const opcao = acoesDisponiveis(batalha).golpes.find((g) => g.golpeId === "golpe_poderoso");
    expect(opcao.disponivel).toBe(false);
    expect(opcao.custo).toBe(35);
    expect(opcao.motivo).toBe("Requer 35 de vigor");

    const resultado = aplicarAcao(batalha, golpeQualquer(batalha, "golpe_poderoso"));
    expect(resultado.erro).toBeTruthy();
    expect(resultado.batalha).toBe(batalha);
    expect(resultado.eventos).toEqual([]);
  });

  it("não altera a batalha recebida", () => {
    const { batalha } = batalhaTeste();
    const copia = structuredClone(batalha);
    aplicarAcao(batalha, golpeQualquer(batalha));
    expect(batalha).toEqual(copia);
  });

  it("recusa ações fora da fase de escolha", () => {
    let { batalha } = batalhaTeste();
    batalha = { ...batalha, fase: "fim" };
    expect(aplicarAcao(batalha, { tipo: "defender" }).erro).toBeTruthy();
  });

  it("ataque básico recupera 10 de vigor extra", () => {
    let { batalha } = batalhaTeste();
    batalha = ajustar(batalha, "h0", { atributos: certeiro });
    const { eventos } = aplicarAcao(batalha, golpeQualquer(batalha, "ataque_basico"));
    expect(eventosDo(eventos, "recurso", { alvoId: "h0", valor: 10 })).toHaveLength(1);
  });

  it("tiro duplo acerta duas vezes", () => {
    let { batalha } = batalhaTeste({
      herois: [heroiTeste("arqueiro", 5)],
      inimigos: [{ id: "zumbi_fraco", nivel: 5 }],
    });
    batalha = ajustar(batalha, "h0", { atributos: certeiro });
    const { eventos } = aplicarAcao(batalha, golpeQualquer(batalha, "tiro_duplo"));
    expect(eventosDo(eventos, "dano", { origemId: "h0" })).toHaveLength(2);
  });

  it("Berserker custa vida, mas nunca nocauteia o próprio herói", () => {
    let { batalha } = batalhaTeste({ herois: [heroiTeste("barbaro", 5)] });
    batalha = ajustar(batalha, "h0", { hpAtual: 1 });
    const { eventos } = aplicarAcao(batalha, golpeQualquer(batalha, "berserker"));
    const autoDano = eventos.find((e) => e.autoDano);
    expect(autoDano.hpDepois).toBe(1);
  });

  it("poção cura o aliado e éter não serve para herói de vigor", () => {
    let { batalha } = batalhaTeste();
    batalha = ajustar(batalha, "h0", { hpAtual: 10 });
    expect(alvosParaItem(batalha, "eter_menor")).toEqual([]);
    expect(aplicarAcao(batalha, { tipo: "item", itemId: "eter_menor", alvoId: "h0" }).erro).toBeTruthy();

    const { eventos } = aplicarAcao(batalha, { tipo: "item", itemId: "pocao_pequena", alvoId: "h0" });
    expect(eventosDo(eventos, "itemUsado", { itemId: "pocao_pequena" })).toHaveLength(1);
    const cura = eventosDo(eventos, "cura", { alvoId: "h0" })[0];
    expect(cura.valor).toBe(Math.floor(batalha.combatentes.h0.hpMax * 0.4));
  });
});

describe("fim de batalha", () => {
  it("vitória calcula XP e ouro", () => {
    let { batalha } = batalhaTeste({ inimigos: [{ id: "rato_tumba", nivel: 3 }] });
    batalha = ajustar(batalha, "h0", { atributos: { velocidade: 999, forca: 999 } });
    const resultado = aplicarAcao(batalha, golpeQualquer(batalha)).batalha;
    expect(resultado.fase).toBe("fim");
    expect(resultado.resultado).toBe("vitoria");
    expect(resultado.recompensas.xp).toBe(xpPorInimigo(3));
    expect(resultado.recompensas.ouro).toBe(Math.floor(2 + 3 * 1.5));
  });

  it("chefe garante 2 equipamentos, o primeiro no mínimo Raro", () => {
    let { batalha } = batalhaTeste({
      herois: [heroiTeste("cavaleiro", 10)],
      inimigos: [{ id: "guardiao_cripta", nivel: 10 }],
    });
    batalha = ajustar(batalha, "h0", { atributos: { velocidade: 999, forca: 99999 } });
    const { recompensas } = aplicarAcao(batalha, golpeQualquer(batalha)).batalha;
    expect(recompensas.equipamentos).toHaveLength(2);
    expect(RARIDADES.indexOf(recompensas.equipamentos[0].raridade)).toBeGreaterThanOrEqual(2);
  });

  it("derrota não dá recompensas", () => {
    let { batalha } = batalhaTeste({ inimigos: [{ id: "rato_tumba", nivel: 3 }] });
    batalha = ajustar(batalha, "h0", { hpAtual: 1 });
    batalha = ajustar(batalha, "i0", { atributos: certeiro });
    const resultado = aplicarAcao(batalha, { tipo: "defender" }).batalha;
    expect(resultado.resultado).toBe("derrota");
    expect(resultado.recompensas).toEqual({ xp: 0, ouro: 0, itens: {}, equipamentos: [], dropsPorInimigo: {} });
  });

  it("fuga funciona em encontros comuns", () => {
    const { batalha } = batalhaTeste();
    const resultado = aplicarAcao(batalha, { tipo: "fugir" }).batalha;
    expect(resultado.fase).toBe("fim");
    expect(resultado.resultado).toBe("fuga");
  });

  it("não é possível fugir de um chefe", () => {
    const { batalha } = batalhaTeste({
      herois: [heroiTeste("cavaleiro", 10)],
      inimigos: [{ id: "guardiao_cripta", nivel: 10 }],
    });
    const fugir = acoesDisponiveis(batalha).fugir;
    expect(fugir.disponivel).toBe(false);
    expect(fugir.motivo).toBe("Não é possível fugir de um chefe");
    expect(aplicarAcao(batalha, { tipo: "fugir" }).erro).toBeTruthy();
  });

  it("dano de status pode encerrar a batalha", () => {
    let { batalha } = batalhaTeste();
    batalha = ajustar(batalha, "i0", {
      hpAtual: 1,
      status: [{ statusId: "queimadura", turnos: 3, acumulos: 1, aplicadoEm: 0 }],
    });
    const { batalha: depois, eventos } = aplicarAcao(batalha, { tipo: "defender" });
    expect(eventosDo(eventos, "statusTick", { alvoId: "i0" })).toHaveLength(1);
    expect(depois.resultado).toBe("vitoria");
  });
});

describe("status e táticas", () => {
  it("atordoado perde o turno", () => {
    let { batalha } = batalhaTeste();
    batalha = ajustar(batalha, "i0", {
      status: [{ statusId: "atordoado", turnos: 1, acumulos: 1, aplicadoEm: 0 }],
    });
    const { eventos } = aplicarAcao(batalha, { tipo: "defender" });
    expect(eventosDo(eventos, "turnoPerdido", { origemId: "i0" })).toHaveLength(1);
    expect(eventosDo(eventos, "golpeUsado", { origemId: "i0" })).toHaveLength(0);
  });

  it("provocação redireciona o ataque inimigo", () => {
    const herois = [heroiTeste("cavaleiro", 5), heroiTeste("mago", 5)];
    let { batalha } = batalhaTeste({ herois });
    // Ordem: esqueleto (25) → mago (17) → cavaleiro (9)
    expect(batalha.ativoId).toBe("h1");
    batalha = aplicarAcao(batalha, { tipo: "defender" }).batalha;
    expect(batalha.ativoId).toBe("h0");
    const { eventos } = aplicarAcao(batalha, { tipo: "golpe", golpeId: "provocar" });
    const ataque = eventosDo(eventos, "golpeUsado", { origemId: "i0" })[0];
    expect(ataque.alvos).toEqual(["h0"]);
  });

  it("inimigo imune resiste ao status", () => {
    let resistiu = false;
    for (let semente = 0; semente < 30 && !resistiu; semente++) {
      let { batalha } = batalhaTeste({
        herois: [heroiTeste("assassino", 5)],
        inimigos: [{ id: "zumbi_fraco", nivel: 5 }],
        semente,
      });
      batalha = ajustar(batalha, "h0", { atributos: certeiro });
      const { eventos } = aplicarAcao(batalha, golpeQualquer(batalha, "lamina_envenenada"));
      const noZumbi = { statusId: "veneno", alvoId: "i0" };
      expect(eventosDo(eventos, "statusAplicado", noZumbi)).toHaveLength(0);
      resistiu = eventosDo(eventos, "statusResistido", noZumbi).length > 0;
    }
    expect(resistiu).toBe(true);
  });

  it("descobre a afinidade ao acertar e passa a mostrá-la na prévia", () => {
    let { batalha } = batalhaTeste({
      herois: [heroiTeste("mago", 5)],
      inimigos: [{ id: "zumbi_fraco", nivel: 5 }],
    });
    batalha = ajustar(batalha, "h0", { atributos: certeiro });
    const acao = { tipo: "golpe", golpeId: "bola_de_fogo", alvoId: "i0" };
    expect(preverAcao(batalha, acao)[0].afinidade).toBe("desconhecida");

    const { batalha: depois, eventos } = aplicarAcao(batalha, acao);
    expect(eventosDo(eventos, "afinidadeDescoberta", { elemento: "fogo", afinidade: "fraco" })).toHaveLength(1);
    expect(depois.afinidadesConhecidas.zumbi_fraco).toContain("fogo");
    if (depois.fase === "escolhaAcao") {
      expect(preverAcao(depois, acao)[0].afinidade).toBe("fraco");
    }
  });

  it("a prévia contém o dano real (sem crítico)", () => {
    for (let semente = 0; semente < 10; semente++) {
      let { batalha } = batalhaTeste({ herois: [heroiTeste("mago", 5)], semente });
      batalha = ajustar(batalha, "h0", { atributos: certeiro });
      const acao = { tipo: "golpe", golpeId: "relampago", alvoId: "i0" };
      const [previa] = preverAcao(batalha, acao);
      const dano = eventosDo(aplicarAcao(batalha, acao).eventos, "dano", { origemId: "h0" })[0];
      if (dano.critico) continue;
      expect(dano.valor).toBeGreaterThanOrEqual(previa.danoMin);
      expect(dano.valor).toBeLessThanOrEqual(previa.danoMax);
    }
  });

  it("defender reduz o dano previsto pela metade", () => {
    let { batalha } = batalhaTeste({ herois: [heroiTeste("mago", 5)] });
    const acao = { tipo: "golpe", golpeId: "relampago", alvoId: "i0" };
    const normal = preverAcao(batalha, acao)[0];
    batalha = ajustar(batalha, "i0", { defendendo: true });
    const defendendo = preverAcao(batalha, acao)[0];
    expect(defendendo.danoMax).toBeLessThanOrEqual(Math.ceil(normal.danoMax / 2));
  });
});

describe("salvar e retomar", () => {
  it("uma batalha serializada continua exatamente igual", () => {
    const { batalha } = batalhaTeste({
      herois: [heroiTeste("cavaleiro", 5), heroiTeste("bardo", 5)],
      inimigos: [
        { id: "esqueleto_fraco", nivel: 5 },
        { id: "rato_tumba", nivel: 5 },
      ],
    });
    const restaurada = JSON.parse(JSON.stringify(batalha));
    const acao = { tipo: "defender" };
    expect(aplicarAcao(restaurada, acao)).toEqual(aplicarAcao(batalha, acao));
  });

  it("mantém o log limitado", () => {
    let { batalha } = batalhaTeste({
      herois: [heroiTeste("cavaleiro", 10)],
      inimigos: [{ id: "zumbi_fraco", nivel: 1 }],
    });
    batalha = ajustar(batalha, "h0", { atributos: { defesa: 999 }, hpMax: 99999, hpAtual: 99999 });
    for (let i = 0; i < 40 && batalha.fase === "escolhaAcao"; i++) {
      batalha = aplicarAcao(batalha, { tipo: "defender" }).batalha;
    }
    expect(batalha.log.length).toBeLessThanOrEqual(MAX_LOG_BATALHA);
  });
});

describe("reviver e drops", () => {
  it("Erva Revigorante levanta um aliado caído", () => {
    let { batalha } = batalhaTeste({ herois: [heroiTeste("cavaleiro", 5), heroiTeste("mago", 5)] });
    const caido = batalha.ativoId === "h0" ? "h1" : "h0";
    batalha = ajustar(batalha, caido, { nocauteado: true, hpAtual: 0 });
    expect(alvosParaItem(batalha, "erva_revigorante")).toEqual([caido]);
    expect(alvosParaItem(batalha, "pocao_pequena")).not.toContain(caido);

    const { batalha: depois, eventos } = aplicarAcao(batalha, { tipo: "item", itemId: "erva_revigorante", alvoId: caido });
    const reviveu = eventosDo(eventos, "reviveu", { alvoId: caido })[0];
    expect(reviveu.hpDepois).toBe(Math.floor(batalha.combatentes[caido].hpMax * 0.25));
    expect(depois.combatentes[caido].nocauteado === false || eventosDo(eventos, "nocaute", { alvoId: caido }).length > 0).toBe(true);
  });

  it("registra os drops de cada inimigo para o bestiário", () => {
    let achou = false;
    for (let semente = 0; semente < 20 && !achou; semente++) {
      let { batalha } = batalhaTeste({ inimigos: [{ id: "rato_tumba", nivel: 3 }], semente });
      batalha = ajustar(batalha, "h0", { atributos: { velocidade: 999, forca: 999 } });
      const { recompensas } = aplicarAcao(batalha, golpeQualquer(batalha)).batalha;
      const vistos = recompensas.dropsPorInimigo.rato_tumba || [];
      expect(vistos.every((id) => recompensas.itens[id] > 0)).toBe(true);
      achou = vistos.length > 0;
    }
    expect(achou).toBe(true);
  });
});
