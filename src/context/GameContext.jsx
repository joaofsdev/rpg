import { createContext, useContext, useReducer, useEffect } from "react";
import { classes } from "../data/classes";
import { areas } from "../data/areas";
import { dungeons, getDungeonEnemies, getDungeonBoss } from "../data/dungeons";
import {
  xpParaProximoNivel,
  xpGanhoPorVitoria,
  calcularNivelInimigo,
  escalarAtributoInimigo,
  escalarAtributoBoss,
  escalarAtributoDungeon,
  escalarAtributoBossDungeon,
} from "../utils/progressionFormulas";
import {
  calcularDano,
  aplicarPassivo,
  aplicarReducaoDano,
  calcularAtributosFinais,
} from "../utils/battleFormulas";
import { escolherAtaqueInimigo } from "../utils/enemyAI";
import {
  gerarDrop,
  gerarItemArma,
  gerarItemArmadura,
  sortearRaridade,
} from "../data/itemGeneration";
import { getShop, buyItem, calcularPrecoVenda } from "../data/shop";

const GameContext = createContext();
const USERS_KEY = "rpg_users";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function criarEstadoInicial() {
  return {
    screen: "TITLE",
    currentUser: null,
    character: null,
    batalha: null,
    levelUpData: null,
    lootData: null,
    areaAtual: null,
    batalhaNumero: 0,
    modal: null,
    dungeonState: null,
    victorySource: null,
  };
}

function gerarInimigo(areaId, nivelJogador) {
  const area = areas.find((a) => a.id === areaId);
  const nivelInimigo =
    Math.floor(Math.random() * (area.nivelMax - area.nivelMin + 1)) +
    area.nivelMin;
  const template =
    area.inimigos[Math.floor(Math.random() * area.inimigos.length)];
  const stats = {
    vida: escalarAtributoInimigo(template.baseStats.vida, nivelInimigo),
    forca: escalarAtributoInimigo(template.baseStats.forca, nivelInimigo),
    defesa: escalarAtributoInimigo(template.baseStats.defesa, nivelInimigo),
    velocidade: escalarAtributoInimigo(
      template.baseStats.velocidade,
      nivelInimigo,
    ),
  };
  const attacks = template.attacks.map((a) => ({ ...a, currentPP: a.maxPP }));
  return {
    ...template,
    nivel: nivelInimigo,
    stats,
    hpAtual: stats.vida,
    attacks,
  };
}

function gerarBoss(areaId) {
  const area = areas.find((a) => a.id === areaId);
  const boss = area.boss;
  const nivel = area.nivelMax;
  const stats = {
    vida: escalarAtributoBoss(boss.baseStats.vida, nivel),
    forca: escalarAtributoBoss(boss.baseStats.forca, nivel),
    defesa: escalarAtributoBoss(boss.baseStats.defesa, nivel),
    velocidade: escalarAtributoBoss(boss.baseStats.velocidade, nivel),
  };
  const attacks = boss.attacks.map((a) => ({ ...a, currentPP: a.maxPP }));
  return {
    ...boss,
    nivel,
    stats,
    hpAtual: stats.vida,
    attacks,
    isBoss: true,
    ressuscitou: false,
  };
}

