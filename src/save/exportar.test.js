import { describe, it, expect } from "vitest";
import { exportarSave, importarSave, FORMATO_EXPORTACAO } from "./exportar";
import { criarNovoJogo } from "./novoJogo";
import { criarRng } from "../engine/rng";
import { VERSAO_SAVE } from "./formato";

function novoSave() {
  return criarNovoJogo({ nomeHeroi: "Joana d'Ávila", classeId: "bardo", agora: 100, rng: criarRng(4) });
}

describe("exportar e importar", () => {
  it("exporta com nome de arquivo legível e reimporta igual", () => {
    const save = novoSave();
    const agora = Date.UTC(2026, 9, 23, 15);
    const { nomeArquivo, conteudo } = exportarSave(save, agora);
    expect(nomeArquivo).toBe("magichill-joana-d-avila-2026-10-23.json");
    expect(JSON.parse(conteudo).formato).toBe(FORMATO_EXPORTACAO);

    const importado = importarSave(conteudo);
    expect(importado.ok).toBe(true);
    expect(importado.save).toEqual(save);
  });

  it("recusa arquivos que não são saves", () => {
    expect(importarSave("não é json").ok).toBe(false);
    expect(importarSave(JSON.stringify({ qualquer: 1 })).ok).toBe(false);
  });

  it("recusa saves de versão mais nova", () => {
    const save = { ...novoSave(), versao: VERSAO_SAVE + 1 };
    const texto = JSON.stringify({ formato: FORMATO_EXPORTACAO, versao: VERSAO_SAVE + 1, save });
    expect(importarSave(texto)).toMatchObject({ ok: false });
  });

  it("recusa saves estruturalmente inválidos", () => {
    const save = { ...novoSave(), grupo: [] };
    const texto = JSON.stringify({ formato: FORMATO_EXPORTACAO, versao: 2, save });
    expect(importarSave(texto)).toMatchObject({ ok: false, erro: expect.stringContaining("Grupo") });
  });
});
