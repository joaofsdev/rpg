// Integridade dos dados do jogo: toda referência aponta para algo que existe
import { describe, it, expect } from "vitest";
import { golpes, golpesHerois } from "./golpes";
import { golpesInimigos } from "./golpesInimigos";
import { aparenciaInimigos } from "./aparenciaInimigos";
import { spritesInimigos } from "./sprites";
import { CONSUMIVEIS_A_VENDA } from "./loja";
import { classesHeroi } from "./classesHeroi";
import { inimigos } from "./inimigos";
import { zonas } from "./zonas";
import { itens } from "./itens";
import { status } from "./status";
import { nomesArmas, PESOS_ARMADURA, TIPOS_ARMA, elementoPorArma } from "./equipamentos";
import { ELEMENTOS, MAX_GOLPES_EQUIPADOS, MAX_INIMIGOS_ENCONTRO } from "./constants";

const CATEGORIAS = ["fisico", "magico", "suporte"];
const ALVOS = ["inimigo", "todosInimigos", "aliado", "todosAliados", "proprio"];
const EFEITOS = ["status", "modificador", "cura", "recurso", "autoDano"];
const PASSIVOS = ["reducaoDano", "critico", "danoAlto", "primeiroGolpe", "restaurarRecursoAliado", "furia"];

function chavesBatemComIds(colecao) {
  for (const [chave, valor] of Object.entries(colecao)) expect(valor.id).toBe(chave);
}

describe("golpes", () => {
  it("ids batem com as chaves", () => chavesBatemComIds(golpes));

  it.each(Object.values(golpes))("$id é válido", (golpe) => {
    expect(CATEGORIAS).toContain(golpe.categoria);
    expect(ALVOS).toContain(golpe.alvo);
    expect(golpe.custo).toBeGreaterThanOrEqual(0);
    if (golpe.categoria !== "suporte") {
      expect(golpe.poder).toBeGreaterThan(0);
      expect([...ELEMENTOS, "arma"]).toContain(golpe.elemento);
    }
    for (const efeito of golpe.efeitos || []) {
      expect(EFEITOS).toContain(efeito.tipo);
      if (efeito.tipo === "status") expect(status[efeito.statusId]).toBeDefined();
    }
  });
});

describe("classes", () => {
  it("ids batem com as chaves", () => chavesBatemComIds(classesHeroi));

  it.each(Object.values(classesHeroi))("$id é válida", (classe) => {
    expect(["mana", "vigor"]).toContain(classe.recurso);
    if (classe.recurso === "mana") expect(classe.manaBase).toBeGreaterThan(0);
    expect(classe.golpesIniciais).toHaveLength(MAX_GOLPES_EQUIPADOS);
    for (const id of [...classe.golpesIniciais, classe.golpeBasico]) expect(golpes[id]).toBeDefined();
    expect(golpes[classe.golpeBasico].custo).toBe(0);
    expect(PASSIVOS).toContain(classe.passivo.tipo);
    for (const arma of classe.armasPermitidas) expect(TIPOS_ARMA).toContain(arma);
    for (const peso of classe.armadurasPermitidas) expect(PESOS_ARMADURA).toContain(peso);
  });
});

describe("inimigos", () => {
  it("ids batem com as chaves", () => chavesBatemComIds(inimigos));

  it.each(Object.values(inimigos))("$id é válido", (inimigo) => {
    for (const id of inimigo.golpes) expect(golpes[id]).toBeDefined();
    for (const id of inimigo.ia.padrao) expect(inimigo.golpes).toContain(id);
    for (const regra of inimigo.ia.regras) expect(inimigo.golpes).toContain(regra.golpeId);
    for (const elemento of [...inimigo.fraquezas, ...inimigo.resistencias]) {
      expect(ELEMENTOS).toContain(elemento);
    }
    for (const imunidade of inimigo.imunidades) {
      expect(ELEMENTOS.includes(imunidade) || Boolean(status[imunidade])).toBe(true);
    }
    for (const drop of inimigo.drops) {
      expect(itens[drop.itemId]).toBeDefined();
      expect(drop.chance).toBeGreaterThan(0);
      expect(drop.chance).toBeLessThanOrEqual(1);
    }
  });
});

describe("zonas", () => {
  it("ids de zona e de masmorra são únicos", () => {
    expect(new Set(zonas.map((z) => z.id)).size).toBe(zonas.length);
    expect(new Set(zonas.map((z) => z.masmorra.id)).size).toBe(zonas.length);
  });

  it("faixas de nível são contínuas", () => {
    zonas.forEach((zona, i) => {
      expect(zona.nivelMin).toBeLessThan(zona.nivelMax);
      if (i > 0) expect(zona.nivelMin).toBe(zonas[i - 1].nivelMax + 1);
    });
  });

  it.each(zonas.filter((z) => z.jogavel))("$id tem conteúdo válido", (zona) => {
    for (const id of zona.inimigos) expect(inimigos[id]).toBeDefined();
    expect(inimigos[zona.chefe]?.chefe).toBe(true);
    for (const encontro of zona.encontros) {
      expect(encontro.peso).toBeGreaterThan(0);
      expect(encontro.inimigos.length).toBeGreaterThanOrEqual(1);
      expect(encontro.inimigos.length).toBeLessThanOrEqual(MAX_INIMIGOS_ENCONTRO);
      for (const id of encontro.inimigos) expect(zona.inimigos).toContain(id);
    }
    for (const entrada of zona.tabelaExpedicao) expect(itens[entrada.itemId]).toBeDefined();
  });
});

describe("itens e equipamentos", () => {
  it("ids batem com as chaves", () => chavesBatemComIds(itens));

  it("todo tipo de arma tem elemento para o ataque básico", () => {
    for (const tipo of Object.keys(nomesArmas)) expect(ELEMENTOS).toContain(elementoPorArma[tipo]);
  });
});

describe("conteúdo da Fase 5", () => {
  it("golpes de heróis e de inimigos não compartilham ids", () => {
    const repetidos = Object.keys(golpesHerois).filter((id) => golpesInimigos[id]);
    expect(repetidos).toEqual([]);
  });

  it.each(Object.values(classesHeroi))("$id aprende 4 golpes em níveis crescentes", (classe) => {
    expect(classe.golpesPorNivel).toHaveLength(4);
    const niveis = classe.golpesPorNivel.map((g) => g.nivel);
    expect([...niveis].sort((a, b) => a - b)).toEqual(niveis);
    for (const { golpeId } of classe.golpesPorNivel) {
      expect(golpesHerois[golpeId]).toBeDefined();
      expect(classe.golpesIniciais).not.toContain(golpeId);
    }
  });

  it("todo inimigo tem sprite com arquivo", () => {
    for (const id of Object.keys(inimigos)) {
      expect(aparenciaInimigos[id], id).toBeDefined();
      expect(spritesInimigos[id]?.arquivo, id).toBeTruthy();
    }
  });

  it("todas as zonas são jogáveis e têm chefe", () => {
    for (const zona of zonas) {
      expect(zona.jogavel).toBe(true);
      expect(inimigos[zona.chefe]?.chefe).toBe(true);
    }
  });

  it("consumíveis à venda existem e têm preço", () => {
    for (const id of CONSUMIVEIS_A_VENDA) expect(itens[id]?.preco).toBeGreaterThan(0);
  });
});
