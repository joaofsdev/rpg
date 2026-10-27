import { describe, it, expect } from "vitest";
import { escolherAcaoAuto, decidirProximo, motivoVidaBaixa, valorDoAtaque } from "./autoBatalha";
import { acoesDisponiveis, aplicarAcao, vidaMaximaDoHeroi } from "./combate";
import { batalhaTeste, heroiTeste, ajustar } from "./__fixtures__/batalhas";
import { criarNovoJogo } from "../save/novoJogo";
import { criarRng } from "./rng";
import { golpes } from "../data/golpes";
import { MAX_EQUIPAMENTOS_INVENTARIO, ANDARES_MASMORRA } from "../data/constants";

const nova = (opcoes) => batalhaTeste(opcoes).batalha;
const ativoDe = (b) => b.combatentes[b.ativoId];
const heroisDe = (b) => Object.values(b.combatentes).filter((c) => c.lado === "herois");
const inimigosDe = (b) => Object.values(b.combatentes).filter((c) => c.lado === "inimigos");

// A ação escolhida é uma das que o motor oferece, com alvo válido
function confereLegal(batalha, acao) {
  const opcoes = acoesDisponiveis(batalha);
  if (acao.tipo === "defender") return;
  expect(acao.tipo).toBe("golpe");
  const opcao = opcoes.golpes.find((g) => g.golpeId === acao.golpeId);
  expect(opcao?.disponivel).toBe(true);
  if (opcao.tipoAlvo === "inimigo" || opcao.tipoAlvo === "aliado") expect(opcao.alvos).toContain(acao.alvoId);
  else expect(acao.alvoId).toBeUndefined();
}

// Joga só com o Auto até o fim; devolve a batalha final e o número de ações
function jogarComAuto(batalha, limite = 300) {
  let atual = batalha;
  let acoes = 0;
  while (atual.fase === "escolhaAcao" && acoes < limite) {
    const acao = escolherAcaoAuto(atual);
    confereLegal(atual, acao);
    const resultado = aplicarAcao(atual, acao);
    expect(resultado.erro).toBeUndefined();
    atual = resultado.batalha;
    acoes++;
  }
  return { batalha: atual, acoes };
}

describe("IA do Auto: ações legais", () => {
  it("todas as classes jogam batalhas inteiras só com ações válidas e terminam", () => {
    const classes = ["cavaleiro", "arqueiro", "mago", "assassino", "bardo", "barbaro"];
    for (let semente = 1; semente <= 12; semente++) {
      const herois = [heroiTeste(classes[semente % 6], 8), heroiTeste(classes[(semente + 2) % 6], 8)];
      const inimigos = [{ id: "esqueleto_fraco", nivel: 8 }, { id: "zumbi_fraco", nivel: 8 }];
      const { batalha, acoes } = jogarComAuto(nova({ herois, inimigos, semente }));
      expect(batalha.fase).toBe("fim");
      expect(acoes).toBeLessThan(300);
    }
  });

  it("sem recurso, não escolhe golpe que custa; o ataque básico é a alternativa", () => {
    let b = nova({ herois: [heroiTeste("mago", 5)] });
    b = ajustar(b, b.ativoId, { recurso: { ...ativoDe(b).recurso, atual: 0 } });
    const acao = escolherAcaoAuto(b);
    expect(acao.golpeId).toBe("faisca");
    expect(golpes[acao.golpeId].custo).toBe(0);
  });

  it("não escolhe alvo nocauteado", () => {
    let b = nova({ inimigos: [{ id: "esqueleto_fraco", nivel: 5 }, { id: "zumbi_fraco", nivel: 5 }] });
    const [primeiro, segundo] = inimigosDe(b);
    b = ajustar(b, primeiro.id, { nocauteado: true, hpAtual: 0 });
    const acao = escolherAcaoAuto(b);
    if (acao.alvoId) expect(acao.alvoId).toBe(segundo.id);
  });

  it("não é a vez de um herói: devolve null", () => {
    const b = { ...nova(), fase: "fim" };
    expect(escolherAcaoAuto(b)).toBeNull();
  });
});

