export const enemies = [
  {
    id: 'goblin',
    name: 'Goblin Selvagem',
    emoji: '👺',
    baseStats: { vida: 70, forca: 12, defesa: 6, velocidade: 18 },
    attacks: [
      { name: 'Mordida', power: 10, maxPP: 8 },
      { name: 'Arranhão', power: 8, maxPP: 10 },
      { name: 'Fuga', power: 5, maxPP: 6 },
    ],
  },
  {
    id: 'troll',
    name: 'Troll das Rochas',
    emoji: '🪨',
    baseStats: { vida: 140, forca: 16, defesa: 20, velocidade: 5 },
    attacks: [
      { name: 'Esmagamento', power: 20, maxPP: 5 },
      { name: 'Regeneração', power: 6, maxPP: 4 },
      { name: 'Arremesso', power: 14, maxPP: 6 },
    ],
  },
  {
    id: 'wolf',
    name: 'Lobo Sombrio',
    emoji: '🐺',
    baseStats: { vida: 85, forca: 19, defesa: 8, velocidade: 22 },
    attacks: [
      { name: 'Mordida Furiosa', power: 18, maxPP: 6 },
      { name: 'Garra', power: 15, maxPP: 8 },
      { name: 'Uivo', power: 8, maxPP: 4 },
    ],
  },
  {
    id: 'skeleton',
    name: 'Esqueleto Guerreiro',
    emoji: '💀',
    baseStats: { vida: 100, forca: 15, defesa: 12, velocidade: 12 },
    attacks: [
      { name: 'Golpe Ossudo', power: 16, maxPP: 6 },
      { name: 'Lança Podre', power: 12, maxPP: 8 },
      { name: 'Maldição', power: 10, maxPP: 4 },
    ],
  },
  {
    id: 'dark_mage',
    name: 'Mago Corrompido',
    emoji: '🧙‍♂️',
    baseStats: { vida: 75, forca: 25, defesa: 5, velocidade: 16 },
    attacks: [
      { name: 'Raio Sombrio', power: 24, maxPP: 5 },
      { name: 'Dreno de Vida', power: 18, maxPP: 6 },
      { name: 'Explosão Arcana', power: 30, maxPP: 3 },
    ],
  },
  {
    id: 'dragon',
    name: 'Dragão Menor',
    emoji: '🐉',
    baseStats: { vida: 160, forca: 22, defesa: 18, velocidade: 8 },
    attacks: [
      { name: 'Bafo de Fogo', power: 25, maxPP: 5 },
      { name: 'Cauda', power: 18, maxPP: 7 },
      { name: 'Garras', power: 20, maxPP: 6 },
    ],
  },
]