function getCharStats(character) {
  const classeData = classes.find((c) => c.id === character.classeId);
  return calcularAtributosFinais(
    classeData.baseStats,
    character.pontosDistribuidos,
    character.equipamentos,
  );
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.payload };

    case "LOGIN": {
      const { username } = action.payload;
      const users = getUsers();
      const user = users[username];
      const character = user.character;
      if (character && !character.dungeonsDesbloqueadas) {
        character.dungeonsDesbloqueadas = [1];
        character.dungeonsConcluidas = [];
        users[username].character = character;
        saveUsers(users);
      }
      if (character && character.ouro === undefined) {
        character.ouro = 0;
        users[username].character = character;
        saveUsers(users);
      }
      return {
        ...state,
        currentUser: username,
        character,
        screen: character ? "AREA_MAP" : "CLASS_SELECT",
      };
    }

    case "LOGOUT":
      return criarEstadoInicial();

    case "SELECT_CLASS": {
      const { classeId } = action.payload;
      const classeData = classes.find((c) => c.id === classeId);
      const character = {
        classeId,
        nivel: 1,
        xp: 0,
        xpProximoNivel: xpParaProximoNivel(1),
        pontosDistribuidos: { vida: 0, forca: 0, defesa: 0, velocidade: 0 },
        hpAtual: classeData.baseStats.vida,
        areasDesbloqueadas: ["cemiterio"],
        areasConcluidas: [],
        batalhasVencidas: 0,
        bossesDerotados: [],
        inventario: [],
        equipamentos: {
          capacete: null,
          peitoral: null,
          luvas: null,
          botas: null,
          arma: null,
        },
        dungeonsDesbloqueadas: [1],
        dungeonsConcluidas: [],
        ouro: 0,
      };
      const users = getUsers();
      users[state.currentUser].character = character;
      saveUsers(users);
      return { ...state, character, screen: "AREA_MAP" };
    }

    case "ENTER_AREA": {
      const { areaId } = action.payload;
      return {
        ...state,
        areaAtual: areaId,
        batalhaNumero: 1,
        screen: "BATTLE",
        ...iniciarBatalha(state.character, areaId),
      };
    }

    case "START_BATTLE": {
      return {
        ...state,
        ...iniciarBatalha(state.character, state.areaAtual),
        batalhaNumero: state.batalhaNumero + 1,
        screen: "BATTLE",
      };
    }

    case "START_BOSS": {
      return {
        ...state,
        screen: "BOSS_BATTLE",
        batalhaNumero: state.batalhaNumero + 1,
        ...iniciarBossBatalha(state.character, state.areaAtual),
      };
    }

    case "PLAYER_ATTACK": {
      const { attackIndex } = action.payload;
      const character = { ...state.character };
      const classeData = classes.find((c) => c.id === character.classeId);
      const batalha = {
        ...state.batalha,
        buffs: [...(state.batalha.buffs || [])],
      };
      const playerAttacks = batalha.playerAttacks.map((a) => ({ ...a }));
      const enemy = {
        ...batalha.enemy,
        attacks: batalha.enemy.attacks.map((a) => ({ ...a })),
      };
      const log = [...batalha.log];

      const baseStats = getCharStats(character);
      const stats = { ...baseStats };
      batalha.buffs.forEach((b) => {
        stats[b.stat] = (stats[b.stat] || 0) + b.valor;
      });

      const ataque = playerAttacks[attackIndex];
      if (ataque.currentPP <= 0) return state;
      ataque.currentPP--;

      // Buff de status
      if (ataque.tipo === "buff") {
        batalha.buffs.push({ ...ataque.buff });
        log.push(
          `Você usou ${ataque.name}! +${ataque.buff.valor} ${ataque.buff.stat} por ${ataque.buff.turnos} turnos`,
        );
        saveCharacter(state.currentUser, character);
        return {
          ...state,
          character,
          batalha: {
            ...batalha,
            playerAttacks,
            log,
            turn: "enemy",
            animating: true,
            primeiroAtaque: false,
          },
        };
      }

      // Canção de Cura (Bardo)
      if (ataque.tipo === "cura") {
        const cura = Math.floor(stats.vida * ataque.curaPercent);
        character.hpAtual = Math.min(stats.vida, character.hpAtual + cura);
        log.push(`Você usou ${ataque.name}! +${cura} HP`);
        saveCharacter(state.currentUser, character);
        return {
          ...state,
          character,
          batalha: {
            ...batalha,
            playerAttacks,
            log,
            turn: "enemy",
            animating: true,
            primeiroAtaque: false,
          },
        };
      }

      // Berserker (auto-dano)
      if (ataque.tipo === "auto_dano") {
        const autoDano = Math.floor(stats.vida * ataque.autoDanoPercent);
        character.hpAtual = Math.max(1, character.hpAtual - autoDano);
        log.push(`Você sacrificou ${autoDano} HP!`);
      }

      let dano = calcularDano(ataque, stats, enemy.stats);
      if (dano === null) {
        log.push(`Você usou ${ataque.name}... ERROU!`);
        return {
          ...state,
          character,
          batalha: {
            ...batalha,
            playerAttacks,
            enemy,
            log,
            turn: "enemy",
            animating: true,
            primeiroAtaque: false,
          },
        };
      }

      const contexto = {
        primeiroAtaque: batalha.primeiroAtaque,
        agiuPrimeiro: batalha.turn === "player" && batalha.primeiroAtaque,
        hpAtual: character.hpAtual,
        hpMax: stats.vida,
      };
      dano = aplicarPassivo(dano, ataque, classeData, contexto);
      enemy.hpAtual = Math.max(0, enemy.hpAtual - dano);
      log.push(`Você usou ${ataque.name}! -${dano} HP`);

      if (enemy.hpAtual <= 0) {
        // Boss ressurreição
        if (
          enemy.isBoss &&
          enemy.especial?.tipo === "ressurreicao" &&
          !enemy.ressuscitou
        ) {
          const vidaRes = Math.floor(
            enemy.stats.vida * enemy.especial.vidaPercent,
          );
          enemy.hpAtual = vidaRes;
          enemy.ressuscitou = true;
          log.push(`${enemy.name} ressurgiu com ${vidaRes} HP!`);
          return {
            ...state,
            character,
            batalha: {
              ...batalha,
              playerAttacks,
              enemy,
              log,
              turn: "enemy",
              animating: true,
              primeiroAtaque: false,
            },
          };
        }

        log.push(`${enemy.name} foi derrotado!`);
        const xpGanho = xpGanhoPorVitoria(enemy.nivel);
        const ouroGanho = Math.floor(
          (2 + enemy.nivel * 1.5) * (enemy.isBoss ? 3 : 1),
        );
        character.xp += xpGanho;
        character.ouro = (character.ouro || 0) + ouroGanho;
        character.batalhasVencidas++;
        log.push(`+${ouroGanho} ouro`);
        let niveisGanhos = 0;
        while (character.xp >= character.xpProximoNivel) {
          character.xp -= character.xpProximoNivel;
          character.nivel++;
          character.xpProximoNivel = xpParaProximoNivel(character.nivel);
          niveisGanhos++;
        }

        // Dungeon: avançar horda ou vitória final
        if (batalha.isDungeon) {
          saveCharacter(state.currentUser, character);
          const ds = state.dungeonState;
          const dungeon = dungeons.find((d) => d.id === ds.dungeonId);
          if (enemy.isBoss) {
            // Boss da dungeon derrotado = dungeon concluída
            if (niveisGanhos > 0) {
              return {
                ...state,
                character,
                screen: "LEVEL_UP",
                levelUpData: {
                  pontosDisponiveis: niveisGanhos * 3,
                  pontosDistribuidos: {
                    vida: 0,
                    forca: 0,
                    defesa: 0,
                    velocidade: 0,
                  },
                  xpGanho,
                  afterLevelUp: "DUNGEON_VICTORY",
                },
                batalha: { ...batalha, enemy, playerAttacks, log },
              };
            }
            return reducer(
              {
                ...state,
                character,
                batalha: { ...batalha, enemy, playerAttacks, log },
              },
              { type: "DUNGEON_VICTORY" },
            );
          }
          // Próxima horda
          if (ds.hordaAtual >= dungeon.hordas) {
            // Próxima é o boss
            if (niveisGanhos > 0) {
              return {
                ...state,
                character,
                screen: "LEVEL_UP",
                levelUpData: {
                  pontosDisponiveis: niveisGanhos * 3,
                  pontosDistribuidos: {
                    vida: 0,
                    forca: 0,
                    defesa: 0,
                    velocidade: 0,
                  },
                  xpGanho,
                  afterLevelUp: "DUNGEON_NEXT_HORDA",
                },
                batalha: { ...batalha, enemy, playerAttacks, log },
              };
            }
            return reducer(
              {
                ...state,
                character,
                batalha: { ...batalha, enemy, playerAttacks, log },
              },
              { type: "DUNGEON_NEXT_HORDA" },
            );
          }
          if (niveisGanhos > 0) {
            return {
              ...state,
              character,
              screen: "LEVEL_UP",
              levelUpData: {
                pontosDisponiveis: niveisGanhos * 3,
                pontosDistribuidos: {
                  vida: 0,
                  forca: 0,
                  defesa: 0,
                  velocidade: 0,
                },
                xpGanho,
                afterLevelUp: "DUNGEON_NEXT_HORDA",
              },
              batalha: { ...batalha, enemy, playerAttacks, log },
            };
          }
          return reducer(
            {
              ...state,
              character,
              batalha: { ...batalha, enemy, playerAttacks, log },
            },
            { type: "DUNGEON_NEXT_HORDA" },
          );
        }

        if (enemy.isBoss) {
          character.bossesDerotados.push(enemy.id);
          const area = areas.find((a) => a.id === state.areaAtual);
          if (!character.areasConcluidas.includes(state.areaAtual)) {
            character.areasConcluidas.push(state.areaAtual);
          }
          const areaIdx = areas.findIndex((a) => a.id === state.areaAtual);
          if (areaIdx < areas.length - 1) {
            const proxArea = areas[areaIdx + 1].id;
            if (!character.areasDesbloqueadas.includes(proxArea)) {
              character.areasDesbloqueadas.push(proxArea);
            }
          }
        }

        saveCharacter(state.currentUser, character);
        const loot = gerarDrop(enemy.nivel, enemy.isBoss);
        const victorySource = enemy.isBoss ? "area" : null;

        if (niveisGanhos > 0) {
          return {
            ...state,
            character,
            victorySource,
            screen: "LEVEL_UP",
            levelUpData: {
              pontosDisponiveis: niveisGanhos * 3,
              pontosDistribuidos: {
                vida: 0,
                forca: 0,
                defesa: 0,
                velocidade: 0,
              },
              xpGanho,
            },
            lootData: loot,
            batalha: { ...batalha, enemy, playerAttacks, log },
          };
        }
        if (loot) {
          return {
            ...state,
            character,
            victorySource,
            screen: "LOOT",
            lootData: loot,
            batalha: { ...batalha, enemy, playerAttacks, log },
          };
        }
        return {
          ...state,
          character,
          victorySource,
          screen: "VICTORY",
          batalha: { ...batalha, enemy, playerAttacks, log, xpGanho },
        };
      }

      // Passivo Bardo: recuperar PP
      if (
        classeData.passivo.tipo === "recuperar_pp" &&
        Math.random() < classeData.passivo.valor
      ) {
        const ataquesPossiveis = playerAttacks.filter(
          (a) => a.currentPP < a.maxPP,
        );
        if (ataquesPossiveis.length > 0) {
          const alvo =
            ataquesPossiveis[
              Math.floor(Math.random() * ataquesPossiveis.length)
            ];
          alvo.currentPP++;
          log.push(`♪ Recuperou 1 PP de ${alvo.name}!`);
        }
      }

      saveCharacter(state.currentUser, character);
      return {
        ...state,
        character,
        batalha: {
          ...batalha,
          playerAttacks,
          enemy,
          log,
          turn: "enemy",
          animating: true,
          primeiroAtaque: false,
        },
      };
    }

    case "ENEMY_ATTACK": {
      const character = { ...state.character };
      const classeData = classes.find((c) => c.id === character.classeId);
      const batalha = {
        ...state.batalha,
        buffs: [...(state.batalha.buffs || [])],
      };
      const enemy = {
        ...batalha.enemy,
        attacks: batalha.enemy.attacks.map((a) => ({ ...a })),
      };
      const log = [...batalha.log];

      // Aplicar buffs ativos nos stats defensivos
      const baseStats = getCharStats(character);
      const stats = { ...baseStats };
      batalha.buffs.forEach((b) => {
        stats[b.stat] = (stats[b.stat] || 0) + b.valor;
      });

      const ataque = escolherAtaqueInimigo(enemy.attacks);
      if (ataque.currentPP !== Infinity) {
        const idx = enemy.attacks.findIndex((a) => a.name === ataque.name);
        if (idx >= 0) enemy.attacks[idx].currentPP--;
      }

      // Cura do inimigo/boss
      if (ataque.tipo === "cura") {
        const cura = Math.floor(enemy.stats.vida * ataque.curaPercent);
        enemy.hpAtual = Math.min(enemy.stats.vida, enemy.hpAtual + cura);
        log.push(`${enemy.name} usou ${ataque.name}! +${cura} HP`);
        // Decrementar buffs
        batalha.buffs = batalha.buffs
          .map((b) => ({ ...b, turnos: b.turnos - 1 }))
          .filter((b) => b.turnos > 0);
        return {
          ...state,
          batalha: { ...batalha, enemy, log, turn: "player", animating: false },
        };
      }

      let dano = calcularDano(ataque, enemy.stats, stats);
      if (dano === null) {
        log.push(`${enemy.name} usou ${ataque.name}... ERROU!`);
        batalha.buffs = batalha.buffs
          .map((b) => ({ ...b, turnos: b.turnos - 1 }))
          .filter((b) => b.turnos > 0);
        return {
          ...state,
          batalha: {
            ...batalha,
            enemy,
            log,
            turn: "player",
            animating: false,
            primeiroAtaque: false,
          },
        };
      }
      dano = aplicarReducaoDano(dano, classeData);
      character.hpAtual = Math.max(0, character.hpAtual - dano);
      log.push(`${enemy.name} usou ${ataque.name}! -${dano} HP`);

      if (character.hpAtual <= 0) {
        log.push("Você foi derrotado...");
        saveCharacter(state.currentUser, character);
        if (batalha.isDungeon) {
          return {
            ...state,
            character,
            screen: "DEFEAT",
            batalha: { ...batalha, enemy, log, isDungeon: true },
          };
        }
        return {
          ...state,
          character,
          screen: "DEFEAT",
          batalha: { ...batalha, enemy, log },
        };
      }

      saveCharacter(state.currentUser, character);
      // Decrementar buffs ao fim do turno do inimigo
      batalha.buffs = batalha.buffs
        .map((b) => ({ ...b, turnos: b.turnos - 1 }))
        .filter((b) => b.turnos > 0);
      return {
        ...state,
        character,
        batalha: {
          ...batalha,
          enemy,
          log,
          turn: "player",
          animating: false,
          primeiroAtaque: false,
        },
      };
    }

    case "DISTRIBUTE_POINT": {
      const { stat } = action.payload;
      const ld = {
        ...state.levelUpData,
        pontosDistribuidos: { ...state.levelUpData.pontosDistribuidos },
      };
      if (ld.pontosDisponiveis <= 0) return state;
      ld.pontosDistribuidos[stat]++;
      ld.pontosDisponiveis--;
      return { ...state, levelUpData: ld };
    }

    case "UNDISTRIBUTE_POINT": {
      const { stat } = action.payload;
      const ld = {
        ...state.levelUpData,
        pontosDistribuidos: { ...state.levelUpData.pontosDistribuidos },
      };
      if (ld.pontosDistribuidos[stat] <= 0) return state;
      ld.pontosDistribuidos[stat]--;
      ld.pontosDisponiveis++;
      return { ...state, levelUpData: ld };
    }

    case "CONFIRM_LEVEL_UP": {
      const character = {
        ...state.character,
        pontosDistribuidos: { ...state.character.pontosDistribuidos },
      };
      const d = state.levelUpData.pontosDistribuidos;
      character.pontosDistribuidos.vida += d.vida;
      character.pontosDistribuidos.forca += d.forca;
      character.pontosDistribuidos.defesa += d.defesa;
      character.pontosDistribuidos.velocidade += d.velocidade;
      const stats = getCharStats(character);
      character.hpAtual = stats.vida;
      saveCharacter(state.currentUser, character);

      const afterLevelUp = state.levelUpData.afterLevelUp;
      if (afterLevelUp === "DUNGEON_VICTORY") {
        return reducer(
          { ...state, character, levelUpData: null },
          { type: "DUNGEON_VICTORY" },
        );
      }
      if (afterLevelUp === "DUNGEON_NEXT_HORDA") {
        return reducer(
          { ...state, character, levelUpData: null },
          { type: "DUNGEON_NEXT_HORDA" },
        );
      }
      if (state.lootData) {
        return { ...state, character, screen: "LOOT", levelUpData: null };
      }
      return { ...state, character, screen: "VICTORY", levelUpData: null };
    }

    case "COLLECT_LOOT": {
      const { itemIndex } = action.payload;
      const character = {
        ...state.character,
        inventario: [...state.character.inventario],
      };
      const loot = [...state.lootData];
      const item = loot[itemIndex];
      if (character.inventario.length >= 30) return state;
      character.inventario.push(item);
      loot.splice(itemIndex, 1);
      saveCharacter(state.currentUser, character);
      if (loot.length === 0)
        return { ...state, character, lootData: null, screen: "VICTORY" };
      return { ...state, character, lootData: loot };
    }

    case "DISCARD_LOOT": {
      const { itemIndex } = action.payload;
      const loot = [...state.lootData];
      loot.splice(itemIndex, 1);
      if (loot.length === 0)
        return { ...state, lootData: null, screen: "VICTORY" };
      return { ...state, lootData: loot };
    }

    case "EQUIP_LOOT": {
      const { itemIndex } = action.payload;
      const character = {
        ...state.character,
        inventario: [...state.character.inventario],
        equipamentos: { ...state.character.equipamentos },
      };
      const loot = [...state.lootData];
      const item = loot[itemIndex];
      const slot = item.tipo;
      const atual = character.equipamentos[slot];
      if (atual) character.inventario.push(atual);
      character.equipamentos[slot] = item;
      loot.splice(itemIndex, 1);
      const stats = getCharStats(character);
      character.hpAtual = Math.min(character.hpAtual, stats.vida);
      saveCharacter(state.currentUser, character);
      if (loot.length === 0)
        return { ...state, character, lootData: null, screen: "VICTORY" };
      return { ...state, character, lootData: loot };
    }

    case "EQUIP_ITEM": {
      const { itemId } = action.payload;
      const character = {
        ...state.character,
        inventario: [...state.character.inventario],
        equipamentos: { ...state.character.equipamentos },
      };
      const itemIdx = character.inventario.findIndex((i) => i.id === itemId);
      if (itemIdx === -1) return state;
      const item = character.inventario[itemIdx];
      const slot = item.tipo;
      const atual = character.equipamentos[slot];
      character.inventario.splice(itemIdx, 1);
      if (atual) character.inventario.push(atual);
      character.equipamentos[slot] = item;
      const stats = getCharStats(character);
      character.hpAtual = Math.min(character.hpAtual, stats.vida);
      saveCharacter(state.currentUser, character);
      return { ...state, character };
    }

    case "UNEQUIP_ITEM": {
      const { slot } = action.payload;
      const character = {
        ...state.character,
        inventario: [...state.character.inventario],
        equipamentos: { ...state.character.equipamentos },
      };
      if (!character.equipamentos[slot]) return state;
      if (character.inventario.length >= 30) return state;
      character.inventario.push(character.equipamentos[slot]);
      character.equipamentos[slot] = null;
      saveCharacter(state.currentUser, character);
      return { ...state, character };
    }

    case "DISCARD_ITEM": {
      const { itemId } = action.payload;
      const character = {
        ...state.character,
        inventario: state.character.inventario.filter((i) => i.id !== itemId),
      };
      saveCharacter(state.currentUser, character);
      return { ...state, character };
    }

    case "NEXT_BATTLE": {
      const character = { ...state.character };
      saveCharacter(state.currentUser, character);

      const area = areas.find((a) => a.id === state.areaAtual);
      if (
        character.nivel >= area.nivelMax &&
        !character.areasConcluidas.includes(state.areaAtual)
      ) {
        return {
          ...state,
          character,
          screen: "BOSS_BATTLE",
          batalhaNumero: state.batalhaNumero + 1,
          ...iniciarBossBatalha(character, state.areaAtual),
        };
      }
      return {
        ...state,
        character,
        screen: "BATTLE",
        batalhaNumero: state.batalhaNumero + 1,
        ...iniciarBatalha(character, state.areaAtual),
      };
    }

    case "NEXT_AREA": {
      const areaIdx = areas.findIndex((a) => a.id === state.areaAtual);
      const proxArea =
        areaIdx < areas.length - 1 ? areas[areaIdx + 1].id : null;
      if (proxArea && state.character.areasDesbloqueadas.includes(proxArea)) {
        return {
          ...state,
          areaAtual: proxArea,
          batalhaNumero: 1,
          victorySource: null,
          screen: "BATTLE",
          ...iniciarBatalha(state.character, proxArea),
        };
      }
      return { ...state, victorySource: null, screen: "AREA_MAP" };
    }

    case "NEXT_DUNGEON": {
      return { ...state, victorySource: null, screen: "DUNGEON_SELECT" };
    }

    case "CONTINUE_AFTER_DEFEAT": {
      const character = { ...state.character };
      const stats = getCharStats(character);
      character.hpAtual = stats.vida;
      saveCharacter(state.currentUser, character);
      return { ...state, character, screen: "AREA_MAP", batalha: null };
    }

    case "RETRY_AREA": {
      const character = { ...state.character };
      const stats = getCharStats(character);
      character.hpAtual = stats.vida;
      saveCharacter(state.currentUser, character);
      return {
        ...state,
        character,
        batalhaNumero: 1,
        screen: "BATTLE",
        ...iniciarBatalha(character, state.areaAtual),
      };
    }

    case "RETRY_DUNGEON": {
      const character = { ...state.character };
      const stats = getCharStats(character);
      character.hpAtual = stats.vida;
      saveCharacter(state.currentUser, character);
      const dungeonId = state.dungeonState?.dungeonId;
      const dungeon = dungeons.find((d) => d.id === dungeonId);
      const dungeonState = {
        dungeonId,
        hordaAtual: 1,
        totalHordas: dungeon.hordas,
      };
      return {
        ...state,
        character,
        dungeonState,
        screen: "DUNGEON_BATTLE",
        ...iniciarDungeonBatalha(character, dungeonId, false),
      };
    }

    case "GO_TITLE":
      return criarEstadoInicial();

    case "SET_MODAL":
      return { ...state, modal: action.payload };

    case "ENTER_DUNGEON": {
      const { dungeonId } = action.payload;
      const dungeon = dungeons.find((d) => d.id === dungeonId);
      const character = { ...state.character };
      const stats = getCharStats(character);
      character.hpAtual = stats.vida;
      saveCharacter(state.currentUser, character);
      const dungeonState = {
        dungeonId,
        hordaAtual: 1,
        totalHordas: dungeon.hordas,
      };
      return {
        ...state,
        character,
        dungeonState,
        screen: "DUNGEON_BATTLE",
        ...iniciarDungeonBatalha(character, dungeonId, false),
      };
    }

    case "DUNGEON_NEXT_HORDA": {
      const character = { ...state.character };
      const ds = {
        ...state.dungeonState,
        hordaAtual: state.dungeonState.hordaAtual + 1,
      };
      const dungeon = dungeons.find((d) => d.id === ds.dungeonId);
      const isBoss = ds.hordaAtual > dungeon.hordas;
      return {
        ...state,
        character,
        dungeonState: ds,
        screen: "DUNGEON_BATTLE",
        ...iniciarDungeonBatalha(character, ds.dungeonId, isBoss),
      };
    }

    case "DUNGEON_VICTORY": {
      const character = {
        ...state.character,
        dungeonsConcluidas: [...(state.character.dungeonsConcluidas || [])],
      };
      const ds = state.dungeonState;
      const dungeon = dungeons.find((d) => d.id === ds.dungeonId);
      if (!character.dungeonsConcluidas.includes(ds.dungeonId)) {
        character.dungeonsConcluidas.push(ds.dungeonId);
      }
      if (ds.dungeonId < 10) {
        if (!character.dungeonsDesbloqueadas)
          character.dungeonsDesbloqueadas = [1];
        if (!character.dungeonsDesbloqueadas.includes(ds.dungeonId + 1)) {
          character.dungeonsDesbloqueadas = [
            ...character.dungeonsDesbloqueadas,
            ds.dungeonId + 1,
          ];
        }
      }
      const slots = ["capacete", "peitoral", "luvas", "botas", "arma"];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      let loot;
      if (slot === "arma") {
        const tiposArma = [
          "espada",
          "arco",
          "cajado",
          "adaga",
          "machado",
          "maca",
          "katana",
          "lanca",
        ];
        loot = gerarItemArma(
          dungeon.nivel,
          "Lendário",
          tiposArma[Math.floor(Math.random() * tiposArma.length)],
        );
      } else {
        const pesos = ["pesada", "media", "leve", "pano"];
        loot = gerarItemArmadura(
          dungeon.nivel,
          "Lendário",
          slot,
          pesos[Math.floor(Math.random() * pesos.length)],
        );
      }
      saveCharacter(state.currentUser, character);
      return {
        ...state,
        character,
        screen: "LOOT",
        lootData: [loot],
        dungeonState: null,
        victorySource: "dungeon",
      };
    }

    case "DUNGEON_DEFEAT": {
      const character = { ...state.character };
      const stats = getCharStats(character);
      character.hpAtual = stats.vida;
      saveCharacter(state.currentUser, character);
      return {
        ...state,
        character,
        screen: "DUNGEON_SELECT",
        dungeonState: null,
        batalha: null,
      };
    }

    case "SELL_ITEM": {
      const { itemId } = action.payload;
      const character = {
        ...state.character,
        inventario: [...state.character.inventario],
      };
      const itemIdx = character.inventario.findIndex((i) => i.id === itemId);
      if (itemIdx === -1) return state;
      const item = character.inventario[itemIdx];
      const preco = calcularPrecoVenda(item);
      character.inventario.splice(itemIdx, 1);
      character.ouro = (character.ouro || 0) + preco;
      saveCharacter(state.currentUser, character);
      return { ...state, character };
    }

    case "SELL_LOOT": {
      const { itemIndex } = action.payload;
      const character = { ...state.character };
      const loot = [...state.lootData];
      const item = loot[itemIndex];
      const preco = calcularPrecoVenda(item);
      character.ouro = (character.ouro || 0) + preco;
      loot.splice(itemIndex, 1);
      saveCharacter(state.currentUser, character);
      if (loot.length === 0)
        return { ...state, character, lootData: null, screen: "VICTORY" };
      return { ...state, character, lootData: loot };
    }

    case "BUY_SHOP_ITEM": {
      const { slotIndex } = action.payload;
      const shopData = getShop(state.character.nivel);
      if (shopData.sold[slotIndex]) return state;
      const item = shopData.items[slotIndex];
      if (!item || !item.preco) return state;
      const ouroAtual = state.character.ouro || 0;
      if (ouroAtual < item.preco) return state;
      if (state.character.inventario.length >= 30) return state;
      shopData.sold[slotIndex] = true;
      localStorage.setItem("rpg_shop", JSON.stringify(shopData));
      const character = {
        ...state.character,
        ouro: ouroAtual - item.preco,
        inventario: [
          ...state.character.inventario,
          { ...item, preco: undefined },
        ],
      };
      saveCharacter(state.currentUser, character);
      return { ...state, character };
    }

    default:
      return state;
  }
}