describe("IA do Auto: prioridades", () => {
  it("cura o grupo com aliado em perigo", () => {
    let b = nova({ herois: [heroiTeste("bardo", 5), heroiTeste("cavaleiro", 5)] });
    const bardo = heroisDe(b).find((c) => c.classeId === "bardo");
    const cavaleiro = heroisDe(b).find((c) => c.classeId === "cavaleiro");
    b = ajustar(b, cavaleiro.id, { hpAtual: Math.floor(cavaleiro.hpMax * 0.2) });
    b = { ...b, ativoId: bardo.id };
    expect(escolherAcaoAuto(b)).toEqual({ tipo: "golpe", golpeId: "cancao_de_cura", alvoId: undefined });
  });

  it("com todos saudáveis, não gasta a cura", () => {
    let b = nova({ herois: [heroiTeste("bardo", 5), heroiTeste("cavaleiro", 5)] });
    b = { ...b, ativoId: heroisDe(b).find((c) => c.classeId === "bardo").id };
    expect(escolherAcaoAuto(b).golpeId).not.toBe("cancao_de_cura");
  });

  it("protege o aliado na mira de um golpe telegrafado (e não repete a proteção)", () => {
    let b = nova({ herois: [heroiTeste("mago", 5), heroiTeste("cavaleiro", 5)] });
    const mago = heroisDe(b).find((c) => c.classeId === "mago");
    const cavaleiro = heroisDe(b).find((c) => c.classeId === "cavaleiro");
    const [inimigo] = inimigosDe(b);
    b = ajustar(b, inimigo.id, { intencao: { golpeId: "golpe_ossudo", alvos: [cavaleiro.id], telegrafado: true } });
    b = { ...b, ativoId: mago.id };
    expect(escolherAcaoAuto(b)).toEqual({ tipo: "golpe", golpeId: "escudo_arcano", alvoId: cavaleiro.id });

    b = ajustar(b, cavaleiro.id, { status: [{ statusId: "protecao", turnos: 2, acumulos: 1 }] });
    expect(escolherAcaoAuto(b).golpeId).not.toBe("escudo_arcano");
  });

  it("intenção comum (não telegrafada) não gasta turno com proteção", () => {
    let b = nova({ herois: [heroiTeste("mago", 5), heroiTeste("cavaleiro", 5)] });
    const mago = heroisDe(b).find((c) => c.classeId === "mago");
    const [inimigo] = inimigosDe(b);
    b = ajustar(b, inimigo.id, { intencao: { golpeId: "golpe_ossudo", alvos: [mago.id], telegrafado: false } });
    b = { ...b, ativoId: mago.id };
    expect(escolherAcaoAuto(b).golpeId).not.toBe("escudo_arcano");
  });

  it("usa a fraqueza conhecida; a desconhecida não muda a escolha (não sabe mais que o jogador)", () => {
    const mago = heroiTeste("mago", 10);
    const inimigos = [{ id: "zumbi_fraco", nivel: 10 }];
    const conhecida = nova({ herois: [mago], inimigos, afinidadesConhecidas: { zumbi_fraco: ["fogo"] } });
    const desconhecida = nova({ herois: [mago], inimigos });
    const comFogo = escolherAcaoAuto(conhecida);
    expect(golpes[comFogo.golpeId].elemento).toBe("fogo");
    expect(valorDoAtaque(conhecida, comFogo)).toBeGreaterThan(valorDoAtaque(desconhecida, comFogo));
  });

  it("abate garantido com o golpe mais barato, sem gastar golpe caro em inimigo quase derrotado", () => {
    let b = nova({ herois: [heroiTeste("mago", 10)], inimigos: [{ id: "esqueleto_fraco", nivel: 5 }] });
    const [inimigo] = inimigosDe(b);
    b = ajustar(b, inimigo.id, { hpAtual: 1 });
    const acao = escolherAcaoAuto(b);
    expect(acao.golpeId).toBe("faisca");
  });

  it("não usa golpe que fere o próprio herói com a vida baixa", () => {
    let b = nova({ herois: [heroiTeste("barbaro", 10)], inimigos: [{ id: "esqueleto_fraco", nivel: 10 }] });
    const barbaro = ativoDe(b);
    b = ajustar(b, barbaro.id, { hpAtual: Math.floor(barbaro.hpMax * 0.2), recurso: { ...barbaro.recurso, atual: 100 } });
    expect(escolherAcaoAuto(b).golpeId).not.toBe("berserker");
  });
});

describe("IA do Auto: reprodutibilidade", () => {
  it("o mesmo estado dá sempre a mesma ação, e a mesma semente dá a mesma batalha inteira", () => {
    const criar = () =>
      nova({
        herois: [heroiTeste("bardo", 9, { id: "b" }), heroiTeste("barbaro", 9, { id: "c" })],
        inimigos: [{ id: "esqueleto_fraco", nivel: 9 }, { id: "zumbi_fraco", nivel: 9 }],
        semente: 77,
      });
    const b = criar();
    const primeira = escolherAcaoAuto(b);
    for (let i = 0; i < 20; i++) expect(escolherAcaoAuto(structuredClone(b))).toEqual(primeira);
    const a1 = jogarComAuto(criar()).batalha;
    const a2 = jogarComAuto(criar()).batalha;
    expect(a2.log).toEqual(a1.log);
    expect(a2.resultado).toBe(a1.resultado);
  });
});

describe("vida baixa durante a batalha", () => {
  it("aponta o primeiro herói vivo abaixo do limite; 0 desliga", () => {
    let b = nova({ herois: [heroiTeste("cavaleiro", 5, { nome: "Ana" }), heroiTeste("mago", 5, { nome: "Bia" })] });
    const bia = heroisDe(b).find((c) => c.nome === "Bia");
    b = ajustar(b, bia.id, { hpAtual: Math.floor(bia.hpMax * 0.2) });
    expect(motivoVidaBaixa(b, 0.25)).toMatch(/^Vida baixa: Bia está com 1\d% da vida\.$/);
    expect(motivoVidaBaixa(b, 0)).toBeNull();
    expect(motivoVidaBaixa(b, 0.1)).toBeNull();
  });
});

