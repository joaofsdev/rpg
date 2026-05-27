export const dungeons = [
  { id: 1, name: 'Cripta Esquecida', emoji: '💀', nivel: 10, hordas: 5 },
  { id: 2, name: 'Minas Abandonadas', emoji: '⛏️', nivel: 20, hordas: 5 },
  { id: 3, name: 'Templo Submerso', emoji: '🌊', nivel: 30, hordas: 5 },
  { id: 4, name: 'Torre dos Mortos', emoji: '🗼', nivel: 40, hordas: 5 },
  { id: 5, name: 'Abismo Profundo', emoji: '🕳️', nivel: 50, hordas: 5 },
  { id: 6, name: 'Fortaleza Sombria', emoji: '🏚️', nivel: 60, hordas: 5 },
  { id: 7, name: 'Vulcão Interior', emoji: '🌋', nivel: 70, hordas: 5 },
  { id: 8, name: 'Palácio Demoníaco', emoji: '👿', nivel: 80, hordas: 5 },
  { id: 9, name: 'Nexus Arcano', emoji: '🔮', nivel: 90, hordas: 5 },
  { id: 10, name: 'Trono do Caos', emoji: '👑', nivel: 100, hordas: 5 },
]

const inimigosBase = [
  { name: 'Esqueleto', emoji: '💀', baseStats: { vida: 80, forca: 14, defesa: 10, velocidade: 12 }, attacks: [{ name: 'Golpe Ossudo', power: 14, maxPP: 7 }, { name: 'Investida', power: 18, maxPP: 5 }] },
  { name: 'Espectro', emoji: '👻', baseStats: { vida: 60, forca: 18, defesa: 6, velocidade: 20 }, attacks: [{ name: 'Toque Gélido', power: 18, maxPP: 6 }, { name: 'Lamento', power: 22, maxPP: 4 }] },
  { name: 'Golem', emoji: '🗿', baseStats: { vida: 120, forca: 12, defesa: 20, velocidade: 5 }, attacks: [{ name: 'Esmagar', power: 20, maxPP: 5 }, { name: 'Terremoto', power: 16, maxPP: 6 }] },
  { name: 'Demônio Menor', emoji: '😈', baseStats: { vida: 90, forca: 16, defesa: 12, velocidade: 16 }, attacks: [{ name: 'Garra Infernal', power: 16, maxPP: 6 }, { name: 'Chama Negra', power: 22, maxPP: 4 }] },
  { name: 'Sentinela', emoji: '⚔️', baseStats: { vida: 100, forca: 14, defesa: 16, velocidade: 10 }, attacks: [{ name: 'Corte', power: 15, maxPP: 7 }, { name: 'Escudo Bash', power: 12, maxPP: 8 }] },
]