function iniciarBatalha(character, areaId) {
  const stats = getCharStats(character);
  const classeData = classes.find((c) => c.id === character.classeId);
  const enemy = gerarInimigo(areaId, character.nivel);
  const playerAttacks = classeData.attacks.map((a) => ({
    ...a,
    currentPP: a.maxPP,
  }));
  const playerGoesFirst = stats.velocidade >= enemy.stats.velocidade;
  return {
    batalha: {
      enemy,
      playerAttacks,
      log: [],
      turn: playerGoesFirst ? "player" : "enemy",
      animating: !playerGoesFirst,
      primeiroAtaque: true,
      buffs: [],
    },
  };
}

function iniciarBossBatalha(character, areaId) {
  const stats = getCharStats(character);
  const classeData = classes.find((c) => c.id === character.classeId);
  const boss = gerarBoss(areaId);
  const playerAttacks = classeData.attacks.map((a) => ({
    ...a,
    currentPP: a.maxPP,
  }));
  const playerGoesFirst = stats.velocidade >= boss.stats.velocidade;
  return {
    batalha: {
      enemy: boss,
      playerAttacks,
      log: [],
      turn: playerGoesFirst ? "player" : "enemy",
      animating: !playerGoesFirst,
      primeiroAtaque: true,
      buffs: [],
    },
  };
}

