import { describe, it, expect } from "vitest";
import { migrarSave, carregarSave } from "./migracoes";
import { VERSAO_SAVE, validarSave } from "./formato";
import { criarNovoJogo } from "./novoJogo";
import { criarRng } from "../engine/rng";

// Um save como a versão 3 gravava (Fase 6): vagas fixas no save e atividade em cada herói
function saveV3() {
  const atual = criarNovoJogo({ nomeHeroi: "Ana", classeId: "mago", agora: 1, rng: criarRng(1) });
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
    const migrado = migrarSave(antigo);
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
    expect(validarSave(migrado)).toEqual([]);
  });

  it("carrega saves v2 e v3 gravados no localStorage", () => {
    for (const antigo of [saveV2(), saveV3()]) {
      const resultado = carregarSave(JSON.stringify(antigo));
      expect(resultado.status).toBe("ok");
      expect(resultado.save.versao).toBe(VERSAO_SAVE);
    }
  });

  it("não altera o save de entrada", () => {
    for (const antigo of [saveV2(), saveV3()]) {
      const copia = structuredClone(antigo);
      migrarSave(antigo);
      expect(antigo).toEqual(copia);
    }
  });
});