const bossesBase = [
  { name: 'Lich da Cripta', emoji: '🧟', baseStats: { vida: 200, forca: 20, defesa: 14, velocidade: 14 }, attacks: [{ name: 'Raio Necrótico', power: 22, maxPP: 6 }, { name: 'Drenar Alma', power: 18, maxPP: 7 }, { name: 'Explosão Sombria', power: 30, maxPP: 3 }, { name: 'Invocar Mortos', power: 14, maxPP: 5 }] },
  { name: 'Verme das Profundezas', emoji: '🪱', baseStats: { vida: 250, forca: 18, defesa: 20, velocidade: 8 }, attacks: [{ name: 'Engolir', power: 26, maxPP: 4 }, { name: 'Ácido', power: 20, maxPP: 6 }, { name: 'Terremoto', power: 22, maxPP: 5 }, { name: 'Constrição', power: 16, maxPP: 7 }] },
  { name: 'Kraken Abissal', emoji: '🐙', baseStats: { vida: 220, forca: 22, defesa: 12, velocidade: 16 }, attacks: [{ name: 'Tentáculo', power: 20, maxPP: 7 }, { name: 'Maré Negra', power: 26, maxPP: 4 }, { name: 'Tinta Cegante', power: 14, maxPP: 6 }, { name: 'Esmagar', power: 30, maxPP: 3 }] },
  { name: 'Necromante Supremo', emoji: '🧙', baseStats: { vida: 180, forca: 26, defesa: 10, velocidade: 18 }, attacks: [{ name: 'Bola Sombria', power: 24, maxPP: 6 }, { name: 'Maldição Fatal', power: 30, maxPP: 3 }, { name: 'Drenar Vida', power: 18, maxPP: 6, tipo: 'cura', curaPercent: 0.08 }, { name: 'Explosão Arcana', power: 28, maxPP: 4 }] },
  { name: 'Titã de Pedra', emoji: '🏔️', baseStats: { vida: 300, forca: 20, defesa: 28, velocidade: 4 }, attacks: [{ name: 'Punho Colossal', power: 28, maxPP: 5 }, { name: 'Avalanche', power: 22, maxPP: 6 }, { name: 'Pisar', power: 18, maxPP: 7 }, { name: 'Fúria da Terra', power: 34, maxPP: 3 }] },
  { name: 'General Sombrio', emoji: '🦇', baseStats: { vida: 240, forca: 24, defesa: 18, velocidade: 16 }, attacks: [{ name: 'Lâmina Sombria', power: 24, maxPP: 6 }, { name: 'Comando Mortal', power: 20, maxPP: 7 }, { name: 'Execução', power: 34, maxPP: 3 }, { name: 'Aura Negra', power: 18, maxPP: 5 }] },
  { name: 'Fênix Corrompida', emoji: '🔥', baseStats: { vida: 220, forca: 28, defesa: 14, velocidade: 20 }, attacks: [{ name: 'Chama Eterna', power: 28, maxPP: 5 }, { name: 'Renascimento', power: 0, maxPP: 2, tipo: 'cura', curaPercent: 0.15 }, { name: 'Explosão Solar', power: 32, maxPP: 4 }, { name: 'Cinzas', power: 20, maxPP: 6 }] },
  { name: 'Archdemônio', emoji: '👿', baseStats: { vida: 280, forca: 26, defesa: 20, velocidade: 18 }, attacks: [{ name: 'Fogo Infernal', power: 28, maxPP: 5 }, { name: 'Garras do Abismo', power: 24, maxPP: 6 }, { name: 'Pacto de Sangue', power: 36, maxPP: 3 }, { name: 'Corrupção', power: 20, maxPP: 6 }] },
  { name: 'Arauto do Vazio', emoji: '🌀', baseStats: { vida: 260, forca: 30, defesa: 16, velocidade: 22 }, attacks: [{ name: 'Vazio Absoluto', power: 32, maxPP: 4 }, { name: 'Distorção', power: 26, maxPP: 5 }, { name: 'Aniquilar', power: 38, maxPP: 3 }, { name: 'Pulso Arcano', power: 22, maxPP: 6 }] },
  { name: 'Deus do Caos', emoji: '💥', baseStats: { vida: 350, forca: 32, defesa: 22, velocidade: 20 }, attacks: [{ name: 'Caos Absoluto', power: 36, maxPP: 4 }, { name: 'Destruição Total', power: 42, maxPP: 2 }, { name: 'Garras Divinas', power: 28, maxPP: 6 }, { name: 'Regeneração Caótica', power: 0, maxPP: 3, tipo: 'cura', curaPercent: 0.10 }] },
]

export function getDungeonEnemies(dungeonId) {
  const dungeon = dungeons.find(d => d.id === dungeonId)
  if (!dungeon) return []
  return inimigosBase.map(e => ({ ...e, id: `dng_${e.name.toLowerCase().replace(/\s/g, '_')}` }))
}

export function getDungeonBoss(dungeonId) {
  const idx = dungeonId - 1
  return { ...bossesBase[idx], id: `dng_boss_${dungeonId}`, isBoss: true }
}
