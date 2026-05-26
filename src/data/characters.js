export const characters = [
  {
    id: 'kael',
    name: 'Kael',
    title: 'O Guerreiro',
    emoji: '⚔️',
    baseStats: { vida: 120, forca: 18, defesa: 14, velocidade: 10 },
    attacks: [
      { name: 'Golpe Brutal', power: 20, maxPP: 5 },
      { name: 'Investida', power: 15, maxPP: 8 },
      { name: 'Escudo de Aço', power: 8, maxPP: 6 },
      { name: 'Provocação', power: 12, maxPP: 4 },
    ],
  },
  {
    id: 'lyra',
    name: 'Lyra',
    title: 'A Arqueira',
    emoji: '🏹',
    baseStats: { vida: 90, forca: 22, defesa: 8, velocidade: 20 },
    attacks: [
      { name: 'Flecha Certeira', power: 22, maxPP: 6 },
      { name: 'Chuva de Flechas', power: 18, maxPP: 4 },
      { name: 'Recuar', power: 8, maxPP: 8 },
      { name: 'Tiro Duplo', power: 25, maxPP: 3 },
    ],
  },
  {
    id: 'zorn',
    name: 'Zorn',
    title: 'O Mago',
    emoji: '🔮',
    baseStats: { vida: 80, forca: 28, defesa: 6, velocidade: 14 },
    attacks: [
      { name: 'Bola de Fogo', power: 28, maxPP: 5 },
      { name: 'Relâmpago', power: 24, maxPP: 4 },
      { name: 'Escudo Arcano', power: 10, maxPP: 6 },
      { name: 'Explosão', power: 35, maxPP: 2 },
    ],
  },
  {
    id: 'vex',
    name: 'Vex',
    title: 'O Assassino',
    emoji: '🗡️',
    baseStats: { vida: 95, forca: 20, defesa: 10, velocidade: 24 },
    attacks: [
      { name: 'Golpe Furtivo', power: 24, maxPP: 5 },
      { name: 'Veneno', power: 16, maxPP: 7 },
      { name: 'Esquivar', power: 8, maxPP: 6 },
      { name: 'Lâmina Dupla', power: 22, maxPP: 4 },
    ],
  },
]
