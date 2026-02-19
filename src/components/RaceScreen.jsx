import React, { useState, useEffect, useRef, useCallback } from 'react'
import { assemble } from '../vm/assembler.js'
import { execute } from '../vm/interpreter.js'
import { RACE, PROCESSOR_HZ, generateRace, generateRace2, getCarPosition, buildCircuitPath, buildPartialPath, CIRCUIT_WAYPOINTS } from '../race/circuit.js'
import { RACES } from '../data/races.js'
import { playNavigate } from '../utils/sound.js'

const CIRCUIT_PATH = buildCircuitPath()
const MAX_LOG = 6
const SLIDER_MIN = 0
const SLIDER_MAX = 100
const CHART_INTERVAL_MS = 2000
const CHART_WINDOW = 20

// 6 chart slot configs: 3 active + 3 reserved (null = empty slot)
const CHART_CONFIGS = [
  { key: 'perUnit',    color: '#e67e22', label: 'avg cyc / unit'    },
  { key: 'perSuccess', color: '#4ade80', label: 'avg cyc / correct' },
  { key: 'perFailure', color: '#f87171', label: 'avg cyc / wrong'   },
  null,
  null,
  null,
]

// ─── Mini timeseries chart ─────────────────────────────────────────────────────
function MiniChart({ data, color, label }) {
  const W = 200, H = 36
  const N = CHART_WINDOW

  const vals = data.filter(v => v !== null && v !== undefined)
  const latest = vals[vals.length - 1]

  const offset = N - data.length
  const toX = i => ((i + offset) / (N - 1)) * W
  const toY = v => {
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min || 1
    return H - 2 - ((v - min) / range) * (H - 4)
  }

  let d = ''
  let firstX = null
  data.forEach((v, i) => {
    if (v === null) return
    const x = toX(i)
    if (firstX === null) firstX = x
    d += `${d === '' ? 'M' : 'L'} ${x.toFixed(1)} ${toY(v).toFixed(1)} `
  })

  const hasCurve = d !== '' && vals.length >= 2
  const fill = hasCurve
    ? d + `L ${toX(data.length - 1).toFixed(1)} ${H} L ${firstX.toFixed(1)} ${H} Z`
    : ''

  return (
    <div className="mini-chart">
      <div className="mini-chart-header">
        <span className="mini-chart-label muted">{label}</span>
        <span className="mini-chart-val" style={latest != null ? { color } : undefined}>
          {latest != null ? latest.toLocaleString() : '—'}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mini-chart-svg" preserveAspectRatio="none">
        {hasCurve && <path d={fill} fill={color} opacity="0.12" />}
        {hasCurve && <path d={d} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
        <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="#333" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

// ─── Circuit SVG ─────────────────────────────────────────────────────────────
function CircuitMap({ step, totalSteps }) {
  const pos = getCarPosition(step)
  const partialPath = step > 0 ? buildPartialPath(step) : ''

  return (
    <svg viewBox="0 0 500 300" className="circuit-svg">
      <rect width="500" height="300" fill="#1a1a1a" />
      <path d={CIRCUIT_PATH} fill="none" stroke="#252525" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      <path d={CIRCUIT_PATH} fill="none" stroke="#333" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d={CIRCUIT_PATH} fill="none" stroke="#444" strokeWidth="1" strokeDasharray="8,8" />
      {partialPath && (
        <path d={partialPath} fill="none" stroke="#e67e22" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      )}
      {CIRCUIT_WAYPOINTS.slice(1, totalSteps + 1).map((pt, i) => {
        const idx = i + 1
        return <circle key={idx} cx={pt.x} cy={pt.y} r="3" fill={idx <= step ? '#e67e22' : '#555'} />
      })}
      <rect x={CIRCUIT_WAYPOINTS[0].x - 3} y={CIRCUIT_WAYPOINTS[0].y - 12} width="6" height="14" fill="#e67e22" />
      <circle cx={pos.x} cy={pos.y} r="8" fill="#e67e22" opacity="0.25" />
      <circle cx={pos.x} cy={pos.y} r="5" fill="#e67e22" />
      <circle cx={pos.x} cy={pos.y} r="2" fill="#fff" />
    </svg>
  )
}

// ─── Slider panel (multi-slot) ────────────────────────────────────────────────
const SLIDER_LABELS = ['SLIDER_1', 'SLIDER_2', 'SLIDER_3']

function SliderControl({ values, activeIndex, activeSlotIndices }) {
  const multiSlider = activeSlotIndices.length > 1
  return (
    <div className="slider-panel">
      {activeSlotIndices.map(i => {
        const value = values[i]
        const pct = ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100
        const isFocused = multiSlider && i === activeIndex
        return (
          <div key={i} className={`slider-slot${isFocused ? ' focused' : ''}`}>
            <div className="slider-header">
              <span className="slider-label">{isFocused ? '► ' : ''}{SLIDER_LABELS[i]}</span>
              <span className="slider-value accent">{value}</span>
            </div>
            <div className="slider-track">
              <div className="slider-fill" style={{ width: `${pct}%` }} />
              <div className="slider-thumb" style={{ left: `calc(${pct}% - 6px)` }} />
            </div>
          </div>
        )
      })}
      <div className="slider-hint muted">
        {multiSlider ? 'W/S switch · A/D ±1 · Shift ±10' : 'A/D ±1 · Shift ±10'} (during race)
      </div>
    </div>
  )
}

// ─── Fuel bar ─────────────────────────────────────────────────────────────────
function FuelBar({ remaining, total }) {
  const pct = (remaining / total) * 100
  const low = pct < 25
  return (
    <div className="fuel-panel">
      <div className="fuel-header">
        <span className="fuel-label muted">FUEL</span>
        <span className={`fuel-val${low ? ' fail' : ''}`}>{remaining}</span>
      </div>
      <div className="fuel-track">
        <div
          className={`fuel-fill${low ? ' low' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Result row ───────────────────────────────────────────────────────────────
function ResultRow({ entry }) {
  return (
    <div className={`result-row ${entry.ok ? 'ok' : 'fail'}`}>
      <span className="result-icon">{entry.ok ? '✓' : '✗'}</span>
      <span className="result-arr">[{entry.arr.slice(0, 5).join(', ')}{entry.arr.length > 5 ? '…' : ''}]</span>
      <span className="result-returned">→ {entry.returned}</span>
      {!entry.ok && <span className="result-expected muted">exp {entry.expected}</span>}
    </div>
  )
}

function addPoint(setter, value) {
  setter(prev => {
    const next = [...prev, value]
    return next.length > CHART_WINDOW ? next.slice(-CHART_WINDOW) : next
  })
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RaceScreen({ state, setScreen, goBack, raceFinished }) {
  const { ownedInstructions, personalBests, currentRaceId, challengeRunnerIds, runners } = state

  // Resolve runner for this race
  const raceId = currentRaceId ?? 'circuit-01'
  const runnerId = challengeRunnerIds?.[raceId] ?? state.selectedRunnerId ?? runners[0]?.id
  const selectedRunner = runners.find(r => r.id === runnerId) ?? runners[0]
  const code = selectedRunner?.code ?? ''
  const pb = personalBests?.[raceId]

  const [phase, setPhase] = useState('ready')
  const [sliderValues, setSliderValues] = useState([50, 50, 50])
  const [activeSlider, setActiveSlider] = useState(0)
  const [activeSlotIndices, setActiveSlotIndices] = useState([0])
  const [step, setStep] = useState(0)
  const [unitIndex, setUnitIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [totalCycles, setTotalCycles] = useState(0)
  const [log, setLog] = useState([])
  const [raceData, setRaceData] = useState(null)
  const [compiled, setCompiled] = useState(null)
  const [compileError, setCompileError] = useState(null)
  const [finalResult, setFinalResult] = useState(null)

  const [chartPerUnit, setChartPerUnit] = useState([])
  const [chartPerSuccess, setChartPerSuccess] = useState([])
  const [chartPerFailure, setChartPerFailure] = useState([])

  const sliderValuesRef = useRef(sliderValues)
  sliderValuesRef.current = sliderValues
  const activeSliderRef = useRef(activeSlider)
  activeSliderRef.current = activeSlider
  const intervalRef = useRef(null)
  const chartIntervalRef = useRef(null)
  const stepRef = useRef(0)
  const unitIndexRef = useRef(0)
  const correctRef = useRef(0)
  const wrongRef = useRef(0)
  const totalCyclesRef = useRef(0)
  const successCyclesRef = useRef(0)
  const failureCyclesRef = useRef(0)

  useEffect(() => {
    const result = assemble(code)
    if (result.errors.length > 0) { setCompileError(result.errors); return }
    setCompiled(result)
    setRaceData(raceId === 'circuit-02' ? generateRace2() : generateRace())
    // Detect which SLIDER_N slots are used in the program
    const usedSlots = new Set(
      result.program
        .filter(i => i.op === 'SLIDER_1' || i.op === 'SLIDER_2' || i.op === 'SLIDER_3')
        .map(i => parseInt(i.op.slice(-1)) - 1)
    )
    const indices = [0, 1, 2].filter(i => usedSlots.has(i))
    setActiveSlotIndices(indices.length > 0 ? indices : [0])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Slider control: A/D adjust active slider (Shift ±10), W/S switch active slot
  useEffect(() => {
    if (phase !== 'racing') return
    const handler = (e) => {
      if (e.key === 'a' || e.key === 'd') {
        e.preventDefault()
        playNavigate()
        const delta = e.key === 'd' ? (e.shiftKey ? 10 : 1) : (e.shiftKey ? -10 : -1)
        const cur = activeSliderRef.current
        setSliderValues(prev => {
          const next = [...prev]
          next[cur] = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, prev[cur] + delta))
          return next
        })
      } else if (e.key === 'w' || e.key === 's') {
        e.preventDefault()
        if (activeSlotIndices.length <= 1) return
        setActiveSlider(prev => {
          const dir = e.key === 's' ? 1 : -1
          const idx = activeSlotIndices.indexOf(prev)
          const nextIdx = (idx + dir + activeSlotIndices.length) % activeSlotIndices.length
          return activeSlotIndices[nextIdx]
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, activeSlotIndices])

  const processUnit = useCallback(() => {
    if (!compiled || !raceData) return
    const uIdx = unitIndexRef.current
    const unit = raceData.units[uIdx]
    const execResult = execute({ program: compiled.program, labels: compiled.labels, arr: unit.arr, sliderValues: sliderValuesRef.current, ownedInstructions })
    const returned = execResult.result ?? null
    const ok = returned !== null && returned === unit.expected
    const cycles = execResult.cycles || 0

    unitIndexRef.current = uIdx + 1
    totalCyclesRef.current += cycles
    if (ok) { correctRef.current += 1; stepRef.current += 1; successCyclesRef.current += cycles }
    else { wrongRef.current += 1; failureCyclesRef.current += cycles }

    setUnitIndex(unitIndexRef.current)
    setTotalCycles(totalCyclesRef.current)
    setStep(stepRef.current)
    if (ok) setCorrect(c => c + 1)
    else setWrong(w => w + 1)
    setLog(prev => [{ arr: unit.arr, returned: returned ?? 'ERR', expected: unit.expected, ok }, ...prev].slice(0, MAX_LOG))

    const finished = stepRef.current >= RACE.steps
    const dnf = unitIndexRef.current >= RACE.totalUnits && !finished
    if (finished || dnf) {
      clearInterval(intervalRef.current)
      clearInterval(chartIntervalRef.current)
      const result = { unitsUsed: unitIndexRef.current, totalCycles: totalCyclesRef.current, correct: correctRef.current, date: new Date().toISOString() }
      setFinalResult(result)
      setPhase(finished ? 'finished' : 'dnf')
      if (finished) raceFinished(raceId, result, RACE.reward)
    }
  }, [compiled, raceData, ownedInstructions, raceFinished, raceId])

  const sampleChart = useCallback(() => {
    const u = unitIndexRef.current
    const c = correctRef.current
    const w = wrongRef.current
    addPoint(setChartPerUnit,    u > 0 ? Math.round(totalCyclesRef.current / u) : null)
    addPoint(setChartPerSuccess, c > 0 ? Math.round(successCyclesRef.current / c) : null)
    addPoint(setChartPerFailure, w > 0 ? Math.round(failureCyclesRef.current / w) : null)
  }, [])

  const startRace = useCallback(() => {
    stepRef.current = 0; unitIndexRef.current = 0; correctRef.current = 0; wrongRef.current = 0
    totalCyclesRef.current = 0; successCyclesRef.current = 0; failureCyclesRef.current = 0
    setStep(0); setUnitIndex(0); setCorrect(0); setWrong(0); setTotalCycles(0)
    setLog([]); setFinalResult(null)
    setChartPerUnit([]); setChartPerSuccess([]); setChartPerFailure([])
    setActiveSlider(0)
    setPhase('racing')
    intervalRef.current = setInterval(() => processUnit(), RACE.unitInterval)
    chartIntervalRef.current = setInterval(() => sampleChart(), CHART_INTERVAL_MS)
  }, [processUnit, sampleChart])

  useEffect(() => () => { clearInterval(intervalRef.current); clearInterval(chartIntervalRef.current) }, [])

  const unitsLeft = RACE.totalUnits - unitIndex
  const progressPct = (step / RACE.steps) * 100
  const raceName = RACES[raceId]?.name ?? 'CIRCUIT'

  const handleBack = () => {
    clearInterval(intervalRef.current)
    clearInterval(chartIntervalRef.current)
    goBack()
  }

  // Chart data map
  const chartData = { perUnit: chartPerUnit, perSuccess: chartPerSuccess, perFailure: chartPerFailure }

  if (compileError) {
    return (
      <div className="screen race-screen">
        <div className="screen-header">
          <button className="btn-back" onClick={handleBack}>← BACK</button>
          <div className="screen-title">CIRCUIT 01</div>
        </div>
        <div className="compile-error-panel">
          <div className="compile-error-title">Compile Error</div>
          {compileError.map((e, i) => <div key={i} className="error-item">{e}</div>)}
          <button className="btn-primary" style={{ marginTop: '20px' }} onClick={goBack}>Fix in Garage</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen race-screen" tabIndex={-1}>
      <div className="screen-header">
        <button className="btn-back" onClick={handleBack}>← BACK</button>
        <div className="screen-title">
          {raceName} — TIME ATTACK
          {phase === 'racing' && <span className="racing-indicator"> ●</span>}
        </div>
        <div className="race-header-right">
          <span className="hz-badge">{PROCESSOR_HZ} Hz</span>
          <span className="hs cycles">{totalCycles.toLocaleString()}<span className="hs-label"> cyc</span></span>
          {pb && <span className="hs pb">PB {pb.unitsUsed}u</span>}
        </div>
      </div>

      <div className="race-body">
        {/* Left: charts + circuit + progress */}
        <div className="race-left">
          <div className="race-left-main">
            {/* 6-slot chart panel */}
            <div className="race-charts">
              {CHART_CONFIGS.map((cfg, i) =>
                cfg ? (
                  <MiniChart key={i} data={chartData[cfg.key]} color={cfg.color} label={cfg.label} />
                ) : (
                  <div key={i} className="mini-chart-slot-empty" />
                )
              )}
            </div>
            <div className="circuit-wrap">
              <CircuitMap step={step} totalSteps={RACE.steps} />
            </div>
          </div>

          <div className="progress-bar-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="progress-labels muted"><span>0</span><span>FINISH</span></div>
          </div>

          {phase === 'ready' && (
            <button className="btn-primary btn-start" disabled={!compiled} onClick={startRace}>
              START
            </button>
          )}

          {(phase === 'finished' || phase === 'dnf') && finalResult && (
            <div className={`result-panel ${phase}`}>
              <div className="result-panel-title">
                {phase === 'finished' ? '🏁 FINISHED' : '⛔ DNF'}
              </div>
              {phase === 'finished' && (
                <>
                  <div className="result-stat"><span>Units used</span><span className="accent">{finalResult.unitsUsed}</span></div>
                  <div className="result-stat"><span>Total cycles</span><span>{finalResult.totalCycles.toLocaleString()}</span></div>
                  <div className="result-stat"><span>Accuracy</span><span>{Math.round((finalResult.correct / finalResult.unitsUsed) * 100)}%</span></div>
                  <div className="result-stat"><span>Reward</span><span className="accent">+{RACE.reward} CR</span></div>
                  {pb && finalResult.unitsUsed <= pb.unitsUsed && <div className="result-stat"><span>Personal Best</span><span className="ok">NEW RECORD</span></div>}
                </>
              )}
              {phase === 'dnf' && (
                <div className="dnf-msg">All {RACE.totalUnits} units exhausted — {step}/{RACE.steps} steps completed.</div>
              )}
              <div className="result-actions">
                <button className="btn-primary" onClick={startRace}>RETRY</button>
                <button className="btn-ghost" onClick={goBack}>CHALLENGES</button>
              </div>
            </div>
          )}
        </div>

        {/* Right: metrics + fuel + slider + log */}
        <div className="race-right">
          <div className="metrics-grid-2">
            <div className="metric"><div className="metric-val ok">{correct}</div><div className="metric-label">CORRECT</div></div>
            <div className="metric"><div className="metric-val fail">{wrong}</div><div className="metric-label">WRONG</div></div>
          </div>
          <FuelBar remaining={unitsLeft} total={RACE.totalUnits} />
          <SliderControl values={sliderValues} activeIndex={activeSlider} activeSlotIndices={activeSlotIndices} />
          <div className="log-panel">
            <div className="log-header muted">LAST RESULTS</div>
            {log.length === 0 && <div className="log-empty muted">Waiting for race to start…</div>}
            {log.map((entry, i) => <ResultRow key={i} entry={entry} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
