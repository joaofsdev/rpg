import { describe, it, expect } from "vitest";
import { migrarSave, carregarSave } from "./migracoes";
import { VERSAO_SAVE, validarSave } from "./formato";
import { criarNovoJogo } from "./novoJogo";
import { criarRng } from "../engine/rng";

// Um save como a versão 2 gravava (Fases 3 a 5)
function saveV2() {
  const atual = criarNovoJogo({ nomeHeroi: "Ana", classeId: "mago", agora: 1, rng: criarRng(1) });
  return { ...atual, versao: 2, masmorraAtual: null };
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

  it("carrega um save v2 gravado no localStorage", () => {
    const resultado = carregarSave(JSON.stringify(saveV2()));
    expect(resultado.status).toBe("ok");
    expect(resultado.save.versao).toBe(VERSAO_SAVE);
  });

  it("não altera o save de entrada", () => {
    const antigo = saveV2();
    const copia = structuredClone(antigo);
    migrarSave(antigo);
    expect(antigo).toEqual(copia);
  });
});
