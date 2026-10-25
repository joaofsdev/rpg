import { describe, it, expect } from "vitest";
import usuariosV1 from "./__fixtures__/rpgUsersV1.json";
import { listarContasV1, migrarContaV1, converterItemV1 } from "./migracaoV1";
import { validarSave, VERSAO_SAVE } from "./formato";
import { criarRng } from "../engine/rng";
import { xpParaProximoNivel } from "../engine/progressao";
import { podeEquipar } from "../engine/itens";
import { CONSUMIVEIS_INICIAIS } from "../data/constants";

function migrar(username) {
  return migrarContaV1(username, usuariosV1[username], { agora: 5000, rng: criarRng(9) });
}

function principal(save) {
  return save.herois[save.grupo[0]];
}

describe("migração v1 → v2", () => {
  it("lista só contas com personagem, da mais antiga para a mais nova", () => {
    expect(listarContasV1(usuariosV1).map((c) => c.username)).toEqual(["aldric", "mira"]);
  });

  it("gera um save v2 válido", () => {
    for (const username of ["aldric", "mira"]) {
      const save = migrar(username);
      expect(save.versao).toBe(VERSAO_SAVE);
      expect(validarSave(save)).toEqual([]);
    }
  });

  it("mantém nível, ouro e todos os itens do Cavaleiro nv 14", () => {
    const save = migrar("aldric");
    const heroi = principal(save);
    expect(heroi.nome).toBe("aldric");
    expect(heroi.classeId).toBe("cavaleiro");
    expect(heroi.nivel).toBe(14);
    expect(save.ouro).toBe(1234);

    const idsAntigos = [
      ...usuariosV1.aldric.character.inventario.map((i) => i.id),
      usuariosV1.aldric.character.equipamentos.peitoral.id,
      usuariosV1.aldric.character.equipamentos.arma.id,
    ];
    for (const id of idsAntigos) expect(save.inventario.equipamentos[id]).toBeDefined();
    expect(heroi.equipamento.arma).toBe("a1b2c3d4-0000-4000-8000-000000000001");
    expect(heroi.equipamento.peitoral).toBe("a1b2c3d4-0000-4000-8000-000000000002");
  });

  it("converte XP proporcionalmente e mantém os pontos distribuídos", () => {
    const heroi = principal(migrar("aldric"));
    expect(heroi.xp).toBe(Math.floor((1500 / 4760) * xpParaProximoNivel(14)));
    expect(heroi.pontosNivel).toMatchObject({ vida: 15, forca: 18, defesa: 6, velocidade: 0 });
    expect(heroi.pontosLivres).toBe(0);
  });

  it("move pontos de força do Mago para magia", () => {
    const heroi = principal(migrar("mira"));
    expect(heroi.pontosNivel.forca).toBe(0);
    expect(heroi.pontosNivel.magia).toBe(4);
    expect(heroi.pontosNivel.vida).toBe(2);
  });

  it("converte bônus de força de armas mágicas em magia", () => {
    const cajado = usuariosV1.aldric.character.inventario.find((i) => i.tipoArma === "cajado");
    const convertido = converterItemV1(cajado);
    expect(convertido.bonus.magia).toBe(22);
    expect(convertido.bonus.forca).toBe(0);
    expect(convertido.slot).toBe("arma");
    expect(convertido.aprimoramento).toBe(0);
  });

  it("converte progresso de zonas, masmorras, chefes e estatísticas", () => {
    const save = migrar("aldric");
    expect(save.progresso.zonas.cemiterio).toEqual({
      desbloqueada: true,
      encontrosVencidos: 10,
      chefeDerrotado: true,
    });
    expect(save.progresso.zonas.minas.desbloqueada).toBe(true);
    expect(save.progresso.zonas.costa.desbloqueada).toBe(false);
    expect(save.progresso.masmorras.cripta_esquecida).toMatchObject({ concluida: true, desbloqueada: true });
    expect(save.progresso.masmorras.minas_abandonadas.desbloqueada).toBe(false);
    expect(save.bestiario.guardiao_cripta.derrotas).toBe(1);
    expect(save.estatisticas.encontrosVencidos).toBe(87);
  });

  it("dá a relíquia do chefe já vencido e registra na coleção o que a conta tinha", () => {
    const save = migrar("aldric");
    expect(save.colecao.reliquias).toEqual(["coroa_do_guardiao"]);
    expect(migrar("mira").colecao.reliquias).toEqual([]);
    const registrados = Object.values(save.colecao.equipamentos).reduce((s, r) => s + r.length, 0);
    expect(registrados).toBeGreaterThan(0);
    expect(save.colecao.itens).toContain("pocao_pequena");
  });

  it("adiciona um companheiro de outra classe, 2 níveis abaixo e equipado", () => {
    const save = migrar("aldric");
    expect(save.grupo).toHaveLength(2);
    const companheiro = save.herois[save.grupo[1]];
    expect(companheiro.classeId).not.toBe("cavaleiro");
    expect(companheiro.nivel).toBe(12);
    for (const id of Object.values(companheiro.equipamento)) {
      expect(id).toBeTruthy();
      expect(podeEquipar(companheiro.classeId, save.inventario.equipamentos[id])).toBe(true);
    }
  });

  it("companheiro de herói nível 1 continua nível 1", () => {
    const conta = structuredClone(usuariosV1.mira);
    conta.character.nivel = 1;
    const save = migrarContaV1("mira", conta, { agora: 1, rng: criarRng(1) });
    expect(save.herois[save.grupo[1]].nivel).toBe(1);
  });

  it("dá os consumíveis iniciais e não altera a conta original", () => {
    const antes = structuredClone(usuariosV1);
    const save = migrar("mira");
    expect(save.inventario.itens).toEqual(CONSUMIVEIS_INICIAIS);
    expect(usuariosV1).toEqual(antes);
  });
});