function iniciarDungeonBatalha(character, dungeonId, isBoss) {
  const stats = getCharStats(character);
  const classeData = classes.find((c) => c.id === character.classeId);
  const dungeon = dungeons.find((d) => d.id === dungeonId);
  let enemy;
  if (isBoss) {
    const bossTemplate = getDungeonBoss(dungeonId);
    const nivel = dungeon.nivel;
    const escalado = {
      vida: escalarAtributoBossDungeon(bossTemplate.baseStats.vida, nivel),
      forca: escalarAtributoBossDungeon(bossTemplate.baseStats.forca, nivel),
      defesa: escalarAtributoBossDungeon(bossTemplate.baseStats.defesa, nivel),
      velocidade: escalarAtributoBossDungeon(bossTemplate.baseStats.velocidade, nivel),
    };
    enemy = {
      ...bossTemplate,
      nivel,
      stats: escalado,
      hpAtual: escalado.vida,
      attacks: bossTemplate.attacks.map((a) => ({ ...a, currentPP: a.maxPP })),
    };
  } else {
    const enemies = getDungeonEnemies(dungeonId);
    const template = enemies[Math.floor(Math.random() * enemies.length)];
    const nivel = dungeon.nivel;
    const escalado = {
      vida: escalarAtributoDungeon(template.baseStats.vida, nivel),
      forca: escalarAtributoDungeon(template.baseStats.forca, nivel),
      defesa: escalarAtributoDungeon(template.baseStats.defesa, nivel),
      velocidade: escalarAtributoDungeon(template.baseStats.velocidade, nivel),
    };
    enemy = {
      ...template,
      nivel,
      stats: escalado,
      hpAtual: escalado.vida,
      attacks: template.attacks.map((a) => ({ ...a, currentPP: a.maxPP })),
    };
  }
  const playerAttacks = classeData.attacks.map((a) => ({
    ...a,
    currentPP: a.maxPP,
  }));
  const playerGoesFirst = stats.velocidade >= enemy.stats.velocidade;
  return {
    batalha: {
      enemy,
      playerAttacks,
      log: [],
      turn: playerGoesFirst ? "player" : "enemy",
      animating: !playerGoesFirst,
      primeiroAtaque: true,
      isDungeon: true,
      buffs: [],
    },
  };
}

function saveCharacter(username, character) {
  const users = getUsers();
  if (users[username]) {
    users[username].character = character;
    saveUsers(users);
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, criarEstadoInicial);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
export { getUsers, saveUsers, classes, areas };