describe("decidirProximo: condições de parada", () => {
  const OPCOES = { autoPararChefe: true, autoPararInventario: true, autoVidaMinima: 0, autoLimiteEncontros: 0 };
  const jogo = () => criarNovoJogo({ nomeHeroi: "Ana", classeId: "cavaleiro", agora: 1, rng: criarRng(3) });
  const vitoriaZona = { resultado: "vitoria", origem: { tipo: "zona", zonaId: "cemiterio", chefe: false } };
  const decidir = (save, resumo, opcoes = OPCOES, encontrosNoTrecho = 1) => decidirProximo(save, { resumo, encontrosNoTrecho }, opcoes);

  it("vitória numa zona: próximo encontro da mesma zona", () => {
    expect(decidir(jogo(), vitoriaZona)).toEqual({ proximo: { tipo: "zona", zonaId: "cemiterio" } });
  });

  it("derrota, chefe vencido, masmorra concluída ou abandonada: para", () => {
    const save = jogo();
    expect(decidir(save, { ...vitoriaZona, resultado: "derrota" }).motivo).toMatch(/Derrota/);
    expect(decidir(save, { ...vitoriaZona, origem: { ...vitoriaZona.origem, chefe: true } }).motivo).toMatch(/chefe foi vencido/);
    expect(decidir(save, { resultado: "vitoria", origem: { tipo: "masmorra" }, masmorra: { tipo: "concluida" } }).motivo).toBe("Masmorra concluída.");
    expect(decidir(save, { resultado: "fuga", origem: { tipo: "masmorra" }, masmorra: { tipo: "saiu" } }).motivo).toMatch(/saiu da masmorra/);
    expect(decidir(save, null).motivo).toMatch(/Não há um próximo encontro/);
  });

  it("inventário cheio para (opção ligada) e segue com a opção desligada", () => {
    const save = jogo();
    const base = Object.values(save.inventario.equipamentos)[0];
    for (let i = 0; i < MAX_EQUIPAMENTOS_INVENTARIO; i++) save.inventario.equipamentos[`x${i}`] = { ...base, id: `x${i}` };
    expect(decidir(save, vitoriaZona).motivo).toMatch(/Inventário cheio/);
    expect(decidir(save, vitoriaZona, { ...OPCOES, autoPararInventario: false }).proximo).toBeDefined();
  });

  it("limite de encontros conta o trecho atual", () => {
    const opcoes = { ...OPCOES, autoLimiteEncontros: 10 };
    expect(decidir(jogo(), vitoriaZona, opcoes, 9).proximo).toBeDefined();
    expect(decidir(jogo(), vitoriaZona, opcoes, 10).motivo).toBe("Limite de 10 encontros atingido.");
  });

  it("chefe da zona acabou de aparecer: para uma vez (opção ligada)", () => {
    const save = jogo();
    save.progresso.zonas.cemiterio.encontrosVencidos = 10;
    expect(decidir(save, vitoriaZona).motivo).toMatch(/chefe de Cemitério Antigo apareceu/);
    expect(decidir(save, vitoriaZona, { ...OPCOES, autoPararChefe: false }).proximo).toBeDefined();
    save.progresso.zonas.cemiterio.encontrosVencidos = 11;
    expect(decidir(save, vitoriaZona).proximo).toBeDefined();
    save.progresso.zonas.cemiterio.encontrosVencidos = 10;
    save.progresso.zonas.cemiterio.chefeDerrotado = true;
    expect(decidir(save, vitoriaZona).proximo).toBeDefined();
  });

  it("masmorra: desce o próximo andar; para antes do andar do chefe e com vida baixa", () => {
    const save = jogo();
    const [a, b] = save.grupo;
    const vidaMax = vidaMaximaDoHeroi(save.herois[b], save.inventario.equipamentos);
    save.masmorraAtual = { zonaId: "cemiterio", andar: 3, vida: { [a]: 9999, [b]: vidaMax }, ganhos: {}, fogueira: null };
    const andar = { resultado: "vitoria", origem: { tipo: "masmorra" }, masmorra: { tipo: "andar" } };
    expect(decidir(save, andar)).toEqual({ proximo: { tipo: "andar" } });
    expect(decidir(save, null)).toEqual({ proximo: { tipo: "andar" } });

    save.masmorraAtual.andar = ANDARES_MASMORRA;
    expect(decidir(save, andar).motivo).toBe("O próximo andar é o do chefe.");
    expect(decidir(save, andar, { ...OPCOES, autoPararChefe: false }).proximo).toEqual({ tipo: "andar" });

    save.masmorraAtual.andar = 3;
    save.masmorraAtual.vida[b] = Math.floor(vidaMax * 0.2);
    expect(decidir(save, andar, { ...OPCOES, autoVidaMinima: 0.25 }).motivo).toMatch(/desceria com 1\d% da vida/);
    expect(decidir(save, andar, { ...OPCOES, autoVidaMinima: 0 }).proximo).toBeDefined();
  });
});
