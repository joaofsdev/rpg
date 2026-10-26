import { describe, it, expect } from "vitest";
import {
  FILTROS_PADRAO,
  ORDEM_PADRAO,
  normalizarTexto,
  alterarFiltro,
  filtrosAlterados,
  listarEquipamentos,
  ordenarEquipamentos,
  entradasDoInventario,
  opcoesDeTipo,
  opcoesDeRaridade,
  opcoesDeFaixa,
  opcoesDeHeroi,
  faixasDeNivel,
  classesQueUsam,
  compararBonus,
  comparacaoComHeroi,
  detalhesDoEquipamento,
  heroiParaComparar,
  motivoNaoEquipa,
  pedeConfirmacaoVenda,
  itensPorCategoria,
} from "./seletoresInventario";
import { reducer } from "./reducer";
import { criarHeroi } from "../engine/herois";
import { criarNovoJogo } from "../save/novoJogo";
import { criarRng } from "../engine/rng";
import { precoVenda } from "../engine/itens";
import { MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";

function equipamento(id, campos = {}) {
  return {
    id,
    nome: id,
    slot: "arma",
    tipoArma: "espada",
    raridade: "Comum",
    nivel: 1,
    bonus: { vida: 0, forca: 3, magia: 0, defesa: 0, resistencia: 0, velocidade: 0 },
    aprimoramento: 0,
    ...campos,
  };
}

// Ordem de entrada: espada, cajado, elmo, peitoral, alaude, adaga, botas
const ITENS = [
  equipamento("espada", { nome: "Espada Simples de Ferro", nivel: 12, raridade: "Raro" }),
  equipamento("cajado", { nome: "Cajado Ágil de Carvalho", tipoArma: "cajado", nivel: 8, raridade: "Incomum", bonus: { magia: 6 } }),
  equipamento("elmo", { nome: "Elmo Pesado de Ferro", slot: "capacete", tipoArma: undefined, pesoArmadura: "pesada", nivel: 12, raridade: "Comum", bonus: { vida: 10, defesa: 4 } }),
  equipamento("peitoral", { nome: "Túnica de Seda Élfica", slot: "peitoral", tipoArma: undefined, pesoArmadura: "pano", nivel: 25, raridade: "Épico", bonus: { vida: 20, resistencia: 8 } }),
  equipamento("alaude", { nome: "Alaúde Encantado de Prata", tipoArma: "instrumento", nivel: 31, raridade: "Lendário", bonus: { magia: 12 }, aprimoramento: 2 }),
  equipamento("adaga", { nome: "adaga ágil de bronze", tipoArma: "adaga", nivel: 12, raridade: "Raro" }),
  equipamento("botas", { nome: "Botas Leves de Couro", slot: "botas", tipoArma: undefined, pesoArmadura: "leve", nivel: 3, raridade: "Comum", bonus: { velocidade: 2 } }),
];

// Aldric (cavaleiro) usa a espada; Mira (maga) usa a túnica; Kael (bardo) fica na reserva
function jogo() {
  const base = criarNovoJogo({ nomeHeroi: "X", classeId: "cavaleiro", agora: 1, rng: criarRng(2) });
  const aldric = criarHeroi({ id: "aldric", nome: "Aldric", classeId: "cavaleiro", nivel: 12 });
  const mira = criarHeroi({ id: "mira", nome: "Mira", classeId: "mago", nivel: 10 });
  const kael = criarHeroi({ id: "kael", nome: "Kael", classeId: "bardo", nivel: 9 });
  aldric.equipamento.arma = "espada";
  mira.equipamento.peitoral = "peitoral";
  return {
    ...base,
    herois: { aldric, mira, kael },
    grupo: ["aldric", "mira"],
    inventario: {
      equipamentos: Object.fromEntries(ITENS.map((i) => [i.id, i])),
      itens: { pocao_pequena: 3, osso_antigo: 999, erva_da_nevoa: 4, ensopado_do_coveiro: 2, item_que_nao_existe: 5, tonico: 0 },
    },
    batalha: null,
  };
}

const ids = (resultado) => resultado.entradas.map((e) => e.item.id);
const listar = (save, filtros = {}, ordem = ORDEM_PADRAO) => listarEquipamentos(save, { ...FILTROS_PADRAO, ...filtros }, ordem);

describe("busca", () => {
  it("normaliza maiúsculas, acentos e espaços", () => {
    expect(normalizarTexto("  Cajado   ÁGIL  ")).toBe("cajado agil");
    expect(normalizarTexto("Túnica Élfica")).toBe("tunica elfica");
    expect(normalizarTexto(undefined)).toBe("");
  });

  it("encontra pelo nome ignorando acentos e caixa", () => {
    expect(ids(listar(jogo(), { busca: "agil" }))).toEqual(["adaga", "cajado"]);
    expect(ids(listar(jogo(), { busca: "ÉLFICA" }))).toEqual(["peitoral"]);
    expect(ids(listar(jogo(), { busca: "alaude" }))).toEqual(["alaude"]);
  });

  it("exige todas as palavras, em qualquer ordem", () => {
    expect(ids(listar(jogo(), { busca: "ferro espada" }))).toEqual(["espada"]);
    expect(ids(listar(jogo(), { busca: "ferro dragão" }))).toEqual([]);
  });

  it("busca vazia ou só com espaços não filtra", () => {
    expect(listar(jogo(), { busca: "   " }).entradas).toHaveLength(ITENS.length);
  });
});

describe("filtros", () => {
  it("filtra por categoria, tipo, raridade e situação", () => {
    const save = jogo();
    expect(ids(listar(save, { slot: "arma" })).sort()).toEqual(["adaga", "alaude", "cajado", "espada"]);
    expect(ids(listar(save, { tipo: "instrumento" }))).toEqual(["alaude"]);
    expect(ids(listar(save, { tipo: "pesada" }))).toEqual(["elmo"]);
    expect(ids(listar(save, { raridade: "Raro" })).sort()).toEqual(["adaga", "espada"]);
    expect(ids(listar(save, { situacao: "equipados" })).sort()).toEqual(["espada", "peitoral"]);
    expect(listar(save, { situacao: "disponiveis" }).entradas).toHaveLength(5);
  });

  it("filtra pela faixa de nível da zona (limites incluídos, última faixa sem teto)", () => {
    const save = jogo();
    const [cemiterio, minas, costa, planicie] = faixasDeNivel();
    expect(ids(listar(save, { faixa: cemiterio.id })).sort()).toEqual(["botas", "cajado"]);
    expect(ids(listar(save, { faixa: minas.id })).sort()).toEqual(["adaga", "elmo", "espada"]);
    expect(ids(listar(save, { faixa: costa.id }))).toEqual(["peitoral"]);
    expect(ids(listar(save, { faixa: planicie.id }))).toEqual(["alaude"]);
    expect(faixasDeNivel().at(-1).max).toBe(Infinity);
  });

  it("'serve para' mostra só o que a classe do herói usa", () => {
    const save = jogo();
    expect(ids(listar(save, { heroiId: "aldric" })).sort()).toEqual(["elmo", "espada"]);
    expect(ids(listar(save, { heroiId: "kael" })).sort()).toEqual(["alaude", "botas"]);
  });

  it("combina todos os filtros", () => {
    const save = jogo();
    expect(ids(listar(save, { slot: "arma", raridade: "Raro", situacao: "disponiveis", busca: "AGIL" }))).toEqual(["adaga"]);
    expect(ids(listar(save, { slot: "arma", heroiId: "mira", faixa: faixasDeNivel()[0].id }))).toEqual(["cajado"]);
    expect(listar(save, { slot: "capacete", raridade: "Lendário" }).entradas).toEqual([]);
  });

  it("não altera o inventário e informa o total", () => {
    const save = jogo();
    const antes = JSON.stringify(save);
    const resultado = listar(save, { slot: "botas", busca: "couro" }, "nome");
    expect(resultado.total).toBe(ITENS.length);
    expect(JSON.stringify(save)).toBe(antes);
  });

  it("inventário vazio devolve lista vazia", () => {
    const save = { ...jogo(), inventario: { equipamentos: {}, itens: {} } };
    expect(listar(save, { busca: "x" })).toEqual({ entradas: [], total: 0 });
    expect(opcoesDeTipo(save, "todos")).toEqual([]);
  });

  it("ao trocar de categoria, um tipo que não existe nela volta para todos", () => {
    let filtros = alterarFiltro(FILTROS_PADRAO, "tipo", "espada");
    expect(alterarFiltro(filtros, "slot", "arma").tipo).toBe("espada");
    expect(alterarFiltro(filtros, "slot", "capacete").tipo).toBe("todos");
    filtros = alterarFiltro(FILTROS_PADRAO, "tipo", "leve");
    expect(alterarFiltro(filtros, "slot", "botas").tipo).toBe("leve");
    expect(alterarFiltro(filtros, "slot", "arma").tipo).toBe("todos");
  });

  it("lista os filtros alterados", () => {
    expect(filtrosAlterados(FILTROS_PADRAO)).toEqual([]);
    expect(filtrosAlterados({ ...FILTROS_PADRAO, busca: "x", raridade: "Raro" })).toEqual(["busca", "raridade"]);
  });

  it("opções de tipo só trazem o que existe na categoria, com contagem", () => {
    const save = jogo();
    expect(opcoesDeTipo(save, "arma").map((o) => o.valor)).toEqual(["espada", "cajado", "adaga", "instrumento"]);
    expect(opcoesDeTipo(save, "capacete")).toEqual([{ valor: "pesada", nome: "armadura pesada", quantidade: 1 }]);
    expect(opcoesDeTipo(save, "todos")).toHaveLength(7);
  });
});

describe("opções dos filtros", () => {
  it("raridades sempre todas, com contagem", () => {
    expect(opcoesDeRaridade(jogo()).map((o) => [o.valor, o.quantidade])).toEqual([
      ["Comum", 2],
      ["Incomum", 1],
      ["Raro", 2],
      ["Épico", 1],
      ["Lendário", 1],
    ]);
  });

  it("faixas só com itens, mais a escolhida; a última mostra o '+'", () => {
    const save = jogo();
    const faixas = faixasDeNivel();
    expect(opcoesDeFaixa(save).map((o) => o.valor)).toEqual(faixas.slice(0, 4).map((f) => f.id));
    expect(opcoesDeFaixa(save, faixas.at(-1).id).at(-1)).toEqual({
      valor: faixas.at(-1).id,
      nome: "91–100+ · Campos do Caos",
      quantidade: 0,
    });
  });

  it("tipo escolhido continua na lista mesmo sem itens; armadura de pano por extenso", () => {
    const save = jogo();
    expect(opcoesDeTipo(save, "arma", "lanca").map((o) => o.valor)).toContain("lanca");
    expect(opcoesDeTipo(save, "peitoral")[0].nome).toBe("armadura de pano");
  });

  it("heróis do grupo e depois da reserva", () => {
    expect(opcoesDeHeroi(jogo())).toEqual([
      { valor: "aldric", nome: "Aldric", classe: "Cavaleiro", nivel: 12, reserva: false },
      { valor: "mira", nome: "Mira", classe: "Mago", nivel: 10, reserva: false },
      { valor: "kael", nome: "Kael", classe: "Bardo", nivel: 9, reserva: true },
    ]);
  });
});

describe("ordenação", () => {
  it("padrão: nível maior primeiro; empate por raridade, depois nome", () => {
    expect(ids(listar(jogo()))).toEqual(["alaude", "peitoral", "adaga", "espada", "elmo", "cajado", "botas"]);
  });

  it("nível menor primeiro", () => {
    expect(ids(listar(jogo(), {}, "nivelAsc"))).toEqual(["botas", "cajado", "adaga", "espada", "elmo", "peitoral", "alaude"]);
  });

  it("raridade maior primeiro; empate por nível", () => {
    expect(ids(listar(jogo(), {}, "raridade"))).toEqual(["alaude", "peitoral", "adaga", "espada", "cajado", "elmo", "botas"]);
  });

  it("nome em ordem alfabética, sem diferenciar acentos nem caixa", () => {
    expect(ids(listar(jogo(), {}, "nome"))).toEqual(["adaga", "alaude", "botas", "cajado", "elmo", "espada", "peitoral"]);
  });

  it("mais recentes: ordem inversa de entrada no inventário", () => {
    expect(ids(listar(jogo(), {}, "recentes"))).toEqual(["botas", "adaga", "alaude", "peitoral", "elmo", "cajado", "espada"]);
  });

  it("é estável: itens equivalentes mantêm a ordem de entrada", () => {
    const iguais = ["c", "a", "b"].map((id) => equipamento(id, { nome: "Igual", nivel: 5 }));
    const entradas = iguais.map((item, ordemEntrada) => ({ item, dono: null, ordemEntrada }));
    for (const ordem of ["nivelDesc", "nivelAsc", "raridade", "nome"]) {
      expect(ordenarEquipamentos(entradas, ordem).map((e) => e.item.id)).toEqual(["c", "a", "b"]);
    }
  });

  it("ordem desconhecida cai no padrão", () => {
    expect(ids(listar(jogo(), {}, "inexistente"))).toEqual(ids(listar(jogo())));
  });
});

describe("comparação e motivos", () => {
  it("compara atributo a atributo com o item do mesmo espaço", () => {
    const melhor = equipamento("nova", { bonus: { forca: 5, velocidade: 1 } });
    const atual = equipamento("velha", { bonus: { forca: 3, vida: 4 } });
    expect(compararBonus(melhor, atual)).toEqual([
      { atributo: "vida", valor: 0, atual: 4, diferenca: -4, sentido: "pior" },
      { atributo: "forca", valor: 5, atual: 3, diferenca: 2, sentido: "melhor" },
      { atributo: "velocidade", valor: 1, atual: 0, diferenca: 1, sentido: "melhor" },
    ]);
    expect(compararBonus(atual, atual).every((l) => l.sentido === "igual")).toBe(true);
  });

  it("espaço vazio compara contra zero", () => {
    expect(compararBonus(equipamento("x", { bonus: { forca: 2 } }), null)).toEqual([
      { atributo: "forca", valor: 2, atual: 0, diferenca: 2, sentido: "melhor" },
    ]);
  });

  it("usa os bônus com aprimoramento (fórmula do motor)", () => {
    const [forca] = compararBonus(equipamento("x", { bonus: { forca: 1 }, aprimoramento: 5 }), null);
    expect(forca.valor).toBe(6);
  });

  it("comparação com o herói: item atual, melhores, piores e motivo", () => {
    const save = jogo();
    const adaga = save.inventario.equipamentos.adaga;
    const comAldric = comparacaoComHeroi(save, save.inventario.equipamentos.espada, "aldric");
    expect(comAldric.mesmoItem).toBe(true);
    expect(comAldric.motivoEquipar).toBe("Aldric já usa este item.");

    const elmo = comparacaoComHeroi(save, save.inventario.equipamentos.elmo, "aldric");
    expect(elmo.atual).toBeNull();
    expect(elmo.melhores).toBe(2);
    expect(elmo.motivoEquipar).toBeNull();

    const comMira = comparacaoComHeroi(save, adaga, "mira");
    expect(comMira.compativel).toBe(false);
    expect(comMira.motivoEquipar).toBe("Mago não usa adaga. Usa: cajado, varinha, grimório.");
  });

  it("explica armadura incompatível e batalha em andamento", () => {
    const save = jogo();
    expect(motivoNaoEquipa(save, "aldric", save.inventario.equipamentos.botas)).toBe(
      "Cavaleiro não usa armadura leve. Usa: armadura pesada.",
    );
    const emBatalha = { ...save, batalha: { combatentes: { c: { lado: "herois", refId: "aldric" } } } };
    expect(motivoNaoEquipa(emBatalha, "aldric", save.inventario.equipamentos.elmo)).toBe(
      "Aldric está em uma batalha em andamento.",
    );
    expect(motivoNaoEquipa(emBatalha, "kael", { ...save.inventario.equipamentos.espada, tipoArma: "espada_leve" })).toBe(
      "Aldric está usando este item em uma batalha em andamento.",
    );
  });

  it("detalhes: dono, classes, preço e motivos de tirar e vender", () => {
    const save = jogo();
    const espada = detalhesDoEquipamento(save, save.inventario.equipamentos.espada);
    expect(espada.dono.id).toBe("aldric");
    expect(espada.classes).toEqual(["Cavaleiro"]);
    expect(espada.motivoVender).toBe("Em uso por Aldric. Tire o item antes de vender.");
    expect(espada.motivoTirar).toBeNull();

    const botas = detalhesDoEquipamento(save, save.inventario.equipamentos.botas);
    expect(botas.dono).toBeNull();
    expect(botas.classes).toEqual(["Arqueiro", "Assassino", "Bardo"]);
    expect(botas.motivoVender).toBeNull();
    expect(botas.motivoTirar).toBe("Ninguém está usando este item.");
    expect(botas.preco).toBe(precoVenda(save.inventario.equipamentos.botas));
  });

  it("tirar é recusado com o inventário cheio (regra do motor)", () => {
    const save = jogo();
    const extras = Object.fromEntries(
      Array.from({ length: MAX_EQUIPAMENTOS_INVENTARIO }, (_, i) => [`extra${i}`, equipamento(`extra${i}`)]),
    );
    const cheio = { ...save, inventario: { ...save.inventario, equipamentos: { ...save.inventario.equipamentos, ...extras } } };
    expect(detalhesDoEquipamento(cheio, save.inventario.equipamentos.espada).motivoTirar).toMatch(/Inventário cheio/);
  });

  it("herói sugerido para comparar", () => {
    const save = jogo();
    expect(heroiParaComparar(save, save.inventario.equipamentos.cajado)).toBe("mira");
    expect(heroiParaComparar(save, save.inventario.equipamentos.botas)).toBe("kael");
    // a espada já é do Aldric e ninguém mais a usa: cai no primeiro herói
    expect(heroiParaComparar(save, save.inventario.equipamentos.espada)).toBe("aldric");
    expect(heroiParaComparar(save, save.inventario.equipamentos.botas, "mira")).toBe("mira");
    expect(heroiParaComparar(save, save.inventario.equipamentos.botas, "sumiu")).toBe("kael");
  });

  it("pede confirmação para vender Raro ou melhor, ou aprimorado", () => {
    expect(pedeConfirmacaoVenda(equipamento("a", { raridade: "Incomum" }))).toBe(false);
    expect(pedeConfirmacaoVenda(equipamento("a", { raridade: "Raro" }))).toBe(true);
    expect(pedeConfirmacaoVenda(equipamento("a", { raridade: "Comum", aprimoramento: 1 }))).toBe(true);
  });

  it("classes que usam um instrumento", () => {
    expect(classesQueUsam(ITENS[4])).toEqual(["Bardo"]);
  });
});

describe("a lista acompanha as ações", () => {
  function estado() {
    return { save: jogo(), tela: "inventario", aviso: null };
  }

  it("equipar muda o dono exibido e tira o item de quem usava", () => {
    let state = reducer(estado(), { type: "EQUIPAR", heroiId: "aldric", equipamentoId: "elmo" });
    let entradas = entradasDoInventario(state.save);
    expect(entradas.find((e) => e.item.id === "elmo").dono.id).toBe("aldric");
    expect(ids(listar(state.save, { situacao: "equipados" })).sort()).toEqual(["elmo", "espada", "peitoral"]);

    state = { ...state, save: { ...state.save, herois: { ...state.save.herois, kael: { ...state.save.herois.kael, classeId: "cavaleiro" } } } };
    state = reducer(state, { type: "EQUIPAR", heroiId: "kael", equipamentoId: "espada" });
    entradas = entradasDoInventario(state.save);
    expect(entradas.find((e) => e.item.id === "espada").dono.id).toBe("kael");
    expect(state.save.herois.aldric.equipamento.arma).toBeNull();
  });

  it("vender tira o item da lista e soma o ouro; item em uso não é vendido", () => {
    const inicial = estado();
    let state = reducer(inicial, { type: "VENDER_EQUIPAMENTO", equipamentoId: "botas" });
    expect(ids(listar(state.save))).not.toContain("botas");
    expect(state.save.ouro).toBe(inicial.save.ouro + precoVenda(ITENS[6]));

    state = reducer(state, { type: "VENDER_EQUIPAMENTO", equipamentoId: "espada" });
    expect(ids(listar(state.save))).toContain("espada");
    expect(state.aviso).toMatch(/Desequipe/);
  });

  it("tirar devolve o item aos livres", () => {
    const state = reducer(estado(), { type: "DESEQUIPAR", heroiId: "aldric", slot: "arma" });
    expect(ids(listar(state.save, { situacao: "disponiveis" }))).toContain("espada");
  });
});

describe("aba Itens", () => {
  it("agrupa por categoria na ordem dos dados, marca pilha cheia e origem; ignora vazios e desconhecidos", () => {
    const categorias = itensPorCategoria(jogo());
    expect(categorias.map((c) => c.id)).toEqual(["consumivel", "material", "ingrediente", "refeicao"]);
    const [consumiveis, materiais, ingredientes, refeicoes] = categorias;
    expect(consumiveis.itens.map((i) => i.item.id)).toEqual(["pocao_pequena"]);
    expect(materiais.itens).toEqual([
      expect.objectContaining({ quantidade: 999, cheia: true, origem: "Cemitério Antigo" }),
    ]);
    expect(ingredientes.itens[0]).toEqual(expect.objectContaining({ quantidade: 4, cheia: false }));
    expect(refeicoes.itens.map((i) => i.item.id)).toEqual(["ensopado_do_coveiro"]);
  });
});
