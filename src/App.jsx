import { GameProvider, useGame } from './context/GameContext'
import TitleScreen from './components/screens/TitleScreen'
import AuthScreen from './components/screens/AuthScreen'
import ClassSelectScreen from './components/screens/ClassSelectScreen'
import AreaMapScreen from './components/screens/AreaMapScreen'
import BattleScreen from './components/screens/BattleScreen'
import LootScreen from './components/screens/LootScreen'
import LevelUpScreen from './components/screens/LevelUpScreen'
import VictoryScreen from './components/screens/VictoryScreen'
import InventoryScreen from './components/screens/InventoryScreen'
import ProfileScreen from './components/screens/ProfileScreen'
import DefeatScreen from './components/screens/DefeatScreen'
import GameOverScreen from './components/screens/GameOverScreen'
import DungeonSelectScreen from './components/screens/DungeonSelectScreen'
import DungeonBattleScreen from './components/screens/DungeonBattleScreen'

const screens = {
  TITLE: TitleScreen,
  AUTH: AuthScreen,
  CLASS_SELECT: ClassSelectScreen,
  AREA_MAP: AreaMapScreen,
  BATTLE: BattleScreen,
  BOSS_BATTLE: BattleScreen,
  LOOT: LootScreen,
  LEVEL_UP: LevelUpScreen,
  VICTORY: VictoryScreen,
  INVENTORY: InventoryScreen,
  PROFILE: ProfileScreen,
  DEFEAT: DefeatScreen,
  GAME_OVER: GameOverScreen,
  DUNGEON_SELECT: DungeonSelectScreen,
  DUNGEON_BATTLE: DungeonBattleScreen,
}

function GameRouter() {
  const { state } = useGame()
  const Screen = screens[state.screen] || TitleScreen
  return <Screen />
}

export default function App() {
  return (
    <GameProvider>
      <div className="w-full h-full overflow-hidden">
        <GameRouter />
      </div>
    </GameProvider>
  )
}
