import { describe, it, expect } from "vitest";
import { entrarNaMasmorra, inimigosDoAndar, origemDoAndar, concluirAndar, sairDaMasmorra } from "./masmorra";
import { criarBatalha, aplicarAcao } from "./combate";
import { aplicarResultadoBatalha } from "./progressao";
import { podeEquipar, precoVenda } from "./itens";
import { equipamentosLivres, precoVendaItem } from "./inventario";
import { itens } from "../data/itens";
import { criarRng } from "./rng";
import { ajustar, golpeQualquer } from "./__fixtures__/batalhas";
import { criarNovoJogo } from "../save/novoJogo";
import { buscarZona } from "../data/zonas";
import { CURA_FOGUEIRA, DESCANSO_ENTRE_ANDARES, MAX_EQUIPAMENTOS_INVENTARIO } from "../data/constants";

const cemiterio = buscarZona("cemiterio");

function jogoComMasmorra() {
  const save = criarNovoJogo({ nomeHeroi: "Ana", classeId: "cavaleiro", agora: 1, rng: criarRng(3) });
  // Heróis fortes o bastante para o chefe de nível 15 não derrubá-los antes de agirem
  const herois = Object.fromEntries(Object.entries(save.herois).map(([id, h]) => [id, { ...h, nivel: 40 }]));
  return {
    ...save,
    herois,
    progresso: {
      ...save.progresso,
      masmorras: {
        ...save.progresso.masmorras,
        cripta_esquecida: { desbloqueada: true, concluida: false, melhorAndar: 0 },
      },
    },
  };
}

function batalhaDoAndar(save) {
  const m = save.masmorraAtual;
  return criarBatalha({
    herois: save.grupo.map((id) => save.herois[id]),
    equipamentos: save.inventario.equipamentos,
    inimigos: inimigosDoAndar(cemiterio, m.andar, criarRng(m.andar)),
    origem: origemDoAndar(m),
    semente: m.andar,
    vidaInicial: m.vida,
  }).batalha;
}

// Joga um andar inteiro (vencendo com heróis fortíssimos ou fugindo) e aplica o resultado.
// ferir: vida que o primeiro herói tem ao terminar o andar.
function jogarAndar(save, { vencer = true, ferir } = {}) {
  let batalha = batalhaDoAndar(save);
  for (let i = 0; i < 60 && batalha.fase === "escolhaAcao"; i++) {
    if (!vencer) {
      batalha = aplicarAcao(batalha, { tipo: "fugir" }).batalha;
      continue;
    }
    batalha = ajustar(batalha, batalha.ativoId, { atributos: { velocidade: 999, forca: 99999, magia: 99999 } });
    batalha = aplicarAcao(batalha, golpeQualquer(batalha)).batalha;
  }
  if (ferir !== undefined) batalha = ajustar(batalha, "h0", { hpAtual: ferir });
  const { save: depois, resumo } = aplicarResultadoBatalha(save, batalha);
  return { ...concluirAndar(depois, batalha, resumo), batalha };
}

