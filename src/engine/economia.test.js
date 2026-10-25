// Calibração da economia de ouro (SPEC.md §4.9): custos de recrutamento e treino e o ouro das
// expedições comparados com a renda de cada zona. Determinístico pelas sementes fixas.
import { describe, it, expect } from "vitest";
import { simularCampanha, ENCONTROS_POR_DIA } from "./__fixtures__/economia";
import { custoDoRecruta } from "./recrutamento";
import { custoTreinoAtributo } from "./treino";
import { recompensaDaExpedicao } from "./expedicoes";
import { custoDaForja, custoDoAprimoramento } from "./ferraria";
import { classesHeroi } from "../data/classesHeroi";
import { golpes } from "../data/golpes";
import { NIVEIS_ABAIXO_DO_GRUPO } from "../data/recrutamento";
import { NIVEIS_ANTECIPADOS_GOLPE, DURACOES_TREINO_HORAS } from "../data/treino";
import { DURACOES_EXPEDICAO_MINUTOS, MINUTOS_POR_ROLAGEM } from "../data/expedicoes";

const SEMENTES = [1, 2, 3, 4, 5];

// Metas. "Encontros de renda" = custo ÷ renda média por encontro da zona (encontros + expedições).
const PRIMEIRO_RECRUTA_ENCONTRO_MIN = 5; // o primeiro recruta cabe na zona 1, mas não é imediato
const RECRUTA_ENCONTROS = [5, 12];
const TREINO_HORA_ENCONTROS = [1, 4]; // 1 h de treino de atributo no nível médio da zona
const TREINO_GOLPE_ENCONTROS = [4, 12]; // golpe avançado, na zona em que ele fica treinável
const EXPEDICAO_8H_ENCONTROS = [2, 10]; // uma expedição de 8 h, em encontros de ouro da zona
const EXPEDICOES_SOBRE_ENCONTROS_MAX = 0.75; // expedições complementam o combate, não o substituem
const TREINO_DIARIO_SOBRE_RENDA = [0.2, 0.9]; // 1 treino de 8 h por dia cabe na renda de um dia
const FORJA_ENCONTROS = [2, 10]; // ouro para forjar uma arma na zona
const APRIMORAR_ATE_5_ENCONTROS = [5, 25]; // ouro para levar um item da zona de +0 a +5

const campanhas = SEMENTES.map((s) => simularCampanha(s));
const todasAsZonas = campanhas.flatMap((c) => c.zonas);

function nivelMedioDaZona(z) {
  return Math.round((z.nivelInicio + z.nivelFim) / 2);
}

function nivelDaReserva(z) {
  return Math.max(1, nivelMedioDaZona(z) - NIVEIS_ABAIXO_DO_GRUPO);
}

function dentro(valor, [min, max], rotulo) {
  expect(valor, rotulo).toBeGreaterThanOrEqual(min);
  expect(valor, rotulo).toBeLessThanOrEqual(max);
}

describe("economia: recrutamento", () => {
  it.each(SEMENTES.map((s, i) => [s, campanhas[i]]))(
    "semente %i: o primeiro recruta cabe no ouro da zona 1, depois do 5º encontro",
    (_, { marcos }) => {
      const primeiro = marcos.find((m) => m.ouroAcumulado >= custoDoRecruta(Math.max(1, m.nivelMedio - NIVEIS_ABAIXO_DO_GRUPO)));
      expect(primeiro.zonaIndice).toBe(0);
      expect(primeiro.encontroNaZona).toBeGreaterThanOrEqual(PRIMEIRO_RECRUTA_ENCONTRO_MIN);
    },
  );

  it("em toda zona, um recruta custa de 5 a 12 encontros de renda", () => {
    for (const z of todasAsZonas) dentro(custoDoRecruta(nivelDaReserva(z)) / z.rendaPorEncontro, RECRUTA_ENCONTROS, z.zona.id);
  });
});

describe("economia: treino", () => {
  it("em toda zona, 1 h de treino de atributo custa de 1 a 4 encontros de renda", () => {
    for (const z of todasAsZonas) {
      dentro(custoTreinoAtributo({ nivel: nivelMedioDaZona(z) }, 1) / z.rendaPorEncontro, TREINO_HORA_ENCONTROS, z.zona.id);
    }
  });

  it("em toda zona, 1 treino de 8 h por dia custa de 20% a 90% da renda de um dia", () => {
    const horas = Math.max(...DURACOES_TREINO_HORAS);
    for (const z of todasAsZonas) {
      const rendaDoDia = z.rendaPorEncontro * ENCONTROS_POR_DIA;
      dentro(custoTreinoAtributo({ nivel: nivelDaReserva(z) }, horas) / rendaDoDia, TREINO_DIARIO_SOBRE_RENDA, z.zona.id);
    }
  });

  it.each(Object.values(classesHeroi))("$nome: golpe avançado custa de 4 a 12 encontros de renda quando fica treinável", (classe) => {
    for (const { zonas } of campanhas) {
      for (const { nivel, golpeId } of classe.golpesPorNivel) {
        const nivelTreinavel = nivel - NIVEIS_ANTECIPADOS_GOLPE;
        const z = zonas.find((zz) => nivelTreinavel >= zz.zona.nivelMin && nivelTreinavel <= zz.zona.nivelMax);
        dentro(golpes[golpeId].treino.ouro / z.rendaPorEncontro, TREINO_GOLPE_ENCONTROS, golpeId);
      }
    }
  });
});

describe("economia: expedições", () => {
  it("8 h de expedição rendem o ouro de 2 a 10 encontros da zona", () => {
    const rolagens = Math.max(...DURACOES_EXPEDICAO_MINUTOS) / MINUTOS_POR_ROLAGEM;
    for (const z of todasAsZonas) {
      const { ouro } = recompensaDaExpedicao({ parametros: { zonaId: z.zona.id }, semente: 1 }, rolagens);
      dentro(ouro / z.ouroPorEncontro, EXPEDICAO_8H_ENCONTROS, z.zona.id);
    }
  });

  it("com 1 expedição de 8 h por vaga por dia, as expedições rendem no máximo 75% do ouro dos encontros", () => {
    for (const z of todasAsZonas) {
      expect(z.ouroExpedicoes / z.ouroEncontros, z.zona.id).toBeLessThanOrEqual(EXPEDICOES_SOBRE_ENCONTROS_MAX);
    }
  });
});

describe("economia: gastos", () => {
  it("mesmo pagando o treino diário, dá para contratar reserva para as 5 vagas (3 de expedição e 2 de treino)", () => {
    for (const { contratacoes } of campanhas) expect(contratacoes).toHaveLength(5);
  });
});

describe("economia: ferraria", () => {
  it("forjar uma arma custa o ouro de 2 a 10 encontros de renda da zona", () => {
    for (const z of todasAsZonas) dentro(custoDaForja(z.zona, "arma").ouro / z.rendaPorEncontro, FORJA_ENCONTROS, z.zona.id);
  });

  it("levar um item do nível da zona de +0 a +5 custa o ouro de 5 a 25 encontros de renda", () => {
    for (const z of todasAsZonas) {
      let ouro = 0;
      for (let n = 0; n < 5; n++) ouro += custoDoAprimoramento({ nivel: z.zona.nivelMax, aprimoramento: n }).ouro;
      dentro(ouro / z.rendaPorEncontro, APRIMORAR_ATE_5_ENCONTROS, z.zona.id);
    }
  });
});
