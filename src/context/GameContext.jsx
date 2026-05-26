import { createContext, useContext, useReducer, useEffect } from 'react'
import { xpParaProximoNivel, xpGanhoPorVitoria, calcularNivelInimigo, escalarAtributoInimigo } from '../utils/progressionFormulas'
import { calcularDano } from '../utils/battleFormulas'
import { escolherAtaqueInimigo } from '../utils/enemyAI'
import { characters } from '../data/characters'
import { enemies } from '../data/enemies'

const GameContext = createContext()
const STORAGE_KEY = 'rpg_dark_realms'

function criarEstadoInicial() {
  const personagens = {}
  characters.forEach(c => {
    personagens[c.id] = {
      nivel: 1,
      xp: 0,
      xpProximoNivel: xpParaProximoNivel(1),
      atributos: { ...c.baseStats },
    }
  })
  return {
    screen: 'TITLE',
    personagens,
    runAtiva: { personagemId: null, batalhasVencidas: 0, hpAtual: null, emAndamento: false },
    sessaoStats: { totalBatalhas: 0, vitorias: 0, derrotas: 0 },
    batalha: null,
    levelUpData: null,
  }
}

function loadState() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : criarEstadoInicial()
  } catch { return criarEstadoInicial() }
}

function gerarInimigo(batalhasVencidas, nivelPersonagem) {
  const nivelInimigo = calcularNivelInimigo(batalhasVencidas, nivelPersonagem)
  const template = enemies[Math.floor(Math.random() * enemies.length)]
  const stats = {
    vida: escalarAtributoInimigo(template.baseStats.vida, nivelInimigo),
    forca: escalarAtributoInimigo(template.baseStats.forca, nivelInimigo),
    defesa: escalarAtributoInimigo(template.baseStats.defesa, nivelInimigo),
    velocidade: escalarAtributoInimigo(template.baseStats.velocidade, nivelInimigo),
  }
  const attacks = template.attacks.map(a => ({ ...a, currentPP: a.maxPP }))
  return { ...template, nivel: nivelInimigo, stats, hpAtual: stats.vida, attacks }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload }

    case 'SELECT_CHARACTER': {
      const charId = action.payload
      const charData = characters.find(c => c.id === charId)
      const progresso = state.personagens[charId]
      const playerAttacks = charData.attacks.map(a => ({ ...a, currentPP: a.maxPP }))
      const enemy = gerarInimigo(0, progresso.nivel)
      const playerGoesFirst = progresso.atributos.velocidade >= enemy.stats.velocidade
      return {
        ...state,
        screen: 'BATTLE',
        runAtiva: { personagemId: charId, batalhasVencidas: 0, hpAtual: progresso.atributos.vida, emAndamento: true },
        batalha: {
          enemy,
          playerAttacks,
          log: [],
          turn: playerGoesFirst ? 'player' : 'enemy',
          battleNumber: 1,
          animating: false,
        },
      }
    }

    case 'PLAYER_ATTACK': {
      const { attackIndex } = action.payload
      const batalha = { ...state.batalha }
      const runAtiva = { ...state.runAtiva }
      const charId = runAtiva.personagemId
      const progresso = state.personagens[charId]
      const playerAttacks = batalha.playerAttacks.map(a => ({ ...a }))
      const enemy = { ...batalha.enemy, attacks: batalha.enemy.attacks.map(a => ({ ...a })) }
      const log = [...batalha.log]

      const ataque = playerAttacks[attackIndex]
      ataque.currentPP--

      const dano = calcularDano(ataque, progresso.atributos, enemy.stats)
      if (dano === null) {
        log.push(`${characters.find(c => c.id === charId).name} usou ${ataque.name}... ERROU!`)
        return { ...state, batalha: { ...batalha, playerAttacks, log, turn: 'enemy', animating: true } }
      }
      enemy.hpAtual = Math.max(0, enemy.hpAtual - dano)
      log.push(`${characters.find(c => c.id === charId).name} usou ${ataque.name}! -${dano} HP`)

      if (enemy.hpAtual <= 0) {
        log.push(`${enemy.name} foi derrotado!`)
        const xpGanho = xpGanhoPorVitoria(enemy.nivel)
        const personagens = { ...state.personagens }
        const p = { ...personagens[charId] }
        p.xp += xpGanho
        let niveisGanhos = 0
        while (p.xp >= p.xpProximoNivel) {
          p.xp -= p.xpProximoNivel
          p.nivel++
          p.xpProximoNivel = xpParaProximoNivel(p.nivel)
          niveisGanhos++
        }
        personagens[charId] = p
        const newRun = { ...runAtiva, batalhasVencidas: runAtiva.batalhasVencidas + 1 }
        const sessaoStats = { ...state.sessaoStats, totalBatalhas: state.sessaoStats.totalBatalhas + 1, vitorias: state.sessaoStats.vitorias + 1 }

        if (niveisGanhos > 0) {
          return {
            ...state, personagens, runAtiva: newRun, sessaoStats,
            screen: 'LEVEL_UP',
            levelUpData: { nivelAnterior: p.nivel - niveisGanhos, nivelNovo: p.nivel, pontosDisponiveis: niveisGanhos * 3, pontosDistribuidos: { vida: 0, forca: 0, defesa: 0, velocidade: 0 }, xpGanho },
            batalha: { ...batalha, enemy, playerAttacks, log },
          }
        }
        return {
          ...state, personagens, runAtiva: newRun, sessaoStats,
          screen: 'VICTORY',
          batalha: { ...batalha, enemy, playerAttacks, log, xpGanho },
        }
      }

      return { ...state, batalha: { ...batalha, enemy, playerAttacks, log, turn: 'enemy', animating: true } }
    }

    case 'ENEMY_ATTACK': {
      const batalha = { ...state.batalha }
      const runAtiva = { ...state.runAtiva }
      const charId = runAtiva.personagemId
      const progresso = state.personagens[charId]
      const enemy = { ...batalha.enemy, attacks: batalha.enemy.attacks.map(a => ({ ...a })) }
      const log = [...batalha.log]

      const ataque = escolherAtaqueInimigo(enemy.attacks)
      if (ataque.currentPP !== Infinity) {
        const idx = enemy.attacks.findIndex(a => a.name === ataque.name)
        if (idx >= 0) enemy.attacks[idx].currentPP--
      }

      const dano = calcularDano(ataque, enemy.stats, progresso.atributos)
      if (dano === null) {
        log.push(`${enemy.name} usou ${ataque.name}... ERROU!`)
        return { ...state, batalha: { ...batalha, enemy, log, turn: 'player', animating: false } }
      }
      const hpAtual = Math.max(0, runAtiva.hpAtual - dano)
      log.push(`${enemy.name} usou ${ataque.name}! -${dano} HP`)

      if (hpAtual <= 0) {
        log.push(`${characters.find(c => c.id === charId).name} foi derrotado...`)
        const sessaoStats = { ...state.sessaoStats, totalBatalhas: state.sessaoStats.totalBatalhas + 1, derrotas: state.sessaoStats.derrotas + 1 }
        return {
          ...state, runAtiva: { ...runAtiva, hpAtual: 0, emAndamento: false }, sessaoStats,
          screen: 'DEFEAT',
          batalha: { ...batalha, enemy, log, defeatedBy: enemy.name },
        }
      }

      return { ...state, runAtiva: { ...runAtiva, hpAtual }, batalha: { ...batalha, enemy, log, turn: 'player', animating: false } }
    }

    case 'DISTRIBUTE_POINT': {
      const { stat } = action.payload
      const ld = { ...state.levelUpData, pontosDistribuidos: { ...state.levelUpData.pontosDistribuidos } }
      ld.pontosDistribuidos[stat]++
      ld.pontosDisponiveis--
      return { ...state, levelUpData: ld }
    }

    case 'UNDISTRIBUTE_POINT': {
      const { stat } = action.payload
      const ld = { ...state.levelUpData, pontosDistribuidos: { ...state.levelUpData.pontosDistribuidos } }
      if (ld.pontosDistribuidos[stat] <= 0) return state
      ld.pontosDistribuidos[stat]--
      ld.pontosDisponiveis++
      return { ...state, levelUpData: ld }
    }

    case 'CONFIRM_LEVEL_UP': {
      const { levelUpData, runAtiva } = state
      const charId = runAtiva.personagemId
      const personagens = { ...state.personagens }
      const p = { ...personagens[charId], atributos: { ...personagens[charId].atributos } }
      const d = levelUpData.pontosDistribuidos
      p.atributos.vida += d.vida * 8
      p.atributos.forca += d.forca * 2
      p.atributos.defesa += d.defesa * 2
      p.atributos.velocidade += d.velocidade * 1
      personagens[charId] = p
      return {
        ...state, personagens, screen: 'VICTORY', levelUpData: null,
        runAtiva: { ...runAtiva, hpAtual: p.atributos.vida },
      }
    }

    case 'NEXT_BATTLE': {
      const { runAtiva } = state
      const charId = runAtiva.personagemId
      const charData = characters.find(c => c.id === charId)
      const progresso = state.personagens[charId]
      const enemy = gerarInimigo(runAtiva.batalhasVencidas, progresso.nivel)
      const playerAttacks = charData.attacks.map(a => ({ ...a, currentPP: a.maxPP }))
      const playerGoesFirst = progresso.atributos.velocidade >= enemy.stats.velocidade
      return {
        ...state,
        screen: 'BATTLE',
        runAtiva: { ...runAtiva, hpAtual: progresso.atributos.vida },
        batalha: {
          enemy, playerAttacks, log: [],
          turn: playerGoesFirst ? 'player' : 'enemy',
          battleNumber: runAtiva.batalhasVencidas + 1,
          animating: false,
        },
      }
    }

    case 'GAME_OVER':
      return { ...state, screen: 'GAME_OVER' }

    case 'RESTART_SAME': {
      const charId = state.runAtiva.personagemId
      const charData = characters.find(c => c.id === charId)
      const progresso = state.personagens[charId]
      const enemy = gerarInimigo(0, progresso.nivel)
      const playerAttacks = charData.attacks.map(a => ({ ...a, currentPP: a.maxPP }))
      const playerGoesFirst = progresso.atributos.velocidade >= enemy.stats.velocidade
      return {
        ...state, screen: 'BATTLE',
        runAtiva: { personagemId: charId, batalhasVencidas: 0, hpAtual: progresso.atributos.vida, emAndamento: true },
        batalha: { enemy, playerAttacks, log: [], turn: playerGoesFirst ? 'player' : 'enemy', battleNumber: 1, animating: false },
      }
    }

    case 'CHANGE_CHARACTER':
      return { ...state, screen: 'CHARACTER_SELECT', runAtiva: { personagemId: null, batalhasVencidas: 0, hpAtual: null, emAndamento: false }, batalha: null }

    case 'GO_TITLE':
      return { ...state, screen: 'TITLE', runAtiva: { personagemId: null, batalhasVencidas: 0, hpAtual: null, emAndamento: false }, batalha: null }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)
  useEffect(() => { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }, [state])
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() { return useContext(GameContext) }
