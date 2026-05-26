import { GameProvider, useGame } from './context/GameContext'
import TitleScreen from './components/screens/TitleScreen'
import CharacterSelectScreen from './components/screens/CharacterSelectScreen'
import BattleScreen from './components/screens/BattleScreen'
import VictoryScreen from './components/screens/VictoryScreen'
import LevelUpScreen from './components/screens/LevelUpScreen'
import DefeatScreen from './components/screens/DefeatScreen'
import GameOverScreen from './components/screens/GameOverScreen'

const screens = {
  TITLE: TitleScreen,
  CHARACTER_SELECT: CharacterSelectScreen,
  BATTLE: BattleScreen,
  VICTORY: VictoryScreen,
  LEVEL_UP: LevelUpScreen,
  DEFEAT: DefeatScreen,
  GAME_OVER: GameOverScreen,
}

function GameRouter() {
  const { state } = useGame()
  const Screen = screens[state.screen] || TitleScreen
  return <Screen />
}

export default function App() {
  return (
    <GameProvider>
      <div className="w-full h-full">
        <GameRouter />
      </div>
    </GameProvider>
  )
}
