// Tabelas de geração de equipamento

export const RARIDADES = ["Comum", "Incomum", "Raro", "Épico", "Lendário"];

export const multiplicadorRaridade = {
  Comum: 1,
  Incomum: 1.5,
  Raro: 2.2,
  Épico: 3,
  Lendário: 4.5,
};

export const multiplicadorPreco = { Comum: 1, Incomum: 3, Raro: 7, Épico: 15, Lendário: 35 };

// Faixas acumuladas (em %) para sortear raridade
export const tabelaRaridade = {
  comum: [
    { raridade: "Épico", ate: 2 },
    { raridade: "Raro", ate: 10 },
    { raridade: "Incomum", ate: 40 },
    { raridade: "Comum", ate: 100 },
  ],
  chefe: [
    { raridade: "Lendário", ate: 2 },
    { raridade: "Épico", ate: 10 },
    { raridade: "Raro", ate: 40 },
    { raridade: "Incomum", ate: 80 },
    { raridade: "Comum", ate: 100 },
  ],
};

// Adjetivos de raridade no masculino singular; flexionados pelo nome base (ver engine/itens.js)
export const prefixosPorRaridade = {
  Comum: ["Velho", "Enferrujado", "Simples", "Gasto", "Básico"],
  Incomum: ["Reforçado", "Polido", "Afiado", "Resistente", "Sólido"],
  Raro: ["Encantado", "Brilhante", "Forjado", "Místico", "Ancestral"],
  Épico: ["Lendário", "Sombrio", "Flamejante", "Glacial", "Divino"],
  Lendário: ["Celestial", "Abissal", "Primordial", "Eterno", "Supremo"],
};

export const materiais = [
  "Ferro",
  "Aço",
  "Bronze",
  "Couro",
  "Osso",
  "Cristal",
  "Obsidiana",
  "Mithril",
  "Ébano",
  "Prata",
];

// Nomes base com gênero e número para a concordância: m, f, mp (masc. plural), fp (fem. plural)
export const nomesArmas = {
  espada: [["Espada", "f"], ["Lâmina", "f"], ["Gládio", "m"]],
  maca: [["Maça", "f"], ["Martelo", "m"], ["Clava", "f"]],
  machado: [["Machado", "m"], ["Cutelo", "m"]],
  arco: [["Arco", "m"], ["Arco Longo", "m"], ["Arco Curto", "m"]],
  besta: [["Besta", "f"], ["Balestra", "f"]],
  cajado: [["Cajado", "m"], ["Bastão Arcano", "m"]],
  varinha: [["Varinha", "f"], ["Cetro", "m"]],
  grimorio: [["Grimório", "m"], ["Tomo", "m"]],
  adaga: [["Adaga", "f"], ["Punhal", "m"], ["Faca", "f"]],
  katana: [["Katana", "f"], ["Wakizashi", "f"]],
  instrumento: [["Alaúde", "m"], ["Harpa", "f"], ["Flauta", "f"]],
  espada_leve: [["Rapieira", "f"], ["Florete", "m"]],
  machado_grande: [["Machado Grande", "m"], ["Alabarda", "f"]],
  maca_pesada: [["Maça de Guerra", "f"], ["Mangual", "m"]],
  lanca: [["Lança", "f"], ["Tridente", "m"]],
};

export const TIPOS_ARMA = Object.keys(nomesArmas);

// Armas cujo bônus principal é magia em vez de força
export const TIPOS_ARMA_MAGICA = ["cajado", "varinha", "grimorio", "instrumento"];

export const PESOS_ARMADURA = ["pesada", "media", "leve", "pano"];

export const nomesArmaduras = {
  capacete: {
    pesada: [["Elmo", "m"], ["Capacete", "m"]],
    media: [["Capuz Reforçado", "m"], ["Coifa", "f"]],
    leve: [["Capuz", "m"], ["Tiara", "f"]],
    pano: [["Chapéu", "m"], ["Diadema", "m"]],
  },
  peitoral: {
    pesada: [["Peitoral", "m"], ["Couraça", "f"]],
    media: [["Cota de Malha", "f"], ["Gibão", "m"]],
    leve: [["Túnica", "f"], ["Colete", "m"]],
    pano: [["Manto", "m"], ["Veste", "f"]],
  },
  luvas: {
    pesada: [["Manoplas", "fp"], ["Guarda-Mãos", "mp"]],
    media: [["Luvas Cotadas", "fp"]],
    leve: [["Luvas", "fp"], ["Braçadeiras", "fp"]],
    pano: [["Faixas", "fp"]],
  },
  botas: {
    pesada: [["Grevas", "fp"], ["Botas Ferradas", "fp"]],
    media: [["Botinas", "fp"]],
    leve: [["Botas Leves", "fp"], ["Sandálias", "fp"]],
    pano: [["Sapatilhas", "fp"]],
  },
};

// Elemento do ataque básico conforme a arma equipada
export const elementoPorArma = {
  espada: "corte",
  katana: "corte",
  adaga: "corte",
  machado: "corte",
  espada_leve: "corte",
  maca: "impacto",
  maca_pesada: "impacto",
  machado_grande: "impacto",
  arco: "perfuracao",
  besta: "perfuracao",
  lanca: "perfuracao",
  cajado: "impacto",
  varinha: "impacto",
  grimorio: "impacto",
  instrumento: "impacto",
};

export const ELEMENTO_SEM_ARMA = "impacto";
