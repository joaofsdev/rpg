const prefixosPorRaridade = {
  Comum: ['Velho', 'Enferrujado', 'Simples', 'Gasto', 'Básico'],
  Incomum: ['Reforçado', 'Polido', 'Afiado', 'Resistente', 'Sólido'],
  Raro: ['Encantado', 'Brilhante', 'Forjado', 'Místico', 'Ancestral'],
  Épico: ['Lendário', 'Sombrio', 'Flamejante', 'Glacial', 'Divino'],
  Lendário: ['Celestial', 'Abissal', 'Primordial', 'Eterno', 'Supremo'],
}

const materiais = ['Ferro', 'Aço', 'Bronze', 'Couro', 'Osso', 'Cristal', 'Obsidiana', 'Mithril', 'Ébano', 'Prata']

const nomesArmas = {
  espada: ['Espada', 'Lâmina', 'Gládio'],
  maca: ['Maça', 'Martelo', 'Clava'],
  machado: ['Machado', 'Cutelo'],
  arco: ['Arco', 'Arco Longo', 'Arco Curto'],
  besta: ['Besta', 'Balestra'],
  cajado: ['Cajado', 'Bastão Arcano'],
  varinha: ['Varinha', 'Cetro'],
  grimorio: ['Grimório', 'Tomo'],
  adaga: ['Adaga', 'Punhal', 'Faca'],
  katana: ['Katana', 'Wakizashi'],
  instrumento: ['Alaúde', 'Harpa', 'Flauta'],
  espada_leve: ['Rapieira', 'Florete'],
  machado_grande: ['Machado Grande', 'Alabarda'],
  maca_pesada: ['Maça de Guerra', 'Mangual'],
  lanca: ['Lança', 'Tridente'],
}

const nomesArmaduras = {
  capacete: { pesada: ['Elmo', 'Capacete'], media: ['Capuz Reforçado', 'Coifa'], leve: ['Capuz', 'Tiara'], pano: ['Chapéu', 'Coroa de Pano'] },
  peitoral: { pesada: ['Peitoral', 'Couraça'], media: ['Cota de Malha', 'Gibão'], leve: ['Túnica', 'Colete'], pano: ['Manto', 'Veste'] },
  luvas: { pesada: ['Manoplas', 'Guarda-Mãos'], media: ['Luvas de Malha'], leve: ['Luvas', 'Braçadeiras'], pano: ['Faixas'] },
  botas: { pesada: ['Grevas', 'Botas de Aço'], media: ['Botas de Couro'], leve: ['Botas Leves', 'Sandálias'], pano: ['Sapatilhas'] },
}

const multiplicadorRaridade = { Comum: 1, Incomum: 1.5, Raro: 2.2, Épico: 3, Lendário: 4.5 }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function gerarBonusBase(nivel, raridade) {
  const mult = multiplicadorRaridade[raridade]
  const base = Math.max(1, Math.floor(nivel * 0.5))
  return {
    bonusVida: Math.floor(randInt(0, base * 2) * mult),
    bonusForca: Math.floor(randInt(0, base) * mult),
    bonusDefesa: Math.floor(randInt(0, base) * mult),
    bonusVelocidade: Math.floor(randInt(0, Math.ceil(base * 0.7)) * mult),
  }
}

function gerarBonusArma(nivel, raridade) {
  const mult = multiplicadorRaridade[raridade]
  const base = Math.max(1, Math.floor(nivel * 0.5))
  // Foco principal: dano (70-100% do potencial)
  const bonusForca = Math.floor(randInt(Math.ceil(base * 0.7), base * 2) * mult)
  // Secundário: vida pequena (30% de chance, valor baixo)
  const bonusVida = Math.random() < 0.3 ? Math.floor(randInt(1, Math.ceil(base * 0.5)) * mult) : 0
  // Velocidade leve
  const bonusVelocidade = Math.floor(randInt(0, Math.ceil(base * 0.4)) * mult)
  return { bonusVida, bonusForca, bonusDefesa: 0, bonusVelocidade }
}

export function gerarItemArma(nivel, raridade, tipoArma) {
  const prefixo = pick(prefixosPorRaridade[raridade])
  const nomeBase = pick(nomesArmas[tipoArma] || ['Arma'])
  const material = pick(materiais)
  return {
    id: crypto.randomUUID(),
    nome: `${nomeBase} ${prefixo} de ${material}`,
    tipo: 'arma',
    tipoArma,
    raridade,
    nivel: Math.max(1, nivel + randInt(-2, 2)),
    ...gerarBonusArma(nivel, raridade),
  }
}

export function gerarItemArmadura(nivel, raridade, slot, pesoArmadura) {
  const prefixo = pick(prefixosPorRaridade[raridade])
  const nomes = nomesArmaduras[slot]?.[pesoArmadura] || ['Equipamento']
  const nomeBase = pick(nomes)
  const material = pick(materiais)
  return {
    id: crypto.randomUUID(),
    nome: `${nomeBase} ${prefixo} de ${material}`,
    tipo: slot,
    pesoArmadura,
    raridade,
    nivel: Math.max(1, nivel + randInt(-2, 2)),
    ...gerarBonusBase(nivel, raridade),
  }
}

export function sortearRaridade(isBoss = false) {
  const r = Math.random() * 100
  if (isBoss) {
    if (r < 2) return 'Lendário'
    if (r < 10) return 'Épico'
    if (r < 40) return 'Raro'
    if (r < 80) return 'Incomum'
    return 'Comum'
  }
  if (r < 2) return 'Épico'
  if (r < 10) return 'Raro'
  if (r < 40) return 'Incomum'
  return 'Comum'
}

export function gerarDrop(nivelInimigo, isBoss = false, areaId = null) {
  if (!isBoss && Math.random() > 0.25) return null

  const quantidade = isBoss ? randInt(2, 3) : 1
  const items = []

  for (let i = 0; i < quantidade; i++) {
    let raridade = sortearRaridade(isBoss)
    if (isBoss && i === 0 && ['Comum', 'Incomum'].includes(raridade)) raridade = 'Raro'

    const slots = ['capacete', 'peitoral', 'luvas', 'botas', 'arma']
    const slot = pick(slots)

    if (slot === 'arma') {
      const tiposArma = Object.keys(nomesArmas)
      items.push(gerarItemArma(nivelInimigo, raridade, pick(tiposArma)))
    } else {
      const pesos = ['pesada', 'media', 'leve', 'pano']
      items.push(gerarItemArmadura(nivelInimigo, raridade, slot, pick(pesos)))
    }
  }

  return items
}

export const corRaridade = {
  Comum: '#9ca3af',
  Incomum: '#22c55e',
  Raro: '#3b82f6',
  Épico: '#a855f7',
  Lendário: '#f59e0b',
}
