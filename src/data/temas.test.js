// Contraste dos temas (SPEC.md §7.5): texto ≥ 4,5:1 em todos os temas, pela fórmula da WCAG 2.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { temas, CORES_DE_TEXTO, SUPERFICIES, variaveisDoTema, buscarTema, TEMA_PADRAO } from "./temas";

const CONTRASTE_MINIMO = 4.5;

function luminancia(hex) {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/../g)
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

describe("temas de cor (SPEC §7.5)", () => {
  it("são 4 e todos têm as mesmas cores", () => {
    expect(Object.keys(temas)).toEqual(["taverna", "pergaminho", "bosque", "noite"]);
    const chaves = Object.keys(temas.taverna.cores).sort();
    for (const t of Object.values(temas)) expect(Object.keys(t.cores).sort()).toEqual(chaves);
  });

  it("a fórmula de contraste confere com valores conhecidos", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contraste("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  describe.each(Object.values(temas))("$nome", (tema) => {
    it.each(CORES_DE_TEXTO)("%s tem contraste ≥ 4,5:1 com fundo, superfície e elevado", (token) => {
      for (const superficie of SUPERFICIES) {
        const razao = contraste(tema.cores[token], tema.cores[superficie]);
        expect(razao, `${token} sobre ${superficie}`).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      }
    });

    it("o texto do botão principal é legível no destaque e no destaque claro (hover)", () => {
      expect(contraste(tema.cores["sobre-destaque"], tema.cores.destaque)).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
      expect(contraste(tema.cores["sobre-destaque"], tema.cores["destaque-claro"])).toBeGreaterThanOrEqual(CONTRASTE_MINIMO);
    });
  });

  it("o @theme de index.css é o tema Taverna", () => {
    const css = fs.readFileSync(new URL("../index.css", import.meta.url), "utf8");
    const bloco = css.slice(css.indexOf("@theme {"), css.indexOf("}", css.indexOf("@theme {")));
    const noCss = Object.fromEntries([...bloco.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1], m[2].toLowerCase()]));
    expect(noCss).toEqual(temas.taverna.cores);
  });

  it("variáveis CSS do tema e tema desconhecido cai no padrão", () => {
    expect(variaveisDoTema("noite")["--color-fundo"]).toBe("#141826");
    expect(buscarTema("inexistente").id).toBe(TEMA_PADRAO);
  });
});