describe("masmorra", () => {
  it("com inventário e pilhas cheios, os drops do andar são vendidos e o ouro entra nos ganhos", () => {
    let save = jogoComMasmorra();
    const cheias = { ...save.inventario.itens };
    for (const id of Object.keys(itens)) cheias[id] = itens[id].empilhaAte;
    const lixo = {};
    for (let i = equipamentosLivres(save).length; i < MAX_EQUIPAMENTOS_INVENTARIO; i++) {
      lixo[`x${i}`] = { id: `x${i}`, slot: "botas", pesoArmadura: "leve", raridade: "Comum", nivel: 1, bonus: {}, aprimoramento: 0 };
    }
    save = { ...save, inventario: { itens: cheias, equipamentos: { ...save.inventario.equipamentos, ...lixo } } };
    save = entrarNaMasmorra(save, "cemiterio").save;
    const { save: depois, batalha } = jogarAndar(save);
    const r = batalha.recompensas;
    const vendas =
      Object.entries(r.itens).reduce((s, [id, q]) => s + q * precoVendaItem(id), 0) +
      r.equipamentos.reduce((s, e) => s + precoVenda(e), 0);
    expect(depois.inventario.itens).toEqual(cheias);
    expect(equipamentosLivres(depois)).toHaveLength(MAX_EQUIPAMENTOS_INVENTARIO);
    expect(depois.masmorraAtual.ganhos.ouro).toBe(r.ouro + vendas);
  });

  it("só entra com a masmorra desbloqueada e sem outra em andamento", () => {
    const fechado = criarNovoJogo({ nomeHeroi: "A", classeId: "mago", agora: 1, rng: criarRng(1) });
    expect(entrarNaMasmorra(fechado, "cemiterio").erro).toBeTruthy();
    const { save } = entrarNaMasmorra(jogoComMasmorra(), "cemiterio");
    expect(save.masmorraAtual).toMatchObject({ zonaId: "cemiterio", andar: 1, vida: {} });
    expect(entrarNaMasmorra(save, "cemiterio").erro).toBeTruthy();
  });

  it("andares começam no nível máximo da zona e o 6º é o chefe fortalecido", () => {
    expect(inimigosDoAndar(cemiterio, 1, criarRng(1)).every((i) => i.nivel === 10)).toBe(true);
    expect(inimigosDoAndar(cemiterio, 5, criarRng(1)).every((i) => i.nivel === 11)).toBe(true);
    expect(inimigosDoAndar(cemiterio, 6, criarRng(1))).toEqual([{ id: "guardiao_cripta", nivel: 11 }]);
  });

  it("a vida carrega entre andares, só com o descanso curto (CA §3.5)", () => {
    let { save } = entrarNaMasmorra(jogoComMasmorra(), "cemiterio");
    const r = jogarAndar(save, { ferir: 37 });
    const descanso = Math.floor(r.batalha.combatentes.h0.hpMax * DESCANSO_ENTRE_ANDARES);
    save = r.save;
    const primeiro = r.batalha.combatentes.h0.refId;
    expect(save.masmorraAtual.andar).toBe(2);
    expect(save.masmorraAtual.vida[primeiro]).toBe(37 + descanso);
    const proxima = batalhaDoAndar(save);
    expect(proxima.combatentes.h0.hpAtual).toBe(37 + descanso);
  });

  it("depois do 2º andar a fogueira cura a vida (CA §3.5)", () => {
    let { save } = entrarNaMasmorra(jogoComMasmorra(), "cemiterio");
    save = jogarAndar(save).save;
    const r = jogarAndar(save, { ferir: 1 });
    expect(r.evento).toMatchObject({ tipo: "andar", andar: 2, fogueira: true });
    expect(r.save.masmorraAtual.fogueira).toEqual({ andar: 2 });
    const h0 = r.batalha.combatentes.h0;
    expect(r.save.masmorraAtual.vida[h0.refId]).toBe(Math.min(h0.hpMax, 1 + Math.floor(h0.hpMax * CURA_FOGUEIRA)));
  });

  it("herói caído é levantado pela fogueira com 25%", () => {
    let { save } = entrarNaMasmorra(jogoComMasmorra(), "cemiterio");
    save = jogarAndar(save).save;
    let batalha = batalhaDoAndar(save);
    const h0 = batalha.combatentes.h0;
    save = { ...save, masmorraAtual: { ...save.masmorraAtual, vida: { ...save.masmorraAtual.vida, [h0.refId]: 0 } } };
    batalha = batalhaDoAndar(save);
    expect(batalha.combatentes.h0.nocauteado).toBe(true);
    const r = jogarAndar(save);
    expect(r.save.masmorraAtual.vida[h0.refId]).toBe(Math.floor(h0.hpMax * 0.25));
  });

  it("sair depois do 3º andar mantém os ganhos e recomeça do andar 1 (CA §3.5)", () => {
    let { save } = entrarNaMasmorra(jogoComMasmorra(), "cemiterio");
    const ouroInicial = save.ouro;
    for (let i = 0; i < 3; i++) save = jogarAndar(save).save;
    expect(save.ouro).toBeGreaterThan(ouroInicial);
    expect(save.masmorraAtual.ganhos.ouro).toBe(save.ouro - ouroInicial);
    const ouroAntes = save.ouro;
    save = sairDaMasmorra(save);
    expect(save.masmorraAtual).toBeNull();
    expect(save.ouro).toBe(ouroAntes);
    expect(save.progresso.masmorras.cripta_esquecida.melhorAndar).toBe(3);
    expect(entrarNaMasmorra(save, "cemiterio").save.masmorraAtual.andar).toBe(1);
  });

  it("fugir encerra a masmorra sem perder o que já foi ganho", () => {
    let { save } = entrarNaMasmorra(jogoComMasmorra(), "cemiterio");
    save = jogarAndar(save).save;
    const ouro = save.ouro;
    const r = jogarAndar(save, { vencer: false });
    expect(r.evento.tipo).toBe("saiu");
    expect(r.save.masmorraAtual).toBeNull();
    expect(r.save.ouro).toBe(ouro);
  });

  it("vencer o chefe conclui a masmorra e entrega um Lendário usável (CA §3.5)", () => {
    let { save } = entrarNaMasmorra(jogoComMasmorra(), "cemiterio");
    let r;
    for (let i = 0; i < 6; i++) {
      r = jogarAndar(save);
      save = r.save;
    }
    expect(r.evento.tipo).toBe("concluida");
    expect(save.masmorraAtual).toBeNull();
    expect(save.progresso.masmorras.cripta_esquecida).toMatchObject({ concluida: true, melhorAndar: 6 });
    const lendarios = r.batalha.recompensas.equipamentos.filter((e) => e.raridade === "Lendário");
    expect(lendarios).toHaveLength(1);
    const classes = save.grupo.map((id) => save.herois[id].classeId);
    expect(classes.some((c) => podeEquipar(c, lendarios[0]))).toBe(true);
  });
});
