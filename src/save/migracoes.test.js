import { describe, it, expect } from "vitest";
import { migrarSave, carregarSave, MIGRACOES } from "./migracoes";
import { VERSAO_SAVE, validarSave } from "./formato";
import { criarNovoJogo } from "./novoJogo";
import { criarRng } from "../engine/rng";

// Um save como a versão 4 gravava (Fases 7 a 9): coleção nunca preenchida
function saveV4() {
  const atual = criarNovoJogo({ nomeHeroi: "Ana", classeId: "mago", agora: 1, rng: criarRng(1) });
  return { ...atual, versao: 4, colecao: { equipamentos: {}, itens: [], reliquias: [] } };
}

// Um save como a versão 3 gravava (Fase 6): vagas fixas no save e atividade em cada herói
function saveV3() {
  const atual = saveV4();
  const herois = Object.fromEntries(
    Object.entries(atual.herois).map(([id, heroi]) => [id, { ...heroi, atividade: null }]),
  );
  return { ...atual, versao: 3, herois, vagas: { expedicao: 1, treino: 1, cozinha: 1 } };
}

// Um save como a versão 2 gravava (Fases 3 a 5)
function saveV2() {
  return { ...saveV3(), versao: 2, masmorraAtual: null };
}

describe("migrações", () => {
  it("leva um save v2 até a versão atual", () => {
    const migrado = migrarSave(saveV2());
    expect(migrado.versao).toBe(VERSAO_SAVE);
    expect(validarSave(migrado)).toEqual([]);
  });

  it("v2 → v3 normaliza masmorraAtual para null", () => {
    const antigo = { ...saveV2(), masmorraAtual: { zonaId: "cemiterio", andar: 2, recompensas: {} } };
    expect(migrarSave(antigo).masmorraAtual).toBeNull();
  });

  it("v3 → v4 tira as vagas fixas e a atividade dos heróis, mantendo o resto", () => {
    const antigo = saveV3();
    const migrado = MIGRACOES[3](antigo);
    expect(migrado.versao).toBe(4);
    expect(migrado).not.toHaveProperty("vagas");
    expect(migrado.atividades).toEqual({});
    expect(migrado.recrutas).toBeNull();
    for (const [id, heroi] of Object.entries(migrado.herois)) {
      expect(heroi).not.toHaveProperty("atividade");
      expect(heroi.nivel).toBe(antigo.herois[id].nivel);
      expect(heroi.equipamento).toEqual(antigo.herois[id].equipamento);
    }
    expect(migrado.grupo).toEqual(antigo.grupo);
    expect(migrado.ouro).toBe(antigo.ouro);
    expect(validarSave(migrarSave(antigo))).toEqual([]);
  });

  it("v4 → v5 preenche a coleção com o que o save tem e dá as relíquias dos chefes já vencidos", () => {
    const antigo = saveV4();
    antigo.progresso = {
      ...antigo.progresso,
      zonas: { ...antigo.progresso.zonas, cemiterio: { ...antigo.progresso.zonas.cemiterio, chefeDerrotado: true } },
    };
    const migrado = migrarSave(antigo);
    expect(migrado.versao).toBe(5);
    expect(migrado.colecao.reliquias).toEqual(["coroa_do_guardiao"]);
    expect(migrado.colecao.itens.sort()).toEqual(Object.keys(antigo.inventario.itens).sort());
    const registrados = Object.values(migrado.colecao.equipamentos).reduce((s, r) => s + r.length, 0);
    expect(registrados).toBeGreaterThan(0);
    expect(migrado.herois).toEqual(antigo.herois);
    expect(migrado.ouro).toBe(antigo.ouro);
    expect(validarSave(migrado)).toEqual([]);
  });

  it("v4 → v5 sem chefes vencidos não dá relíquia", () => {
    expect(migrarSave(saveV4()).colecao.reliquias).toEqual([]);
  });

  it("carrega saves v2, v3 e v4 gravados no localStorage", () => {
    for (const antigo of [saveV2(), saveV3(), saveV4()]) {
      const resultado = carregarSave(JSON.stringify(antigo));
      expect(resultado.status).toBe("ok");
      expect(resultado.save.versao).toBe(VERSAO_SAVE);
    }
  });

  it("não altera o save de entrada", () => {
    for (const antigo of [saveV2(), saveV3(), saveV4()]) {
      const copia = structuredClone(antigo);
      migrarSave(antigo);
      expect(antigo).toEqual(copia);
    }
  });
});
