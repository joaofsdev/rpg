export const areas = [
  {
    id: 'cemiterio',
    name: 'Cemitério Antigo',
    emoji: '⚰️',
    tema: 'lápides, névoa cinza, ossos espalhados',
    cores: { bg: '#1a1a1a', accent: '#6b7280' },
    nivelMin: 1,
    nivelMax: 10,
    inimigos: [
      {
        id: 'esqueleto_fraco', name: 'Esqueleto Errante', emoji: '💀',
        baseStats: { vida: 65, forca: 11, defesa: 6, velocidade: 14 },
        attacks: [
          { name: 'Golpe Ossudo', power: 10, maxPP: 8 },
          { name: 'Arranhão', power: 7, maxPP: 10 },
        ],
      },
      {
        id: 'zumbi_fraco', name: 'Zumbi Rastejante', emoji: '🧟',
        baseStats: { vida: 80, forca: 13, defesa: 8, velocidade: 6 },
        attacks: [
          { name: 'Mordida Podre', power: 12, maxPP: 7 },
          { name: 'Garras Infectas', power: 9, maxPP: 9 },
        ],
      },
      {
        id: 'rato_tumba', name: 'Rato de Tumba', emoji: '🐀',
        baseStats: { vida: 50, forca: 10, defesa: 4, velocidade: 22 },
        attacks: [
          { name: 'Mordida Rápida', power: 9, maxPP: 9 },
          { name: 'Enxame', power: 14, maxPP: 4 },
        ],
      },
      {
        id: 'fantasma_menor', name: 'Fantasma Menor', emoji: '👻',
        baseStats: { vida: 55, forca: 14, defesa: 3, velocidade: 18 },
        attacks: [
          { name: 'Toque Gélido', power: 13, maxPP: 6 },
          { name: 'Lamento', power: 16, maxPP: 4 },
        ],
      },
      {
        id: 'coveiro', name: 'Coveiro Maldito', emoji: '⛏️',
        baseStats: { vida: 75, forca: 12, defesa: 10, velocidade: 10 },
        attacks: [
          { name: 'Pá Enferrujada', power: 11, maxPP: 8 },
          { name: 'Golpe Pesado', power: 15, maxPP: 5 },
        ],
      },
    ],
    boss: {
      id: 'guardiao_cripta', name: 'Guardião da Cripta', emoji: '🦴',
      baseStats: { vida: 200, forca: 18, defesa: 14, velocidade: 10 },
      attacks: [
        { name: 'Espada Enferrujada', power: 16, maxPP: 7 },
        { name: 'Invocar Ossos', power: 20, maxPP: 5 },
        { name: 'Grito dos Mortos', power: 24, maxPP: 3 },
        { name: 'Regeneração Necrótica', power: 0, maxPP: 3, tipo: 'cura', curaPercent: 0.08 },
      ],
    },
  },
  {
    id: 'minas',
    name: 'Minas Profundas',
    emoji: '⛏️',
    tema: 'pedra escura, cristais, trilhos enferrujados',
    cores: { bg: '#1a1a2e', accent: '#4a4e69' },
    nivelMin: 11,
    nivelMax: 20,
    inimigos: [
      {
        id: 'golem_pedra', name: 'Golem de Pedra', emoji: '🗿',
        baseStats: { vida: 140, forca: 16, defesa: 20, velocidade: 5 },
        attacks: [
          { name: 'Punho de Pedra', power: 18, maxPP: 6 },
          { name: 'Terremoto', power: 14, maxPP: 7 },
        ],
      },
      {
        id: 'mineiro_morto', name: 'Mineiro Morto-Vivo', emoji: '⛏️',
        baseStats: { vida: 100, forca: 14, defesa: 12, velocidade: 10 },
        attacks: [
          { name: 'Picareta', power: 15, maxPP: 7 },
          { name: 'Explosão de Gás', power: 20, maxPP: 4 },
        ],
      },
      {
        id: 'morcego_mina', name: 'Morcego das Minas', emoji: '🦇',
        baseStats: { vida: 70, forca: 14, defesa: 6, velocidade: 22 },
        attacks: [
          { name: 'Mordida Sônica', power: 13, maxPP: 7 },
          { name: 'Grito Ultrassônico', power: 18, maxPP: 4 },
        ],
      },
      {
        id: 'aranha_mina', name: 'Aranha das Cavernas', emoji: '🕷️',
        baseStats: { vida: 85, forca: 16, defesa: 8, velocidade: 18 },
        attacks: [
          { name: 'Picada Venenosa', power: 16, maxPP: 6 },
          { name: 'Teia Pegajosa', power: 10, maxPP: 8 },
        ],
      },
      {
        id: 'troll_pedra', name: 'Troll das Rochas', emoji: '🪨',
        baseStats: { vida: 130, forca: 15, defesa: 18, velocidade: 6 },
        attacks: [
          { name: 'Esmagamento', power: 18, maxPP: 5 },
          { name: 'Arremesso de Pedra', power: 14, maxPP: 6 },
        ],
      },
    ],
    boss: {
      id: 'rei_minas', name: 'Rei das Minas', emoji: '👹',
      baseStats: { vida: 300, forca: 20, defesa: 22, velocidade: 8 },
      attacks: [
        { name: 'Martelada Real', power: 22, maxPP: 6 },
        { name: 'Avalanche', power: 28, maxPP: 3 },
        { name: 'Rugido', power: 14, maxPP: 7 },
        { name: 'Regeneração Troll', power: 0, maxPP: 3, tipo: 'cura', curaPercent: 0.08 },
      ],
    },
  },
  {
    id: 'costa',
    name: 'Costa Submersa',
    emoji: '🌊',
    tema: 'azul profundo, corais, ruínas submersas',
    cores: { bg: '#0a1a2e', accent: '#0ea5e9' },
    nivelMin: 21,
    nivelMax: 30,
    inimigos: [
      {
        id: 'sereia_corrupta', name: 'Sereia Corrompida', emoji: '🧜',
        baseStats: { vida: 100, forca: 18, defesa: 10, velocidade: 16 },
        attacks: [
          { name: 'Canto Hipnótico', power: 18, maxPP: 6 },
          { name: 'Garras Marinhas', power: 14, maxPP: 7 },
        ],
      },
      {
        id: 'caranguejo', name: 'Caranguejo Colossal', emoji: '🦀',
        baseStats: { vida: 140, forca: 16, defesa: 22, velocidade: 6 },
        attacks: [
          { name: 'Pinça Trituradora', power: 20, maxPP: 5 },
          { name: 'Carapaça', power: 10, maxPP: 8 },
        ],
      },
      {
        id: 'agua_viva', name: 'Água-Viva Gigante', emoji: '🪼',
        baseStats: { vida: 75, forca: 20, defesa: 4, velocidade: 14 },
        attacks: [
          { name: 'Choque Elétrico', power: 20, maxPP: 5 },
          { name: 'Tentáculos', power: 16, maxPP: 6 },
        ],
      },
      {
        id: 'pirata_morto', name: 'Pirata Morto-Vivo', emoji: '☠️',
        baseStats: { vida: 110, forca: 17, defesa: 12, velocidade: 14 },
        attacks: [
          { name: 'Sabre Enferrujado', power: 17, maxPP: 6 },
          { name: 'Canhão Fantasma', power: 22, maxPP: 4 },
        ],
      },
      {
        id: 'elemental_agua', name: 'Elemental de Água', emoji: '💧',
        baseStats: { vida: 90, forca: 19, defesa: 8, velocidade: 18 },
        attacks: [
          { name: 'Jato de Água', power: 19, maxPP: 6 },
          { name: 'Maré', power: 24, maxPP: 4 },
        ],
      },
    ],
    boss: {
      id: 'leviata', name: 'Leviatã Menor', emoji: '🐙',
      baseStats: { vida: 380, forca: 22, defesa: 16, velocidade: 14 },
      attacks: [
        { name: 'Tentáculo Esmagador', power: 24, maxPP: 6 },
        { name: 'Maré Negra', power: 28, maxPP: 4 },
        { name: 'Tinta Cegante', power: 16, maxPP: 7 },
        { name: 'Vórtice', power: 32, maxPP: 3 },
      ],
    },
  },
  {
    id: 'planicie_mortos',
    name: 'Planície dos Mortos',
    emoji: '🪦',
    tema: 'terra cinza, céu vermelho, torres distantes',
    cores: { bg: '#1a0f0f', accent: '#7f1d1d' },
    nivelMin: 31,
    nivelMax: 40,
    inimigos: [
      {
        id: 'necromante', name: 'Necromante Aprendiz', emoji: '🧙',
        baseStats: { vida: 90, forca: 22, defesa: 8, velocidade: 14 },
        attacks: [
          { name: 'Raio Necrótico', power: 22, maxPP: 5 },
          { name: 'Drenar Vida', power: 18, maxPP: 6 },
        ],
      },
      {
        id: 'cavaleiro_morto', name: 'Cavaleiro Morto-Vivo', emoji: '⚔️',
        baseStats: { vida: 150, forca: 18, defesa: 20, velocidade: 10 },
        attacks: [
          { name: 'Espada Amaldiçoada', power: 20, maxPP: 6 },
          { name: 'Escudo Sombrio', power: 12, maxPP: 8 },
        ],
      },
      {
        id: 'banshee', name: 'Banshee', emoji: '👻',
        baseStats: { vida: 80, forca: 24, defesa: 5, velocidade: 20 },
        attacks: [
          { name: 'Grito Fatal', power: 24, maxPP: 5 },
          { name: 'Toque Espectral', power: 18, maxPP: 6 },
        ],
      },
      {
        id: 'abominacao', name: 'Abominação', emoji: '🧟‍♂️',
        baseStats: { vida: 170, forca: 20, defesa: 14, velocidade: 6 },
        attacks: [
          { name: 'Esmagar', power: 22, maxPP: 5 },
          { name: 'Vômito Ácido', power: 18, maxPP: 6 },
        ],
      },
      {
        id: 'corvo_morte', name: 'Corvo da Morte', emoji: '🐦‍⬛',
        baseStats: { vida: 70, forca: 20, defesa: 6, velocidade: 24 },
        attacks: [
          { name: 'Bicada Sombria', power: 20, maxPP: 6 },
          { name: 'Enxame Negro', power: 26, maxPP: 3 },
        ],
      },
    ],
    boss: {
      id: 'senhor_mortos', name: 'Senhor dos Mortos', emoji: '💀',
      baseStats: { vida: 420, forca: 26, defesa: 18, velocidade: 14 },
      attacks: [
        { name: 'Explosão Necrótica', power: 28, maxPP: 5 },
        { name: 'Invocar Horda', power: 18, maxPP: 6 },
        { name: 'Drenar Alma', power: 22, maxPP: 5, tipo: 'cura', curaPercent: 0.06 },
        { name: 'Sentença de Morte', power: 34, maxPP: 3 },
      ],
      especial: { tipo: 'ressurreicao', vidaPercent: 0.4 },
    },
  },
  {
    id: 'abismo',
    name: 'Abismo das Sombras',
    emoji: '🕳️',
    tema: 'escuridão total, olhos brilhantes, vazio',
    cores: { bg: '#0a0a14', accent: '#312e81' },
    nivelMin: 41,
    nivelMax: 50,
    inimigos: [
      {
        id: 'sombra_viva', name: 'Sombra Viva', emoji: '🌑',
        baseStats: { vida: 100, forca: 24, defesa: 6, velocidade: 22 },
        attacks: [
          { name: 'Lâmina Sombria', power: 24, maxPP: 5 },
          { name: 'Mergulho nas Trevas', power: 18, maxPP: 7 },
        ],
      },
      {
        id: 'olho_abismo', name: 'Olho do Abismo', emoji: '👁️',
        baseStats: { vida: 80, forca: 26, defesa: 4, velocidade: 16 },
        attacks: [
          { name: 'Raio Ocular', power: 26, maxPP: 5 },
          { name: 'Hipnose', power: 20, maxPP: 6 },
        ],
      },
      {
        id: 'verme_abissal', name: 'Verme Abissal', emoji: '🪱',
        baseStats: { vida: 160, forca: 20, defesa: 18, velocidade: 6 },
        attacks: [
          { name: 'Engolir', power: 22, maxPP: 5 },
          { name: 'Ácido', power: 18, maxPP: 6 },
        ],
      },
      {
        id: 'sussurrador', name: 'Sussurrador', emoji: '🫥',
        baseStats: { vida: 90, forca: 22, defesa: 8, velocidade: 20 },
        attacks: [
          { name: 'Sussurro Enlouquecedor', power: 22, maxPP: 6 },
          { name: 'Toque do Vazio', power: 28, maxPP: 3 },
        ],
      },
      {
        id: 'aranha_sombria', name: 'Aranha das Sombras', emoji: '🕷️',
        baseStats: { vida: 110, forca: 22, defesa: 12, velocidade: 18 },
        attacks: [
          { name: 'Teia Sombria', power: 20, maxPP: 6 },
          { name: 'Picada Abissal', power: 26, maxPP: 4 },
        ],
      },
    ],
    boss: {
      id: 'devorador', name: 'Devorador do Abismo', emoji: '🕳️',
      baseStats: { vida: 500, forca: 28, defesa: 20, velocidade: 12 },
      attacks: [
        { name: 'Vazio Absoluto', power: 30, maxPP: 5 },
        { name: 'Devorar', power: 36, maxPP: 3 },
        { name: 'Tentáculos Sombrios', power: 24, maxPP: 6 },
        { name: 'Regeneração Abissal', power: 0, maxPP: 3, tipo: 'cura', curaPercent: 0.07 },
      ],
    },
  },
  {
    id: 'fortaleza',
    name: 'Terras da Fortaleza',
    emoji: '🏚️',
    tema: 'ruínas militares, céu nublado, soldados caídos',
    cores: { bg: '#1a1a1a', accent: '#525252' },
    nivelMin: 51,
    nivelMax: 60,
    inimigos: [
      {
        id: 'soldado_sombrio', name: 'Soldado Sombrio', emoji: '⚔️',
        baseStats: { vida: 140, forca: 22, defesa: 18, velocidade: 12 },
        attacks: [
          { name: 'Lança Sombria', power: 22, maxPP: 6 },
          { name: 'Escudo Bash', power: 16, maxPP: 7 },
        ],
      },
      {
        id: 'arqueiro_negro', name: 'Arqueiro Negro', emoji: '🏹',
        baseStats: { vida: 100, forca: 26, defesa: 10, velocidade: 20 },
        attacks: [
          { name: 'Flecha Negra', power: 26, maxPP: 5 },
          { name: 'Chuva de Flechas', power: 22, maxPP: 6 },
        ],
      },
      {
        id: 'cavaleiro_negro', name: 'Cavaleiro Negro', emoji: '🛡️',
        baseStats: { vida: 170, forca: 20, defesa: 24, velocidade: 8 },
        attacks: [
          { name: 'Espada Pesada', power: 24, maxPP: 5 },
          { name: 'Investida', power: 20, maxPP: 6 },
        ],
      },
      {
        id: 'mago_guerra', name: 'Mago de Guerra', emoji: '🧙‍♂️',
        baseStats: { vida: 90, forca: 28, defesa: 8, velocidade: 16 },
        attacks: [
          { name: 'Bola de Fogo', power: 28, maxPP: 5 },
          { name: 'Raio', power: 22, maxPP: 6 },
        ],
      },
      {
        id: 'sentinela_sombria', name: 'Sentinela Sombria', emoji: '🗡️',
        baseStats: { vida: 130, forca: 24, defesa: 16, velocidade: 14 },
        attacks: [
          { name: 'Corte Duplo', power: 24, maxPP: 6 },
          { name: 'Execução', power: 30, maxPP: 3 },
        ],
      },
    ],
    boss: {
      id: 'general_sombrio', name: 'General da Fortaleza', emoji: '🦇',
      baseStats: { vida: 550, forca: 28, defesa: 22, velocidade: 14 },
      attacks: [
        { name: 'Lâmina do Comando', power: 28, maxPP: 5 },
        { name: 'Grito de Guerra', power: 20, maxPP: 7 },
        { name: 'Execução Militar', power: 36, maxPP: 3 },
        { name: 'Aura Sombria', power: 24, maxPP: 5 },
      ],
    },
  },
  {
    id: 'vulcao',
    name: 'Montanha Vulcânica',
    emoji: '🌋',
    tema: 'lava, cinzas, calor extremo, pedras incandescentes',
    cores: { bg: '#2e0a0a', accent: '#dc2626' },
    nivelMin: 61,
    nivelMax: 70,
    inimigos: [
      {
        id: 'elemental_fogo', name: 'Elemental de Fogo', emoji: '🔥',
        baseStats: { vida: 120, forca: 28, defesa: 10, velocidade: 18 },
        attacks: [
          { name: 'Explosão Ígnea', power: 28, maxPP: 5 },
          { name: 'Chama Viva', power: 22, maxPP: 6 },
        ],
      },
      {
        id: 'salamandra', name: 'Salamandra de Lava', emoji: '🦎',
        baseStats: { vida: 140, forca: 24, defesa: 16, velocidade: 14 },
        attacks: [
          { name: 'Cuspe de Lava', power: 26, maxPP: 5 },
          { name: 'Cauda Flamejante', power: 20, maxPP: 7 },
        ],
      },
      {
        id: 'golem_magma', name: 'Golem de Magma', emoji: '🗿',
        baseStats: { vida: 180, forca: 22, defesa: 22, velocidade: 5 },
        attacks: [
          { name: 'Punho Incandescente', power: 24, maxPP: 5 },
          { name: 'Erupção', power: 30, maxPP: 3 },
        ],
      },
      {
        id: 'fenix_menor', name: 'Fênix Menor', emoji: '🐦‍🔥',
        baseStats: { vida: 100, forca: 26, defesa: 8, velocidade: 22 },
        attacks: [
          { name: 'Chama Eterna', power: 26, maxPP: 5 },
          { name: 'Renascimento', power: 0, maxPP: 2, tipo: 'cura', curaPercent: 0.10 },
        ],
      },
      {
        id: 'cultista_fogo', name: 'Cultista do Fogo', emoji: '🔥',
        baseStats: { vida: 110, forca: 26, defesa: 10, velocidade: 16 },
        attacks: [
          { name: 'Fogo Profano', power: 26, maxPP: 5 },
          { name: 'Sacrifício Ígneo', power: 32, maxPP: 3 },
        ],
      },
    ],
    boss: {
      id: 'senhor_vulcao', name: 'Senhor do Vulcão', emoji: '🌋',
      baseStats: { vida: 600, forca: 30, defesa: 20, velocidade: 14 },
      attacks: [
        { name: 'Erupção Total', power: 32, maxPP: 4 },
        { name: 'Banho de Lava', power: 28, maxPP: 5 },
        { name: 'Punho de Magma', power: 24, maxPP: 6 },
        { name: 'Regeneração Ígnea', power: 0, maxPP: 3, tipo: 'cura', curaPercent: 0.06 },
      ],
    },
  },
  {
    id: 'deserto_infernal',
    name: 'Deserto Infernal',
    emoji: '👿',
    tema: 'areia vermelha, portais demoníacos, céu em chamas',
    cores: { bg: '#2e0a1a', accent: '#be123c' },
    nivelMin: 71,
    nivelMax: 80,
    inimigos: [
      {
        id: 'demonio_menor', name: 'Demônio Menor', emoji: '😈',
        baseStats: { vida: 140, forca: 26, defesa: 14, velocidade: 18 },
        attacks: [
          { name: 'Garra Infernal', power: 26, maxPP: 6 },
          { name: 'Chama Negra', power: 30, maxPP: 4 },
        ],
      },
      {
        id: 'succubus', name: 'Súcubo', emoji: '😈',
        baseStats: { vida: 100, forca: 30, defesa: 8, velocidade: 22 },
        attacks: [
          { name: 'Sedução Fatal', power: 28, maxPP: 5 },
          { name: 'Beijo da Morte', power: 34, maxPP: 3 },
        ],
      },
      {
        id: 'imp', name: 'Imp Flamejante', emoji: '👹',
        baseStats: { vida: 80, forca: 28, defesa: 6, velocidade: 24 },
        attacks: [
          { name: 'Bola de Fogo', power: 28, maxPP: 5 },
          { name: 'Explosão Demoníaca', power: 32, maxPP: 3 },
        ],
      },
      {
        id: 'cerbero', name: 'Cérbero', emoji: '🐕',
        baseStats: { vida: 160, forca: 24, defesa: 18, velocidade: 14 },
        attacks: [
          { name: 'Mordida Tripla', power: 26, maxPP: 5 },
          { name: 'Bafo Infernal', power: 30, maxPP: 4 },
        ],
      },
      {
        id: 'alma_condenada', name: 'Alma Condenada', emoji: '🔥',
        baseStats: { vida: 90, forca: 28, defesa: 6, velocidade: 20 },
        attacks: [
          { name: 'Tormento', power: 28, maxPP: 5 },
          { name: 'Explosão de Almas', power: 34, maxPP: 3 },
        ],
      },
    ],
    boss: {
      id: 'principe_demonio', name: 'Príncipe Demoníaco', emoji: '👿',
      baseStats: { vida: 680, forca: 32, defesa: 22, velocidade: 16 },
      attacks: [
        { name: 'Fogo Infernal', power: 32, maxPP: 5 },
        { name: 'Garras do Abismo', power: 28, maxPP: 6 },
        { name: 'Pacto de Sangue', power: 38, maxPP: 3 },
        { name: 'Corrupção', power: 24, maxPP: 5 },
      ],
      especial: { tipo: 'ressurreicao', vidaPercent: 0.3 },
    },
  },
  {
    id: 'floresta_arcana',
    name: 'Floresta Arcana',
    emoji: '🔮',
    tema: 'árvores cristalinas, runas flutuantes, energia mágica',
    cores: { bg: '#1a0a2e', accent: '#7c3aed' },
    nivelMin: 81,
    nivelMax: 90,
    inimigos: [
      {
        id: 'golem_arcano', name: 'Golem Arcano', emoji: '🗿',
        baseStats: { vida: 180, forca: 26, defesa: 22, velocidade: 8 },
        attacks: [
          { name: 'Punho Arcano', power: 28, maxPP: 5 },
          { name: 'Pulso Mágico', power: 24, maxPP: 6 },
        ],
      },
      {
        id: 'fada_corrupta', name: 'Fada Corrompida', emoji: '🧚',
        baseStats: { vida: 80, forca: 32, defesa: 6, velocidade: 26 },
        attacks: [
          { name: 'Raio Arcano', power: 32, maxPP: 4 },
          { name: 'Encantamento', power: 26, maxPP: 6 },
        ],
      },
      {
        id: 'treant_magico', name: 'Treant Mágico', emoji: '🌳',
        baseStats: { vida: 200, forca: 24, defesa: 20, velocidade: 6 },
        attacks: [
          { name: 'Raízes Arcanas', power: 26, maxPP: 5 },
          { name: 'Explosão de Mana', power: 32, maxPP: 3 },
        ],
      },
      {
        id: 'elemental_arcano', name: 'Elemental Arcano', emoji: '✨',
        baseStats: { vida: 110, forca: 30, defesa: 10, velocidade: 20 },
        attacks: [
          { name: 'Descarga Mágica', power: 30, maxPP: 5 },
          { name: 'Distorção', power: 26, maxPP: 6 },
        ],
      },
      {
        id: 'mago_selvagem', name: 'Mago Selvagem', emoji: '🧙',
        baseStats: { vida: 100, forca: 32, defesa: 8, velocidade: 18 },
        attacks: [
          { name: 'Meteoro Arcano', power: 32, maxPP: 4 },
          { name: 'Dreno de Mana', power: 24, maxPP: 6 },
        ],
      },
    ],
    boss: {
      id: 'arauto_arcano', name: 'Arauto do Nexus', emoji: '🔮',
      baseStats: { vida: 720, forca: 34, defesa: 20, velocidade: 18 },
      attacks: [
        { name: 'Vazio Arcano', power: 34, maxPP: 4 },
        { name: 'Distorção Temporal', power: 28, maxPP: 6 },
        { name: 'Aniquilar', power: 40, maxPP: 3 },
        { name: 'Absorção Mágica', power: 0, maxPP: 3, tipo: 'cura', curaPercent: 0.08 },
      ],
    },
  },
  {
    id: 'campos_caos',
    name: 'Campos do Caos',
    emoji: '👑',
    tema: 'realidade distorcida, céu fragmentado, energia caótica',
    cores: { bg: '#1a0a0a', accent: '#eab308' },
    nivelMin: 91,
    nivelMax: 100,
    inimigos: [
      {
        id: 'aberracao', name: 'Aberração Caótica', emoji: '🌀',
        baseStats: { vida: 160, forca: 30, defesa: 16, velocidade: 20 },
        attacks: [
          { name: 'Distorção Caótica', power: 30, maxPP: 5 },
          { name: 'Fragmentar', power: 26, maxPP: 6 },
        ],
      },
      {
        id: 'titan_caos', name: 'Titã do Caos', emoji: '🏔️',
        baseStats: { vida: 220, forca: 28, defesa: 24, velocidade: 6 },
        attacks: [
          { name: 'Punho Caótico', power: 30, maxPP: 5 },
          { name: 'Pisar Dimensional', power: 34, maxPP: 3 },
        ],
      },
      {
        id: 'dragao_caos', name: 'Dragão do Caos', emoji: '🐉',
        baseStats: { vida: 180, forca: 32, defesa: 18, velocidade: 16 },
        attacks: [
          { name: 'Sopro Caótico', power: 32, maxPP: 4 },
          { name: 'Garras Dimensionais', power: 28, maxPP: 5 },
        ],
      },
      {
        id: 'anjo_caido', name: 'Anjo Caído', emoji: '😇',
        baseStats: { vida: 140, forca: 34, defesa: 12, velocidade: 22 },
        attacks: [
          { name: 'Lâmina Divina', power: 34, maxPP: 4 },
          { name: 'Julgamento', power: 28, maxPP: 5 },
        ],
      },
      {
        id: 'avatar_caos', name: 'Avatar do Caos', emoji: '💥',
        baseStats: { vida: 150, forca: 32, defesa: 14, velocidade: 20 },
        attacks: [
          { name: 'Explosão Caótica', power: 32, maxPP: 4 },
          { name: 'Aniquilação', power: 38, maxPP: 3 },
        ],
      },
    ],
    boss: {
      id: 'deus_caos', name: 'Emissário do Caos', emoji: '👑',
      baseStats: { vida: 850, forca: 36, defesa: 24, velocidade: 18 },
      attacks: [
        { name: 'Caos Absoluto', power: 38, maxPP: 4 },
        { name: 'Destruição Total', power: 44, maxPP: 2 },
        { name: 'Garras Divinas', power: 30, maxPP: 6 },
        { name: 'Regeneração Caótica', power: 0, maxPP: 3, tipo: 'cura', curaPercent: 0.08 },
      ],
      especial: { tipo: 'ressurreicao', vidaPercent: 0.5 },
    },
  },
]
