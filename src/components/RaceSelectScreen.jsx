import React from 'react'
import { RACES } from '../data/races.js'
import { validateRunner } from '../utils/runner.js'

function DifficultyDots({ level }) {
  return (
    <span className="difficulty">
      {[1, 2, 3].map(i => (
        <span key={i} className={`dot ${i <= level ? 'filled' : ''}`} />
      ))}
    </span>
  )
}

export default function RaceSelectScreen({ state, setScreen, goBack, selectRunner, editRunner }) {
  const { personalBests, runners, selectedRunnerId, ownedInstructions } = state

  const selectedRunner = runners.find(r => r.id === selectedRunnerId)
  const runnerValid = selectedRunner
    ? validateRunner(selectedRunner.code, ownedInstructions)
    : null

  return (
    <div className="screen race-select-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={goBack}>← BACK</button>
        <div className="screen-title">SELECT CIRCUIT</div>
      </div>

      {/* Runner selector */}
      <div className="runner-selector">
        <div className="runner-selector-label muted">SELECTED RUNNER</div>
        {selectedRunner ? (
          <div className="runner-selector-info">
            <span className={`runner-selector-name ${runnerValid?.ok ? '' : 'invalid'}`}>
              {selectedRunner.name}
            </span>
            <span className={`runner-status-badge sm ${runnerValid?.ok ? 'ok' : 'err'}`}>
              {runnerValid?.ok ? '✓ READY' : '✗ INVALID'}
            </span>
            {!runnerValid?.ok && (
              <span className="runner-selector-issues muted">
                {runnerValid?.missing?.length > 0
                  ? `Missing: ${runnerValid.missing.join(', ')}`
                  : runnerValid?.errors?.length > 0
                    ? `${runnerValid.errors.length} syntax error(s)`
                    : 'Not ready'}
              </span>
            )}
          </div>
        ) : (
          <div className="runner-selector-info">
            <span className="muted">No runner selected</span>
          </div>
        )}
        <div className="runner-selector-actions">
          <button className="btn-ghost btn-sm" onClick={() => setScreen('runners')}>Change</button>
          {selectedRunner && (
            <button className="btn-ghost btn-sm" onClick={() => editRunner(selectedRunner.id)}>Edit</button>
          )}
        </div>
      </div>

      {/* Circuit list */}
      <div className="circuit-list">
        {Object.values(RACES).map(race => {
          const pb = personalBests?.[race.id]
          const canStart = !race.locked && runnerValid?.ok

          return (
            <div key={race.id} className={`circuit-card ${race.locked ? 'locked' : ''}`}>
              <div className="circuit-card-left">
                <div className="circuit-card-header">
                  <span className="circuit-name">{race.name}</span>
                  <DifficultyDots level={race.difficulty} />
                  {race.locked && <span className="locked-badge">LOCKED</span>}
                </div>
                <div className="circuit-subtitle accent">{race.subtitle}</div>
                <div className="circuit-desc muted">{race.description}</div>
                <div className="circuit-specs muted">
                  {race.steps} steps · {race.totalUnits} work units · +{race.reward} CR
                </div>
              </div>

              <div className="circuit-card-right">
                <div className="circuit-pb">
                  <div className="pb-label muted">PERSONAL BEST</div>
                  {pb ? (
                    <>
                      <div className="pb-value accent">{pb.unitsUsed} units</div>
                      <div className="pb-sub muted">{pb.totalCycles.toLocaleString()} cycles</div>
                    </>
                  ) : (
                    <div className="pb-value muted">—</div>
                  )}
                </div>

                {!race.locked && (
                  <button
                    className="btn-primary btn-start-race"
                    disabled={!canStart}
                    onClick={() => {
                      if (!selectedRunnerId) return
                      setScreen('race')
                    }}
                    title={!runnerValid?.ok ? 'Runner is not race-ready' : undefined}
                  >
                    START
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
