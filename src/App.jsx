import React, { useState, useCallback, useRef } from 'react'
import { useGameState } from './hooks/useGameState.js'
import GarageScreen from './components/GarageScreen.jsx'
import MarketplaceScreen from './components/MarketplaceScreen.jsx'
import RunnersScreen from './components/RunnersScreen.jsx'
import IDEScreen from './components/IDEScreen.jsx'
import RaceSelectScreen from './components/RaceSelectScreen.jsx'
import RaceRunnerSelectScreen from './components/RaceRunnerSelectScreen.jsx'
import RaceScreen from './components/RaceScreen.jsx'
import TutorialScreen from './components/TutorialScreen.jsx'
import { playNavigate, playConfirm } from './utils/sound.js'

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
    setChallengeRunner,
    setCurrentRace,
  } = useGameState()

  const [navHistory, setNavHistory] = useState([])
  const [fading, setFading] = useState(false)
  const pendingNav = useRef(false)

  // Performs a fade-to-black → screen switch → fade-in sequence
  const fadeTo = useCallback((screen, before) => {
    if (pendingNav.current) return
    pendingNav.current = true
    setFading(true)
    setTimeout(() => {
      before?.()
      setScreen(screen)
      // Two rAF ensures the new screen renders before we fade in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFading(false)
          playNavigate()
          pendingNav.current = false
        })
      })
    }, 220)
  }, [setScreen])

  const navigate = useCallback((screen) => {
    setNavHistory(prev => [...prev, state.screen])
    playConfirm()
    fadeTo(screen, () => {
      if (screen === 'tutorial' && !state.hasVisitedManual) visitManual()
    })
  }, [state.screen, state.hasVisitedManual, visitManual, fadeTo])

  const goBack = useCallback(() => {
    const dest = navHistory.length > 0 ? navHistory[navHistory.length - 1] : 'garage'
    setNavHistory(prev => prev.slice(0, -1))
    playConfirm()
    fadeTo(dest)
  }, [navHistory, fadeTo])

  // Wrap editRunner and createRunner to also push history
  const editRunnerNav = useCallback((id) => {
    setNavHistory(prev => [...prev, state.screen])
    playConfirm()
    fadeTo('ide', () => editRunner(id))
  }, [state.screen, editRunner, fadeTo])

  const createRunnerNav = useCallback(() => {
    setNavHistory(prev => [...prev, state.screen])
    playConfirm()
    fadeTo('ide', () => createRunner())
  }, [state.screen, createRunner, fadeTo])

  // Start a race: go to runner select screen for that race
  const startChallenge = useCallback((raceId) => {
    setNavHistory(prev => [...prev, state.screen])
    playConfirm()
    fadeTo('raceRunnerSelect', () => setCurrentRace(raceId))
  }, [state.screen, setCurrentRace, fadeTo])

  // Confirm runner selection and enter race
  const startRace = useCallback(() => {
    setNavHistory(prev => [...prev, state.screen])
    playConfirm()
    fadeTo('race')
  }, [state.screen, fadeTo])

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
        startChallenge={startChallenge}
      />
    ),

    raceRunnerSelect: (
      <RaceRunnerSelectScreen
        {...common}
        setChallengeRunner={setChallengeRunner}
        startRace={startRace}
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
      <div className={`fade-overlay${fading ? ' active' : ''}`} />
    </div>
  )
}
