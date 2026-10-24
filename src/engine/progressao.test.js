import { describe, it, expect } from "vitest";
import {
  xpParaProximoNivel,
  xpPorInimigo,
  ganharXp,
  aplicarResultadoBatalha,
  DERROTAS_PARA_REVELAR_AFINIDADES,
} from "./progressao";
import { aplicarAcao } from "./combate";
import { precoVendaItem } from "./inventario";
import { criarRng } from "./rng";
import { batalhaTeste, ajustar, golpeQualquer } from "./__fixtures__/batalhas";
import { criarNovoJogo } from "../save/novoJogo";
import { criarHeroi } from "./herois";
import { ELEMENTOS, MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";
import { zonas } from "../data/zonas";

describe("curva de XP (SPEC §4.7)", () => {
  it("bate com a tabela", () => {
    expect(xpParaProximoNivel(1)).toBe(200);
    expect(xpParaProximoNivel(10)).toBe(4081);
    expect(xpParaProximoNivel(50)).toBe(52381);
    expect(xpPorInimigo(1)).toBe(40);
    expect(xpPorInimigo(10)).toBe(336);
    expect(xpPorInimigo(50)).toBe(2206);
  });

  it("encontros por nível crescem (a curva desacelera)", () => {
    const encontros = (n) => xpParaProximoNivel(n) / (2 * xpPorInimigo(n));
    expect(encontros(1)).toBeLessThan(encontros(10));
    expect(encontros(10)).toBeLessThan(encontros(50));
  });
});

describe("ganharXp", () => {
  const base = criarHeroi({ id: "h", nome: "A", classeId: "mago" });

  it("sobe vários níveis de uma vez e dá 3 pontos por nível", () => {
    const { heroi, niveisGanhos } = ganharXp(base, 200 + xpParaProximoNivel(2) + 5);
    expect(heroi.nivel).toBe(3);
    expect(heroi.xp).toBe(5);
    expect(niveisGanhos).toBe(2);
    expect(heroi.pontosLivres).toBe(6);
  });

  it("aprende o golpe do nível 8 ao chegar nele", () => {
    const { heroi, golpesNovos } = ganharXp({ ...base, nivel: 7 }, xpParaProximoNivel(7));
    expect(heroi.nivel).toBe(8);
    expect(golpesNovos).toEqual(["lanca_de_gelo"]);
    expect(heroi.golpesAprendidos).toContain("lanca_de_gelo");
    expect(heroi.golpesEquipados).not.toContain("lanca_de_gelo");
  });

  it("não passa do nível 100", () => {
    const { heroi } = ganharXp({ ...base, nivel: 99 }, 10 ** 9);
    expect(heroi.nivel).toBe(100);
    expect(heroi.xp).toBe(0);
  });
});

function jogo() {
  return criarNovoJogo({ nomeHeroi: "Teste", classeId: "cavaleiro", agora: 1000, rng: criarRng(1) });
}

function heroisDo(save) {
  return save.grupo.map((id) => save.herois[id]);
}

function vencer(save, inimigos, origem = { tipo: "zona", zonaId: "cemiterio" }) {
  let { batalha } = batalhaTeste({
    herois: heroisDo(save),
    equipamentos: save.inventario.equipamentos,
    inimigos,
    origem,
  });
  for (let i = 0; i < 20 && batalha.fase === "escolhaAcao"; i++) {
    batalha = ajustar(batalha, batalha.ativoId, { atributos: { velocidade: 999, forca: 99999, magia: 99999 } });
    batalha = aplicarAcao(batalha, golpeQualquer(batalha)).batalha;
  }
  expect(batalha.resultado).toBe("vitoria");
  return batalha;
}

describe("aplicarResultadoBatalha", () => {
  it("vitória dá XP a todo o grupo, ouro, itens e conta o encontro", () => {
    const save = jogo();
    const batalha = vencer(save, [{ id: "rato_tumba", nivel: 1 }]);
    const { save: depois, resumo } = aplicarResultadoBatalha(save, batalha);

    for (const id of save.grupo) expect(depois.herois[id].xp).toBe(resumo.xp);
    expect(depois.ouro).toBe(save.ouro + batalha.recompensas.ouro);
    expect(depois.progresso.zonas.cemiterio.encontrosVencidos).toBe(1);
    expect(depois.bestiario.rato_tumba.derrotas).toBe(1);
    expect(depois.estatisticas.encontrosVencidos).toBe(1);
    expect(depois.batalha).toBeNull();
    expect(save.ouro).toBe(0);
  });

  it("vencer o chefe desbloqueia a próxima zona e a masmorra", () => {
    const save = jogo();
    const batalha = vencer(save, [{ id: "guardiao_cripta", nivel: 10 }], {
      tipo: "zona",
      zonaId: "cemiterio",
      chefe: true,
    });
    const { save: depois } = aplicarResultadoBatalha(save, batalha);
    expect(depois.progresso.zonas.cemiterio.chefeDerrotado).toBe(true);
    expect(depois.progresso.zonas.minas.desbloqueada).toBe(true);
    expect(depois.progresso.masmorras.cripta_esquecida.desbloqueada).toBe(true);
  });

  it("derrota mantém o que já foi ganho e não dá nada novo", () => {
    let save = jogo();
    save = aplicarResultadoBatalha(save, vencer(save, [{ id: "rato_tumba", nivel: 1 }])).save;
    const ouroAntes = save.ouro;

    let { batalha } = batalhaTeste({ herois: heroisDo(save), inimigos: [{ id: "rato_tumba", nivel: 1 }] });
    for (const id of ["h0", "h1"]) batalha = ajustar(batalha, id, { hpAtual: 1 });
    batalha = ajustar(batalha, "i0", { atributos: { velocidade: 999, forca: 999 } });
    for (let i = 0; i < 10 && batalha.fase === "escolhaAcao"; i++) {
      batalha = aplicarAcao(batalha, { tipo: "defender" }).batalha;
    }
    expect(batalha.resultado).toBe("derrota");

    const { save: depois } = aplicarResultadoBatalha(save, batalha);
    expect(depois.ouro).toBe(ouroAntes);
    expect(depois.estatisticas.derrotas).toBe(1);
    expect(depois.progresso.zonas.cemiterio.encontrosVencidos).toBe(1);
  });

  it("a 10ª derrota de um inimigo revela todas as afinidades", () => {
    let save = jogo();
    save = {
      ...save,
      bestiario: {
        rato_tumba: {
          visto: true,
          derrotas: DERROTAS_PARA_REVELAR_AFINIDADES - 1,
          afinidadesReveladas: [],
          dropsVistos: [],
        },
      },
    };
    const { save: depois } = aplicarResultadoBatalha(save, vencer(save, [{ id: "rato_tumba", nivel: 1 }]));
    expect(depois.bestiario.rato_tumba.afinidadesReveladas.sort()).toEqual([...ELEMENTOS].sort());
  });

  it("inventário cheio vende o equipamento excedente", () => {
    let save = jogo();
    const cheios = {};
    for (let i = 0; i < MAX_EQUIPAMENTOS_INVENTARIO; i++) {
      cheios[`x${i}`] = { id: `x${i}`, slot: "botas", raridade: "Comum", nivel: 1, bonus: {} };
    }
    save = { ...save, inventario: { ...save.inventario, equipamentos: { ...save.inventario.equipamentos, ...cheios } } };
    const batalha = vencer(save, [{ id: "guardiao_cripta", nivel: 10 }], {
      tipo: "zona",
      zonaId: "cemiterio",
      chefe: true,
    });
    const { save: depois, resumo } = aplicarResultadoBatalha(save, batalha);
    expect(resumo.equipamentosVendidos).toHaveLength(2);
    const vendido = resumo.equipamentosVendidos.reduce((s, v) => s + v.valor, 0);
    expect(depois.ouro).toBe(batalha.recompensas.ouro + vendido);
  });

  it("drops além do limite da pilha são vendidos e aparecem no resumo", () => {
    const base = jogo();
    const save = { ...base, inventario: { ...base.inventario, itens: { ...base.inventario.itens, osso_antigo: 998 } } };
    const batalha = vencer(save, [{ id: "rato_tumba", nivel: 1 }]);
    batalha.recompensas = { ...batalha.recompensas, itens: { osso_antigo: 4 }, equipamentos: [] };
    const { save: depois, resumo } = aplicarResultadoBatalha(save, batalha);
    expect(depois.inventario.itens.osso_antigo).toBe(999);
    expect(resumo.itens).toEqual({ osso_antigo: 1 });
    expect(resumo.itensVendidos).toEqual([{ itemId: "osso_antigo", qtd: 3, valor: 3 * precoVendaItem("osso_antigo") }]);
    expect(depois.ouro).toBe(save.ouro + batalha.recompensas.ouro + 3 * precoVendaItem("osso_antigo"));
  });

  it("refeição ativa perde um encontro a cada batalha", () => {
    let save = { ...jogo(), refeicaoAtiva: { itemId: "x", encontrosRestantes: 1 } };
    const { save: depois } = aplicarResultadoBatalha(save, vencer(save, [{ id: "rato_tumba", nivel: 1 }]));
    expect(depois.refeicaoAtiva).toBeNull();
  });

  it("a zona do MVP existe e é a primeira", () => {
    expect(zonas[0].id).toBe("cemiterio");
    expect(zonas[0].jogavel).toBe(true);
  });
});
