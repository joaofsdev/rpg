import { describe, it, expect } from "vitest";
import {
  receitasConhecidas,
  porcoesPossiveis,
  motivoNaoPrepara,
  iniciarPreparo,
  porcoesProntas,
  comer,
  motivoNaoCome,
  efeitoDaRefeicao,
  receitaDaSemana,
  precoDaReceita,
  comprarReceita,
} from "./cozinha";
import { coletarAtividade, cancelarAtividade, resumoDoRetorno } from "./coleta";
import { aplicarResultadoBatalha } from "./progressao";
import { calcularAtributosHeroi, aumentarPercentual } from "./atributos";
import { criarBatalha } from "./combate";
import { criarRng } from "./rng";
import { criarNovoJogo } from "../save/novoJogo";
import { validarSave } from "../save/formato";
import { carregarSave } from "../save/migracoes";
import { receitas, DURACAO_ROTACAO_RECEITA_MS, PRECO_RECEITA_POR_ZONA } from "../data/receitas";
import { VIGOR } from "../data/constants";

const MINUTO = 60 * 1000;

function jogo(itens = { erva_da_nevoa: 10 }) {
  const save = criarNovoJogo({ nomeHeroi: "Ana", classeId: "cavaleiro", agora: 0, rng: criarRng(4) });
  return { ...save, ouro: 10000, inventario: { ...save.inventario, itens: { ...save.inventario.itens, ...itens } } };
}

function preparar(save, receitaId = "ensopado_do_coveiro", porcoes = 3, agora = 0) {
  return iniciarPreparo(save, { id: "p1", receitaId, porcoes, agora });
}

// Batalha já encerrada, só com o necessário para aplicarResultadoBatalha
function batalhaEncerrada(save, { resultado = "vitoria", xp = 100, ouro = 50, origem = { tipo: "zona", zonaId: "cemiterio" } } = {}) {
  return {
    fase: "fim",
    resultado,
    origem,
    recompensas: { xp, ouro, itens: {}, equipamentos: [], dropsPorInimigo: {} },
    combatentes: { h0: { lado: "herois", refId: save.grupo[0] } },
    afinidadesConhecidas: {},
  };
}

describe("cozinha (SPEC §3.7)", () => {
  it("3 receitas são conhecidas desde o início", () => {
    expect(receitasConhecidas(jogo()).map((r) => r.id)).toEqual(["ensopado_do_coveiro", "caldo_de_cogumelo", "sopa_de_alga"]);
  });

  it("3 porções de uma receita de 10 min ficam prontas em 30 min e aparecem no resumo depois de 40 min", () => {
    const cozinhando = preparar(jogo()).save;
    const atividade = cozinhando.atividades.p1;
    expect(atividade.duracao).toBe(30 * MINUTO);
    expect(porcoesProntas(atividade, 25 * MINUTO)).toBe(2);
    expect(resumoDoRetorno(cozinhando, 40 * MINUTO).concluidas.map((a) => a.id)).toEqual(["p1"]);
    const { save: depois, ganho } = coletarAtividade(cozinhando, "p1", 40 * MINUTO);
    expect(ganho.porcoes).toBe(3);
    expect(depois.inventario.itens.ensopado_do_coveiro).toBe(3);
  });

  it("os ingredientes saem no início", () => {
    const cozinhando = preparar(jogo({ erva_da_nevoa: 10 })).save;
    expect(cozinhando.inventario.itens.erva_da_nevoa).toBe(4);
  });

  it("cancelar entrega as porções prontas e devolve os ingredientes do resto", () => {
    const cozinhando = preparar(jogo({ erva_da_nevoa: 10 })).save;
    const { save: depois, ganho } = cancelarAtividade(cozinhando, "p1", 25 * MINUTO);
    expect(ganho).toMatchObject({ porcoes: 2, devolvidas: 1 });
    expect(depois.inventario.itens.ensopado_do_coveiro).toBe(2);
    expect(depois.inventario.itens.erva_da_nevoa).toBe(6);
  });

  it("recusa receita desconhecida, ingredientes insuficientes, porções fora de 1–5 e panela ocupada", () => {
    const save = jogo({ erva_da_nevoa: 3 });
    expect(motivoNaoPrepara(save, "pao_de_mel", 1)).toBe("Receita desconhecida.");
    expect(porcoesPossiveis(save, receitas.ensopado_do_coveiro)).toBe(1);
    expect(motivoNaoPrepara(save, "ensopado_do_coveiro", 2)).toBe("Ingredientes insuficientes.");
    expect(motivoNaoPrepara(save, "ensopado_do_coveiro", 6)).toBe("Escolha de 1 a 5 porções.");
    const cozinhando = preparar(save, "ensopado_do_coveiro", 1).save;
    expect(motivoNaoPrepara({ ...cozinhando, inventario: { ...cozinhando.inventario, itens: { erva_da_nevoa: 9 } } }, "ensopado_do_coveiro", 1)).toBe(
      "A panela está ocupada.",
    );
  });
});

