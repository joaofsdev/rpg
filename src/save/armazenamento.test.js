import { describe, it, expect } from "vitest";
import usuariosV1 from "./__fixtures__/rpgUsersV1.json";
import { criarStorageMemoria } from "./__fixtures__/storageMemoria";
import {
  migrarLegado,
  lerIndice,
  lerSlot,
  gravarSlot,
  apagarSlot,
  chaveSlot,
  CHAVE_INDICE,
} from "./armazenamento";
import { CHAVE_LEGADO } from "./migracaoV1";
import { criarNovoJogo } from "./novoJogo";
import { criarRng } from "../engine/rng";

const textoLegado = JSON.stringify(usuariosV1);

function storageComLegado() {
  return criarStorageMemoria({ [CHAVE_LEGADO]: textoLegado });
}

function novoSave(nome = "Ana") {
  return criarNovoJogo({ nomeHeroi: nome, classeId: "mago", agora: 100, rng: criarRng(3) });
}

describe("migração do localStorage", () => {
  it("migra as contas antigas para slots e mantém rpg_users intacto", () => {
    const storage = storageComLegado();
    const resultado = migrarLegado(storage, { agora: 1000, rng: criarRng(1) });

    expect(resultado).toEqual({ status: "migrado", slots: ["aldric", "mira"] });
    expect(storage.getItem(CHAVE_LEGADO)).toBe(textoLegado);

    const indice = lerIndice(storage);
    expect(indice.migradoDeV1).toBe(true);
    expect(indice.slots[0]).toMatchObject({ nome: "aldric", nivelMaisAlto: 14, classePrincipal: "Cavaleiro" });
    expect(indice.slots[1]).toMatchObject({ nome: "mira", classePrincipal: "Mago" });
    expect(indice.slots[2]).toBeNull();
    expect(lerSlot(storage, 0).status).toBe("ok");
  });

  it("executa uma única vez", () => {
    const storage = storageComLegado();
    migrarLegado(storage, { agora: 1000, rng: criarRng(1) });
    const slotAntes = storage.getItem(chaveSlot(0));
    expect(migrarLegado(storage, { agora: 2000, rng: criarRng(2) })).toEqual({ status: "naoNecessario" });
    expect(storage.getItem(chaveSlot(0))).toBe(slotAntes);
  });

  it("sem dados antigos cria um índice vazio", () => {
    const storage = criarStorageMemoria();
    expect(migrarLegado(storage, { agora: 1, rng: criarRng(1) })).toEqual({ status: "semLegado" });
    expect(lerIndice(storage).slots).toEqual([null, null, null]);
  });

  it("com mais de 3 contas pede para escolher e migra só as escolhidas", () => {
    const usuarios = structuredClone(usuariosV1);
    for (const nome of ["c3", "c4"]) {
      usuarios[nome] = { ...structuredClone(usuariosV1.mira), createdAt: `2026-07-0${nome[1]}T00:00:00Z` };
    }
    const storage = criarStorageMemoria({ [CHAVE_LEGADO]: JSON.stringify(usuarios) });

    const pedido = migrarLegado(storage, { agora: 1, rng: criarRng(1) });
    expect(pedido.status).toBe("escolhaNecessaria");
    expect(pedido.contas).toHaveLength(4);
    expect(storage.getItem(CHAVE_INDICE)).toBeNull();

    const resultado = migrarLegado(storage, { agora: 1, rng: criarRng(1), usernames: ["c4", "aldric", "c3"] });
    expect(resultado.slots).toEqual(["c4", "aldric", "c3"]);
    expect(lerIndice(storage).slots.map((s) => s.nome)).toEqual(["c4", "aldric", "c3"]);
  });
});

describe("slots", () => {
  it("grava, lê e apaga um slot atualizando o índice", () => {
    const storage = criarStorageMemoria();
    const save = novoSave();
    gravarSlot(storage, 1, save, { agora: 500 });

    const lido = lerSlot(storage, 1);
    expect(lido.status).toBe("ok");
    expect(lido.save.atualizadoEm).toBe(500);
    expect(lerIndice(storage).ultimoSlot).toBe(1);

    apagarSlot(storage, 1);
    expect(lerSlot(storage, 1)).toEqual({ status: "vazio" });
    expect(lerIndice(storage).slots[1]).toBeNull();
  });

  it("um save corrompido aparece como danificado e não é sobrescrito", () => {
    const storage = criarStorageMemoria({ [chaveSlot(0)]: "{ isto não é json" });
    const lido = lerSlot(storage, 0);
    expect(lido.status).toBe("danificado");
    expect(lido.bruto).toBe("{ isto não é json");

    expect(() => gravarSlot(storage, 0, novoSave(), { agora: 1 })).toThrow(/danificado/);
    expect(storage.getItem(chaveSlot(0))).toBe("{ isto não é json");

    gravarSlot(storage, 0, novoSave(), { agora: 1, forcar: true });
    expect(lerSlot(storage, 0).status).toBe("ok");
  });

  it("save de versão mais nova é tratado como danificado", () => {
    const save = { ...novoSave(), versao: 99 };
    const storage = criarStorageMemoria({ [chaveSlot(2)]: JSON.stringify(save) });
    expect(lerSlot(storage, 2).status).toBe("danificado");
  });
});
