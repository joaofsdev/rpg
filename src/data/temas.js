// Temas de cor (SPEC.md §7.5). Fonte única das cores: o @theme de src/index.css repete o tema
// Taverna (o Tailwind precisa dele para gerar as classes) e um teste confere que os dois batem.
// Toda cor usada como texto tem contraste ≥ 4,5:1 com fundo, superfície e elevado (teste em
// temas.test.js); os valores da tabela do SPEC foram ajustados o mínimo para isso.

export const TEMA_PADRAO = "taverna";
export const TEMA_PADRAO_CLARO = "pergaminho"; // primeiro acesso com o sistema em tema claro

// Cores usadas como texto e as superfícies sobre as quais aparecem
export const CORES_DE_TEXTO = [
  "texto",
  "texto-2",
  "texto-3",
  "destaque",
  "destaque-claro",
  "sucesso",
  "perigo",
  "mana",
  "vigor",
  "info",
  "raridade-comum",
  "raridade-incomum",
  "raridade-raro",
  "raridade-epico",
  "raridade-lendario",
];
export const SUPERFICIES = ["fundo", "superficie", "elevado"];

export const temas = {
  taverna: {
    id: "taverna",
    nome: "Taverna",
    claro: false,
    cores: {
      fundo: "#1c1814",
      superficie: "#26201a",
      elevado: "#2f281f",
      borda: "#3d3428",
      "borda-forte": "#5c4a35",
      texto: "#ece3d3",
      "texto-2": "#b5a68e",
      "texto-3": "#9d907b",
      destaque: "#d9a441",
      "destaque-claro": "#ecc271",
      "sobre-destaque": "#241a0c",
      sucesso: "#7fb069",
      perigo: "#d5786d",
      mana: "#6f91d5",
      vigor: "#d99a4a",
      info: "#6c9bc4",
      "raridade-comum": "#b0a696",
      "raridade-incomum": "#8cbf73",
      "raridade-raro": "#7aa6dc",
      "raridade-epico": "#b98fd8",
      "raridade-lendario": "#e3a94f",
    },
  },
  pergaminho: {
    id: "pergaminho",
    nome: "Pergaminho",
    claro: true,
    cores: {
      fundo: "#f3ead8",
      superficie: "#fbf5e8",
      elevado: "#eadfc8",
      borda: "#d6c6a6",
      "borda-forte": "#b9a47e",
      texto: "#3b2f22",
      "texto-2": "#6b5a45",
      "texto-3": "#715f4a",
      destaque: "#835a1a",
      "destaque-claro": "#875812",
      "sobre-destaque": "#fbf5e8",
      sucesso: "#466b33",
      perigo: "#a14439",
      mana: "#3a658a",
      vigor: "#885618",
      info: "#2f6080",
      "raridade-comum": "#6a6154",
      "raridade-incomum": "#416b2f",
      "raridade-raro": "#2f5f9e",
      "raridade-epico": "#7a4aa8",
      "raridade-lendario": "#8c560f",
    },
  },
  bosque: {
    id: "bosque",
    nome: "Bosque",
    claro: false,
    cores: {
      fundo: "#141a16",
      superficie: "#1b231e",
      elevado: "#232d26",
      borda: "#2e3a31",
      "borda-forte": "#46574a",
      texto: "#e3eadf",
      "texto-2": "#a3b09c",
      "texto-3": "#8a9884",
      destaque: "#c9b26b",
      "destaque-claro": "#e0cc8a",
      "sobre-destaque": "#1c1a0c",
      sucesso: "#8cc084",
      perigo: "#d97a6c",
      mana: "#7fa3d9",
      vigor: "#d4a95a",
      info: "#7fb0c9",
      "raridade-comum": "#b0b4a6",
      "raridade-incomum": "#8cc084",
      "raridade-raro": "#7fa8dc",
      "raridade-epico": "#b993d8",
      "raridade-lendario": "#e3ac55",
    },
  },
  noite: {
    id: "noite",
    nome: "Noite",
    claro: false,
    cores: {
      fundo: "#141826",
      superficie: "#1b2033",
      elevado: "#232a40",
      borda: "#2f3752",
      "borda-forte": "#46507a",
      texto: "#e4e6f0",
      "texto-2": "#a2a8c0",
      "texto-3": "#8c92ac",
      destaque: "#c6a8e8",
      "destaque-claro": "#dcc4f5",
      "sobre-destaque": "#1c1430",
      sucesso: "#7fc4a8",
      perigo: "#e08a8a",
      mana: "#8fa8f0",
      vigor: "#e0b070",
      info: "#8fb8e0",
      "raridade-comum": "#aab0c4",
      "raridade-incomum": "#8cc49a",
      "raridade-raro": "#8fb0f0",
      "raridade-epico": "#c49ae8",
      "raridade-lendario": "#e8b060",
    },
  },
};

export function buscarTema(id) {
  return temas[id] ?? temas[TEMA_PADRAO];
}

// { "--color-fundo": "#…", … } para aplicar num elemento (raiz da página ou a arena)
export function variaveisDoTema(id) {
  return Object.fromEntries(Object.entries(buscarTema(id).cores).map(([token, cor]) => [`--color-${token}`, cor]));
}