describe("refeição ativa", () => {
  const comEnsopado = () => comer(jogo({ ensopado_do_coveiro: 2, sopa_de_alga: 1 }), "ensopado_do_coveiro").save;

  it("comer ativa a refeição, gasta uma porção e outra refeição substitui a atual", () => {
    const save = comEnsopado();
    expect(save.refeicaoAtiva).toEqual({ itemId: "ensopado_do_coveiro", encontrosRestantes: 5 });
    expect(save.inventario.itens.ensopado_do_coveiro).toBe(1);
    expect(comer(save, "sopa_de_alga").save.refeicaoAtiva).toEqual({ itemId: "sopa_de_alga", encontrosRestantes: 5 });
  });

  it("não come durante uma batalha salva nem o que não tem", () => {
    const save = jogo({ ensopado_do_coveiro: 1 });
    expect(motivoNaoCome({ ...save, batalha: {} }, "ensopado_do_coveiro")).toBe("Termine a batalha em andamento antes de comer.");
    expect(motivoNaoCome(save, "sopa_de_alga")).toBe("Você não tem esta refeição.");
    expect(motivoNaoCome(save, "erva_da_nevoa")).toBe("Isto não é uma refeição.");
  });

  it("com Ensopado do Coveiro ativo, a vida máxima na batalha é 10% maior", () => {
    const save = comEnsopado();
    const heroi = save.herois[save.grupo[0]];
    const vida = calcularAtributosHeroi(heroi, save.inventario.equipamentos).vida;
    const { batalha } = criarBatalha({
      herois: [heroi],
      equipamentos: save.inventario.equipamentos,
      inimigos: [{ id: "rato_tumba", nivel: 1 }],
      origem: { tipo: "zona", zonaId: "cemiterio" },
      semente: 1,
      refeicao: efeitoDaRefeicao(save),
    });
    expect(batalha.combatentes.h0.hpMax).toBe(aumentarPercentual(vida, 0.1));
  });

  it("ataque, defesa e recurso inicial mudam o combatente no início da batalha", () => {
    const save = jogo();
    const heroi = save.herois[save.grupo[0]];
    const base = calcularAtributosHeroi(heroi, save.inventario.equipamentos);
    const criar = (refeicao) =>
      criarBatalha({ herois: [heroi], equipamentos: save.inventario.equipamentos, inimigos: [{ id: "rato_tumba", nivel: 1 }], origem: { tipo: "zona", zonaId: "cemiterio" }, semente: 1, refeicao })
        .inicial.combatentes.h0;
    expect(criar({ tipo: "ataque", valor: 0.1 }).atributos.forca).toBe(aumentarPercentual(base.forca, 0.1));
    expect(criar({ tipo: "defesa", valor: 0.1 }).atributos.resistencia).toBe(aumentarPercentual(base.resistencia, 0.1));
    expect(criar({ tipo: "recursoInicial", valor: 20 }).recurso.atual).toBe(VIGOR.inicial + 20);
  });

  it("o contador desce 1 a cada encontro concluído: vitória, derrota ou fuga", () => {
    let save = comEnsopado();
    for (const [resultado, restantes] of [["vitoria", 4], ["derrota", 3], ["fuga", 2]]) {
      save = aplicarResultadoBatalha(save, batalhaEncerrada(save, { resultado })).save;
      expect(save.refeicaoAtiva.encontrosRestantes).toBe(restantes);
    }
  });

  it("refeição de XP e de ouro aumenta as recompensas", () => {
    const comSopa = comer(jogo({ sopa_de_alga: 1 }), "sopa_de_alga").save;
    expect(aplicarResultadoBatalha(comSopa, batalhaEncerrada(comSopa, { xp: 100 })).resumo.xp).toBe(115);
    const comCompota = { ...jogo(), refeicaoAtiva: { itemId: "compota_luminosa", encontrosRestantes: 8 } };
    expect(aplicarResultadoBatalha(comCompota, batalhaEncerrada(comCompota, { ouro: 100 })).resumo.ouro).toBe(125);
  });
});

