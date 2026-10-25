// Nomes exibidos na interface para valores internos do jogo

export const NOMES_ELEMENTO = {
  corte: "corte",
  impacto: "impacto",
  perfuracao: "perfuração",
  fogo: "fogo",
  gelo: "gelo",
  raio: "raio",
  luz: "luz",
  sombra: "sombra",
};

export const CORES_ELEMENTO = {
  corte: "#d8d2c4",
  impacto: "#c9a27a",
  perfuracao: "#bfc8d2",
  fogo: "#f08a3c",
  gelo: "#8fd0f0",
  raio: "#f2dc5a",
  luz: "#fff1b0",
  sombra: "#9a7ad0",
};

export const NOMES_RECURSO = { mana: "mana", vigor: "vigor" };

export const NOMES_SLOT = {
  capacete: "Cabeça",
  peitoral: "Peito",
  luvas: "Mãos",
  botas: "Pés",
  arma: "Arma",
};

export const NOMES_ATRIBUTO = {
  vida: "Vida",
  forca: "Força",
  magia: "Magia",
  defesa: "Defesa",
  resistencia: "Resistência",
  velocidade: "Velocidade",
  manaMax: "Mana máxima",
};

export const DESCRICAO_ALVO = {
  inimigo: "1 inimigo",
  todosInimigos: "todos os inimigos",
  aliado: "1 aliado",
  todosAliados: "todo o grupo",
  proprio: "a si mesmo",
};

export const NOMES_PESO = { pesada: "pesada", media: "média", leve: "leve", pano: "pano" };

export const NOMES_ARMA = {
  espada: "espada",
  maca: "maça",
  machado: "machado",
  arco: "arco",
  besta: "besta",
  cajado: "cajado",
  varinha: "varinha",
  grimorio: "grimório",
  adaga: "adaga",
  katana: "katana",
  instrumento: "instrumento",
  espada_leve: "espada leve",
  machado_grande: "machado grande",
  maca_pesada: "maça pesada",
  lanca: "lança",
};

// Efeitos de refeições e relíquias: "Vida máxima +10%", "Recurso inicial +20", "Dano de luz +10%"
const ROTULO_EFEITO = {
  vidaMax: "Vida máxima",
  ataque: "Força e magia",
  defesa: "Defesa e resistência",
  recursoInicial: "Recurso inicial",
  xp: "XP",
  ouro: "Ouro",
};

export function descreverEfeito({ tipo, valor, elemento }) {
  if (tipo === "danoElemento") return `Dano de ${NOMES_ELEMENTO[elemento]} +${Math.round(valor * 100)}%`;
  const quanto = tipo === "recursoInicial" ? `+${valor}` : `+${Math.round(valor * 100)}%`;
  return `${ROTULO_EFEITO[tipo]} ${quanto}`;
}
