// Calibração da economia de ouro (SPEC.md §4.9): custos de recrutamento e treino comparados com o
// ouro que o jogador ganha em cada zona. Determinístico pelas sementes fixas.
import { describe, it, expect } from "vitest";
import { simularCampanha } from "./__fixtures__/economia";
import { custoDoRecruta } from "./recrutamento";
import { custoTreinoAtributo } from "./treino";
import { classesHeroi } from "../data/classesHeroi";
import { golpes } from "../data/golpes";
import { NIVEIS_ABAIXO_DO_GRUPO } from "../data/recrutamento";
import { NIVEIS_ANTECIPADOS_GOLPE } from "../data/treino";

const SEMENTES = [1, 2, 3, 4, 5];

// Metas (em "encontros de ouro": custo ÷ ouro médio por encontro da zona)
const PRIMEIRO_RECRUTA_ENCONTRO_MIN = 5; // não é imediato…
const RECRUTA_ENCONTROS = [5, 12]; // recrutas seguintes, em qualquer zona
const TREINO_HORA_ENCONTROS = [1, 4]; // 1 h de treino de atributo no nível médio da zona
const TREINO_GOLPE_ENCONTROS = [4, 12]; // golpe avançado, na zona em que ele fica treinável

const campanhas = SEMENTES.map((s) => simularCampanha(s));

function nivelMedioDaZona(z) {
  return Math.round((z.nivelInicio + z.nivelFim) / 2);
}

function custoRecrutaNoNivel(nivelGrupo) {
  return custoDoRecruta(Math.max(1, nivelGrupo - NIVEIS_ABAIXO_DO_GRUPO));
}

describe("economia: recrutamento", () => {
  it.each(SEMENTES.map((s, i) => [s, campanhas[i]]))(
    "semente %i: o primeiro recruta cabe no ouro da zona 1, depois do 5º encontro",
    (_, { marcos }) => {
      const primeiro = marcos.find((m) => m.ouroAcumulado >= custoRecrutaNoNivel(m.nivelMedio));
      expect(primeiro.zonaIndice).toBe(0);
      expect(primeiro.encontroNaZona).toBeGreaterThanOrEqual(PRIMEIRO_RECRUTA_ENCONTRO_MIN);
    },
  );

  it("em toda zona, um recruta custa de 5 a 12 encontros de ouro", () => {
    for (const { zonas } of campanhas) {
      for (const z of zonas) {
        const encontros = custoRecrutaNoNivel(nivelMedioDaZona(z)) / z.ouroPorEncontro;
        expect(encontros, z.zona.id).toBeGreaterThanOrEqual(RECRUTA_ENCONTROS[0]);
        expect(encontros, z.zona.id).toBeLessThanOrEqual(RECRUTA_ENCONTROS[1]);
      }
    }
  });
});

describe("economia: treino", () => {
  it("em toda zona, 1 h de treino de atributo custa de 1 a 4 encontros de ouro", () => {
    for (const { zonas } of campanhas) {
      for (const z of zonas) {
        const encontros = custoTreinoAtributo({ nivel: nivelMedioDaZona(z) }, 1) / z.ouroPorEncontro;
        expect(encontros, z.zona.id).toBeGreaterThanOrEqual(TREINO_HORA_ENCONTROS[0]);
        expect(encontros, z.zona.id).toBeLessThanOrEqual(TREINO_HORA_ENCONTROS[1]);
      }
    }
  });

  it.each(Object.values(classesHeroi))("$nome: golpe avançado custa de 4 a 12 encontros de ouro quando fica treinável", (classe) => {
    for (const { zonas } of campanhas) {
      for (const { nivel, golpeId } of classe.golpesPorNivel) {
        const nivelTreinavel = nivel - NIVEIS_ANTECIPADOS_GOLPE;
        const z = zonas.find((zz) => nivelTreinavel >= zz.zona.nivelMin && nivelTreinavel <= zz.zona.nivelMax);
        const encontros = golpes[golpeId].treino.ouro / z.ouroPorEncontro;
        expect(encontros, golpeId).toBeGreaterThanOrEqual(TREINO_GOLPE_ENCONTROS[0]);
        expect(encontros, golpeId).toBeLessThanOrEqual(TREINO_GOLPE_ENCONTROS[1]);
      }
    }
  });
});
