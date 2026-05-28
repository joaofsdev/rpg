import {
  gerarItemArma,
  gerarItemArmadura,
  sortearRaridade,
} from "./itemGeneration";

const SHOP_KEY = "rpg_shop";
const SHOP_REFRESH_MS = 24 * 60 * 60 * 1000;

const nomesArmas = [
  "espada",
  "arco",
  "cajado",
  "adaga",
  "machado",
  "maca",
  "katana",
  "lanca",
  "besta",
  "varinha",
];
const slots = ["capacete", "peitoral", "luvas", "botas", "arma"];
const pesos = ["pesada", "media", "leve", "pano"];

function calcularPreco(item) {
  const mult = { Comum: 1, Incomum: 3, Raro: 7, Épico: 15, Lendário: 35 };
  const base = 50 + item.nivel * 8;
  return Math.floor(base * (mult[item.raridade] || 1));
}

function calcularPrecoVenda(item) {
  return Math.max(1, Math.floor(calcularPreco(item) * 0.4));
}

function gerarItemLoja(nivelJogador) {
  const nivel = Math.max(1, nivelJogador + Math.floor(Math.random() * 5) - 2);
  const raridade = sortearRaridade(false);
  const slot = slots[Math.floor(Math.random() * slots.length)];
  let item;
  if (slot === "arma") {
    item = gerarItemArma(
      nivel,
      raridade,
      nomesArmas[Math.floor(Math.random() * nomesArmas.length)],
    );
  } else {
    item = gerarItemArmadura(
      nivel,
      raridade,
      slot,
      pesos[Math.floor(Math.random() * pesos.length)],
    );
  }
  item.preco = calcularPreco(item);
  return item;
}

function getShopData() {
  try {
    return JSON.parse(localStorage.getItem(SHOP_KEY));
  } catch {
    return null;
  }
}

function saveShopData(data) {
  localStorage.setItem(SHOP_KEY, JSON.stringify(data));
}

export function getShop(nivelJogador) {
  const now = Date.now();
  let data = getShopData();

  if (!data || now - data.lastRefresh >= SHOP_REFRESH_MS) {
    const items = Array.from({ length: 5 }, () => gerarItemLoja(nivelJogador));
    data = {
      items,
      sold: [false, false, false, false, false],
      lastRefresh: now,
    };
    saveShopData(data);
  }

  return data;
}

export function buyItem(slotIndex, nivelJogador) {
  const data = getShop(nivelJogador);
  if (data.sold[slotIndex]) return null;
  const item = data.items[slotIndex];
  data.sold[slotIndex] = true;
  saveShopData(data);
  return item;
}

export function getTimeUntilRefresh() {
  const data = getShopData();
  if (!data) return 0;
  const elapsed = Date.now() - data.lastRefresh;
  return Math.max(0, SHOP_REFRESH_MS - elapsed);
}

export { calcularPreco, calcularPrecoVenda };
