import { useReducer, useCallback } from 'react'
import { STARTING_CREDITS, DEFAULT_CODE, DEFAULT_CODE_2 } from '../data/instructions.js'

const STORAGE_KEY = 'code-carrera-state-v3'

function makeRunner(overrides = {}) {
  return {
    id: 'runner-' + Date.now().toString(36),
    name: 'Runner v1',
    code: DEFAULT_CODE,
    createdAt: Date.now(),
    ...overrides,
  }
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    return {
      ...saved,
      ownedInstructions:  new Set(saved.ownedInstructions ?? []),
      challengeRunnerIds: saved.challengeRunnerIds ?? {},
      currentRaceId:      saved.currentRaceId ?? null,
    }
  } catch {
    return null
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      ownedInstructions: [...state.ownedInstructions],
    }))
  } catch {}
}

const defaultRunner  = makeRunner({ id: 'runner-default',   name: 'Runner v1', code: DEFAULT_CODE })
const defaultRunner2 = makeRunner({ id: 'runner-circuit2',  name: 'Runner v2', code: DEFAULT_CODE_2 })

const freshState = {
  screen: 'garage',
  credits: STARTING_CREDITS,
  ownedInstructions: new Set(),
  runners: [defaultRunner, defaultRunner2],
  editingRunnerId: null,        // runner open in IDE
  challengeRunnerIds: {},       // { raceId: runnerId } — runner chosen per challenge
  currentRaceId: null,          // race being prepared / running
  personalBests: {},            // { 'circuit-01': { unitsUsed, totalCycles, correct, date } }
  racesCompleted: 0,
  hasVisitedManual: false,
}

const initialState = loadPersisted() ?? freshState

function reducer(state, action) {
  let next = state

  switch (action.type) {
    case 'SET_SCREEN':
      next = { ...state, screen: action.screen }
      break

    case 'BUY_INSTRUCTION': {
      if (state.ownedInstructions.has(action.name)) break
      if (state.credits < action.cost) break
      const owned = new Set(state.ownedInstructions)
      owned.add(action.name)
      next = { ...state, credits: state.credits - action.cost, ownedInstructions: owned }
      break
    }

    case 'SELL_INSTRUCTION': {
      if (!state.ownedInstructions.has(action.name)) break
      const owned = new Set(state.ownedInstructions)
      owned.delete(action.name)
      next = { ...state, credits: state.credits + Math.floor(action.cost * 0.6), ownedInstructions: owned }
      break
    }

    case 'CREATE_RUNNER': {
      const runner = makeRunner({ name: `Runner v${state.runners.length + 1}` })
      next = {
        ...state,
        runners: [...state.runners, runner],
        editingRunnerId: runner.id,
        // screen navigation handled by App.jsx
      }
      break
    }

    case 'UPDATE_RUNNER': {
      next = {
        ...state,
        runners: state.runners.map(r =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      }
      break
    }

    case 'DELETE_RUNNER': {
      if (state.runners.length <= 1) break
      const runners = state.runners.filter(r => r.id !== action.id)
      next = {
        ...state,
        runners,
        editingRunnerId: state.editingRunnerId === action.id ? null : state.editingRunnerId,
      }
      break
    }

    case 'SET_CHALLENGE_RUNNER':
      next = {
        ...state,
        challengeRunnerIds: { ...state.challengeRunnerIds, [action.raceId]: action.runnerId },
      }
      break

    case 'SET_CURRENT_RACE':
      next = { ...state, currentRaceId: action.raceId }
      break

    case 'EDIT_RUNNER':
      next = { ...state, editingRunnerId: action.id }
      // screen navigation handled by App.jsx
      break

    case 'RACE_FINISHED': {
      const pb = state.personalBests[action.raceId]
      const better = !pb || action.result.unitsUsed < pb.unitsUsed
      next = {
        ...state,
        credits: state.credits + action.reward,
        racesCompleted: state.racesCompleted + 1,
        personalBests: {
          ...state.personalBests,
          ...(better ? { [action.raceId]: action.result } : {}),
        },
      }
      break
    }

    case 'VISIT_MANUAL':
      next = { ...state, hasVisitedManual: true }
      break

    case 'RESET':
      localStorage.removeItem(STORAGE_KEY)
      return { ...freshState, runners: [makeRunner({ id: 'runner-default', name: 'Runner v1' })] }

    default:
      break
  }

  if (next !== state) persist(next)
  return next
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return {
    state,
    setScreen:        useCallback(screen => dispatch({ type: 'SET_SCREEN', screen }), []),
    buyInstruction:   useCallback((name, cost) => dispatch({ type: 'BUY_INSTRUCTION', name, cost }), []),
    sellInstruction:  useCallback((name, cost) => dispatch({ type: 'SELL_INSTRUCTION', name, cost }), []),
    createRunner:     useCallback(() => dispatch({ type: 'CREATE_RUNNER' }), []),
    updateRunner:     useCallback((id, patch) => dispatch({ type: 'UPDATE_RUNNER', id, patch }), []),
    deleteRunner:     useCallback(id => dispatch({ type: 'DELETE_RUNNER', id }), []),
    editRunner:       useCallback(id => dispatch({ type: 'EDIT_RUNNER', id }), []),
    raceFinished:        useCallback((raceId, result, reward) => dispatch({ type: 'RACE_FINISHED', raceId, result, reward }), []),
    visitManual:         useCallback(() => dispatch({ type: 'VISIT_MANUAL' }), []),
    reset:               useCallback(() => dispatch({ type: 'RESET' }), []),
    setChallengeRunner:  useCallback((raceId, runnerId) => dispatch({ type: 'SET_CHALLENGE_RUNNER', raceId, runnerId }), []),
    setCurrentRace:      useCallback(raceId => dispatch({ type: 'SET_CURRENT_RACE', raceId }), []),
  }
}
