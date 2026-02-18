import React, { useState, useCallback } from 'react'
import { useGameState } from './hooks/useGameState.js'
import GarageScreen from './components/GarageScreen.jsx'
import MarketplaceScreen from './components/MarketplaceScreen.jsx'
import RunnersScreen from './components/RunnersScreen.jsx'
import IDEScreen from './components/IDEScreen.jsx'
import RaceSelectScreen from './components/RaceSelectScreen.jsx'
import RaceScreen from './components/RaceScreen.jsx'
import TutorialScreen from './components/TutorialScreen.jsx'

export default function App() {
  const {
    state,
    setScreen,
    buyInstruction,
    sellInstruction,
    createRunner,
    updateRunner,
    deleteRunner,
    selectRunner,
    editRunner,
    raceFinished,
    visitManual,
    reset,
  } = useGameState()

  const [navHistory, setNavHistory] = useState([])

  const navigate = useCallback((screen) => {
    setNavHistory(prev => [...prev, state.screen])
    if (screen === 'tutorial' && !state.hasVisitedManual) visitManual()
    setScreen(screen)
  }, [state.screen, state.hasVisitedManual, setScreen, visitManual])

  const goBack = useCallback(() => {
    setNavHistory(prev => {
      const dest = prev.length > 0 ? prev[prev.length - 1] : 'garage'
      setScreen(dest)
      return prev.slice(0, -1)
    })
  }, [setScreen])

  // Wrap editRunner and createRunner to also push history
  const editRunnerNav = useCallback((id) => {
    setNavHistory(prev => [...prev, state.screen])
    editRunner(id)
  }, [state.screen, editRunner])

  const createRunnerNav = useCallback(() => {
    setNavHistory(prev => [...prev, state.screen])
    createRunner()
  }, [state.screen, createRunner])

  const common = { state, setScreen: navigate, goBack }

  const screens = {
    garage: <GarageScreen {...common} reset={reset} />,

    marketplace: (
      <MarketplaceScreen
        {...common}
        buyInstruction={buyInstruction}
        sellInstruction={sellInstruction}
      />
    ),

    runners: (
      <RunnersScreen
        {...common}
        createRunner={createRunnerNav}
        deleteRunner={deleteRunner}
        selectRunner={selectRunner}
        editRunner={editRunnerNav}
      />
    ),

    ide: (
      <IDEScreen
        {...common}
        updateRunner={updateRunner}
        buyInstruction={buyInstruction}
        selectRunner={selectRunner}
      />
    ),

    raceSelect: (
      <RaceSelectScreen
        {...common}
        selectRunner={selectRunner}
        editRunner={editRunnerNav}
      />
    ),

    race: (
      <RaceScreen
        {...common}
        raceFinished={raceFinished}
      />
    ),

    tutorial: <TutorialScreen {...common} />,
  }

  return (
    <div className="app">
      {screens[state.screen] ?? screens.garage}
    </div>
  )
}
