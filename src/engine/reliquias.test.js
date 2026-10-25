import { describe, it, expect } from "vitest";
import { reliquiaDaVitoria, efeitosDoGrupo, comReliquiasDosChefesVencidos } from "./reliquias";
import { aplicarResultadoBatalha } from "./progressao";
import { adicionarReliquia } from "./colecao";
import { criarBatalha, preverAcao } from "./combate";
import { criarRng } from "./rng";
import { criarNovoJogo } from "../save/novoJogo";
import { reliquias, CHANCE_RELIQUIA_REVANCHE } from "../data/reliquias";

function jogo() {
  return criarNovoJogo({ nomeHeroi: "Ana", classeId: "bardo", agora: 0, rng: criarRng(6) });
}

function comChefeVencido(save, zonaId) {
  return {
    ...save,
    progresso: { ...save.progresso, zonas: { ...save.progresso.zonas, [zonaId]: { ...save.progresso.zonas[zonaId], chefeDerrotado: true } } },
  };
}

const vitoriaSobreOChefe = (zonaId = "cemiterio") => ({ resultado: "vitoria", origem: { tipo: "zona", zonaId, chefe: true } });

function batalhaEncerrada(save, origem) {
  return {
    fase: "fim",
    resultado: "vitoria",
    origem,
    semente: 7,
    recompensas: { xp: 100, ouro: 100, itens: {}, equipamentos: [], dropsPorInimigo: {} },
    combatentes: { h0: { lado: "herois", refId: save.grupo[0] } },
    afinidadesConhecidas: {},
  };
}

describe("relíquias (SPEC §3.11)", () => {
  it("cai garantida na primeira vitória sobre o chefe da zona", () => {
    const save = jogo();
    expect(reliquiaDaVitoria(save, vitoriaSobreOChefe(), criarRng(1))).toBe("coroa_do_guardiao");
    const { save: depois, resumo } = aplicarResultadoBatalha(save, batalhaEncerrada(save, vitoriaSobreOChefe().origem));
    expect(resumo.reliquiaNova).toBe("coroa_do_guardiao");
    expect(depois.colecao.reliquias).toEqual(["coroa_do_guardiao"]);
  });

  it("nas revanches cai com 5% enquanto o jogador não a tiver", () => {
    const save = comChefeVencido(jogo(), "cemiterio");
    let quedas = 0;
    const N = 4000;
    for (let s = 0; s < N; s++) if (reliquiaDaVitoria(save, vitoriaSobreOChefe(), criarRng(s))) quedas += 1;
    expect(quedas / N).toBeCloseTo(CHANCE_RELIQUIA_REVANCHE, 1);
  });

  it("não cai de novo quem já tem, nem em encontros comuns, derrotas ou masmorras", () => {
    const save = jogo();
    const comCoroa = adicionarReliquia(save, "coroa_do_guardiao");
    expect(reliquiaDaVitoria(comCoroa, vitoriaSobreOChefe(), criarRng(1))).toBeNull();
    expect(reliquiaDaVitoria(save, { resultado: "vitoria", origem: { tipo: "zona", zonaId: "cemiterio", chefe: false } }, criarRng(1))).toBeNull();
    expect(reliquiaDaVitoria(save, { ...vitoriaSobreOChefe(), resultado: "derrota" }, criarRng(1))).toBeNull();
    expect(reliquiaDaVitoria(save, { resultado: "vitoria", origem: { tipo: "masmorra", zonaId: "cemiterio", chefe: true } }, criarRng(1))).toBeNull();
  });

  it("efeitos do grupo: relíquias que o jogador tem e a refeição ativa", () => {
    let save = adicionarReliquia(jogo(), "coroa_do_guardiao");
    save = { ...save, refeicaoAtiva: { itemId: "ensopado_do_coveiro", encontrosRestantes: 3 } };
    expect(efeitosDoGrupo(save)).toEqual([reliquias.coroa_do_guardiao.efeito, { tipo: "vidaMax", valor: 0.1 }]);
  });

  it("Coroa do Guardião: golpes de luz causam 10% a mais", () => {
    const save = jogo();
    const heroi = save.herois[save.grupo[0]];
    const prever = (efeitos) => {
      const { batalha } = criarBatalha({
        herois: [{ ...heroi, golpesEquipados: ["acorde_letal"] }],
        equipamentos: save.inventario.equipamentos,
        inimigos: [{ id: "rato_tumba", nivel: 1 }],
        origem: { tipo: "zona", zonaId: "cemiterio" },
        semente: 3,
        efeitos,
      });
      const alvo = Object.values(batalha.combatentes).find((c) => c.lado === "inimigos");
      // Prévia sem RNG: só o modificador muda entre as duas batalhas
      const ativo = Object.values(batalha.combatentes).find((c) => c.lado === "herois");
      return preverAcao({ ...batalha, ativoId: ativo.id }, { tipo: "golpe", golpeId: "acorde_letal", alvoId: alvo.id })[0];
    };
    const sem = prever([]);
    const com = prever([reliquias.coroa_do_guardiao.efeito]);
    expect(com.danoMax).toBeGreaterThan(sem.danoMax);
    expect(com.danoMax / sem.danoMax).toBeCloseTo(1.1, 1);
  });

  it("efeitos do mesmo tipo se somam (relíquia + refeição de XP)", () => {
    let save = adicionarReliquia(jogo(), "olho_do_devorador");
    save = { ...save, refeicaoAtiva: { itemId: "sopa_de_alga", encontrosRestantes: 3 } };
    const { resumo } = aplicarResultadoBatalha(save, batalhaEncerrada(save, { tipo: "zona", zonaId: "cemiterio" }));
    expect(resumo.xp).toBe(125); // +10% da relíquia e +15% da sopa
  });

  it("migração: chefes já vencidos dão as relíquias deles", () => {
    const save = comChefeVencido(comChefeVencido(jogo(), "cemiterio"), "minas");
    expect(comReliquiasDosChefesVencidos(save).colecao.reliquias).toEqual(["coroa_do_guardiao", "coracao_de_pedra"]);
  });
});