describe("novas receitas", () => {
  it("vencer o chefe de uma zona ensina a receita dela uma vez", () => {
    const save = jogo();
    const origem = { tipo: "zona", zonaId: "planicie_mortos", chefe: true };
    const { save: depois, resumo } = aplicarResultadoBatalha(save, batalhaEncerrada(save, { origem }));
    expect(resumo.receitaNova).toBe("ensopado_de_raiz");
    expect(depois.receitasConhecidas).toEqual(["ensopado_de_raiz"]);
    expect(aplicarResultadoBatalha(depois, batalhaEncerrada(depois, { origem })).resumo.receitaNova).toBeNull();
  });

  it("a loja vende uma receita por semana entre as de zonas desbloqueadas ainda não aprendidas", () => {
    const base = jogo();
    expect(receitaDaSemana(base, 0)).toBeNull();
    const zonasAbertas = Object.fromEntries(Object.entries(base.progresso.zonas).map(([id, z]) => [id, { ...z, desbloqueada: true }]));
    const save = { ...base, progresso: { ...base.progresso, zonas: zonasAbertas } };
    const semana1 = receitaDaSemana(save, 0);
    const semana2 = receitaDaSemana(save, DURACAO_ROTACAO_RECEITA_MS);
    expect(semana1).not.toBe(semana2);
    expect(receitaDaSemana(save, DURACAO_ROTACAO_RECEITA_MS - 1)).toBe(semana1);

    const { save: depois, receita } = comprarReceita(save, 0);
    expect(receita).toBe(semana1);
    expect(depois.ouro).toBe(save.ouro - precoDaReceita(semana1));
    expect(receitasConhecidas(depois)).toContain(semana1);
    expect(receitaDaSemana(depois, 0)).not.toBe(semana1);
    expect(precoDaReceita(receitas.ensopado_de_raiz)).toBe(4 * PRECO_RECEITA_POR_ZONA);
  });
});

describe("save com a panela no fogo", () => {
  it("é válido e carrega de novo (a cozinha não tem herói)", () => {
    const cozinhando = preparar(jogo()).save;
    expect(validarSave(cozinhando)).toEqual([]);
    const lido = carregarSave(JSON.stringify(cozinhando));
    expect(lido.status).toBe("ok");
    expect(lido.save.atividades.p1.tipo).toBe("cozinha");
  });

  it("atividade de herói que não existe continua inválida", () => {
    const save = jogo();
    const quebrado = { ...save, atividades: { x: { id: "x", tipo: "treinoAtributo", heroiId: "fantasma", inicio: 0, duracao: 1 } } };
    expect(validarSave(quebrado)).toContain("Atividade de herói inexistente.");
  });
});
