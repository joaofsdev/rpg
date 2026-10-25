import { describe, it, expect } from "vitest";
import { criarExibicao, aplicarEvento, efeitosDoEvento, descreverEvento, duracaoEvento, somDoEvento } from "./exibicao";
import { aplicarAcao, acoesDisponiveis } from "../../engine/combate";
import { batalhaTeste, heroiTeste } from "../../engine/__fixtures__/batalhas";

function reproduzir(inicial, eventos) {
  return eventos.reduce(aplicarEvento, criarExibicao(inicial));
}

function visiveis(status) {
  return [...new Set(status.map((s) => s.statusId).filter((id) => id !== "imune_atordoado"))].sort();
}

function compararComFinal(exibicao, batalha) {
  const esperado = criarExibicao(batalha);
  expect(exibicao.ativoId).toBe(esperado.ativoId);
  expect(exibicao.rodada).toBe(esperado.rodada);
  for (const [id, c] of Object.entries(esperado.combatentes)) {
    const visto = exibicao.combatentes[id];
    expect(visto.hpAtual).toBe(c.hpAtual);
    expect(visto.nocauteado).toBe(c.nocauteado);
    expect(visto.defendendo).toBe(c.defendendo);
    expect(visto.recurso?.atual).toBe(c.recurso?.atual);
    expect(visiveis(visto.status)).toEqual(visiveis(c.status));
    expect(visto.intencao?.golpeId).toBe(c.intencao?.golpeId);
  }
}

// Escolhe ações variadas e válidas de forma determinística
function proximaAcao(batalha, passo) {
  const opcoes = acoesDisponiveis(batalha);
  const golpes = opcoes.golpes.filter((g) => g.disponivel);
  const golpe = golpes[passo % golpes.length];
  if (passo % 5 === 4 || !golpe) return { tipo: "defender" };
  return { tipo: "golpe", golpeId: golpe.golpeId, alvoId: golpe.alvos[0] };
}

describe("reprodução dos eventos", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])("chega ao mesmo estado do motor (semente %i)", (semente) => {
    const classes = ["cavaleiro", "mago", "bardo", "assassino", "arqueiro", "barbaro"];
    const herois = [heroiTeste(classes[semente % 6], 6), heroiTeste(classes[(semente + 2) % 6], 6)];
    const criada = batalhaTeste({
      herois,
      inimigos: [
        { id: "zumbi_fraco", nivel: 5 },
        { id: "fantasma_menor", nivel: 5 },
      ],
      semente,
    });
    compararComFinal(reproduzir(criada.inicial, criada.eventos), criada.batalha);

    let batalha = criada.batalha;
    for (let passo = 0; passo < 60 && batalha.fase === "escolhaAcao"; passo++) {
      const { batalha: depois, eventos } = aplicarAcao(batalha, proximaAcao(batalha, passo));
      compararComFinal(reproduzir(batalha, eventos), depois);
      batalha = depois;
    }
  });
});

describe("efeitos e textos", () => {
  it("dano gera animação, número e partículas", () => {
    const efeitos = efeitosDoEvento({ tipo: "dano", alvoId: "i0", valor: 12, afinidade: "fraco", critico: false, elemento: "fogo" });
    expect(efeitos.map((e) => e.tipo)).toEqual(["animacao", "numero", "particulas"]);
    expect(efeitos[1]).toMatchObject({ texto: "12", estilo: "fraco" });
  });

  it("descreve eventos em português", () => {
    const { batalha } = batalhaTeste();
    const exibicao = criarExibicao(batalha);
    expect(descreverEvento({ tipo: "golpeUsado", origemId: "i0", golpeId: "golpe_ossudo" }, exibicao)).toBe(
      "Esqueleto Errante usou Golpe Ossudo.",
    );
    expect(descreverEvento({ tipo: "recurso" }, exibicao)).toBeNull();
  });

  it("acelerar divide a duração", () => {
    expect(duracaoEvento({ tipo: "dano" }, 2)).toBe(duracaoEvento({ tipo: "dano" }, 1) / 2);
    expect(duracaoEvento({ tipo: "recurso" }, 1)).toBe(0);
  });
});

describe("sons da batalha", () => {
  it("dano toca o som do tipo do golpe; crítico tem som próprio", () => {
    expect(somDoEvento({ tipo: "dano", valor: 10, elemento: "corte" })).toBe("golpeCorte");
    expect(somDoEvento({ tipo: "dano", valor: 10, elemento: "perfuracao" })).toBe("golpeCorte");
    expect(somDoEvento({ tipo: "dano", valor: 10, elemento: "impacto" })).toBe("golpeImpacto");
    expect(somDoEvento({ tipo: "dano", valor: 10, elemento: "fogo" })).toBe("golpeMagia");
    expect(somDoEvento({ tipo: "dano", valor: 10, elemento: "fogo", critico: true })).toBe("critico");
  });

  it("dano zero (imune) e custo de vida próprio ficam em silêncio", () => {
    expect(somDoEvento({ tipo: "dano", valor: 0, elemento: "luz" })).toBeNull();
    expect(somDoEvento({ tipo: "dano", valor: 5, elemento: "impacto", autoDano: true })).toBeNull();
    expect(somDoEvento({ tipo: "statusTick", valor: -5 })).toBeNull();
    expect(somDoEvento({ tipo: "turnoIniciado" })).toBeNull();
  });

  it("errou, cura, nocaute, status e item têm sons", () => {
    expect(["errou", "cura", "nocaute", "statusAplicado", "itemUsado", "reviveu"].map((tipo) => somDoEvento({ tipo }))).toEqual([
      "errou",
      "cura",
      "nocaute",
      "status",
      "item",
      "cura",
    ]);
  });
});
