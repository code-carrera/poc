import React, { useState, useEffect } from 'react'
import { RACES } from '../data/races.js'
import { validateRunner } from '../utils/runner.js'
import { playNavigate } from '../utils/sound.js'

export default function RaceRunnerSelectScreen({
  state, goBack, setChallengeRunner, startRace, editRunner,
}) {
  const { runners, ownedInstructions, currentRaceId, challengeRunnerIds } = state
  const race = RACES[currentRaceId]

  // Resolve the currently selected runner for this race
  const savedId = challengeRunnerIds?.[currentRaceId]
  const savedIdx = savedId ? runners.findIndex(r => r.id === savedId) : -1
  const [focusedIdx, setFocusedIdx] = useState(savedIdx >= 0 ? savedIdx : 0)

  const focusedRunner = runners[focusedIdx] ?? runners[0]
  const validation = focusedRunner
    ? validateRunner(focusedRunner.code, ownedInstructions)
    : null
  const canStart = validation?.ok

  // Persist selection whenever focused runner changes
  useEffect(() => {
    if (focusedRunner && currentRaceId) {
      setChallengeRunner(currentRaceId, focusedRunner.id)
    }
  }, [focusedRunner?.id, currentRaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  // WASD navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'w') {
        e.preventDefault()
        playNavigate()
        setFocusedIdx(i => Math.max(0, i - 1))
      } else if (e.key === 's') {
        e.preventDefault()
        playNavigate()
        setFocusedIdx(i => Math.min(runners.length - 1, i + 1))
      } else if (e.key === 'a' || e.key === 'Escape') {
        e.preventDefault()
        goBack() // goBack plays playConfirm()
      } else if ((e.key === 'd' || e.key === 'Enter') && canStart) {
        e.preventDefault()
        startRace() // startRace plays playConfirm()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canStart, goBack, startRace, runners.length])

  if (!race) return null

  return (
    <div className="screen race-runner-select-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={goBack}>← BACK</button>
        <div className="screen-title">SELECT RUNNER — {race.name.toUpperCase()}</div>
      </div>

      <div className="rrs-body">
        <div className="rrs-hint muted">
          Choose the runner that will compete in <strong className="accent">{race.subtitle}</strong>.
          Use <span className="kw">W/S</span> to navigate, <span className="kw">D</span> or Enter to start.
        </div>

        <div className="rrs-runner-list">
          {runners.map((runner, idx) => {
            const v = validateRunner(runner.code, ownedInstructions)
            const isFocused = idx === focusedIdx

            return (
              <div
                key={runner.id}
                className={`rrs-runner-card${isFocused ? ' focused' : ''}${v.ok ? '' : ' invalid'}`}
                onClick={() => setFocusedIdx(idx)}
              >
                <div className="rrs-runner-left">
                  <div className="rrs-runner-top">
                    <span className="runner-name">{runner.name}</span>
                    <span className={`runner-status-badge ${v.ok ? 'ok' : 'err'}`}>
                      {v.ok ? '✓ READY' : '✗ INVALID'}
                    </span>
                  </div>
                  {!v.ok && (
                    <div className="runner-issues">
                      {v.errors.length > 0 && (
                        <span className="issue-tag err">{v.errors.length} syntax error{v.errors.length !== 1 ? 's' : ''}</span>
                      )}
                      {v.missing.map(op => (
                        <span key={op} className="issue-tag warn">missing {op}</span>
                      ))}
                    </div>
                  )}
                  <div className="runner-meta muted">
                    {v.usedOps.length} instruction{v.usedOps.length !== 1 ? 's' : ''} used
                    &nbsp;·&nbsp;
                    {runner.code.split('\n').filter(l => l.trim() && !l.trim().startsWith(';')).length} lines
                  </div>
                </div>
                <div className="rrs-runner-actions">
                  <button
                    className="btn-edit"
                    onClick={(e) => { e.stopPropagation(); editRunner(runner.id) }}
                  >
                    EDIT
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rrs-footer">
        {focusedRunner && (
          <div className="rrs-footer-info">
            <span className="muted">Selected:</span>
            <span className="accent">{focusedRunner.name}</span>
            {!canStart && validation && (
              <span className="muted">
                {validation.missing.length > 0
                  ? ` — missing: ${validation.missing.join(', ')}`
                  : validation.errors.length > 0
                    ? ` — ${validation.errors.length} syntax error(s)`
                    : ' — not ready'}
              </span>
            )}
          </div>
        )}
        <button
          className="btn-primary btn-rrs-start"
          disabled={!canStart}
          onClick={() => { if (canStart) startRace() }}
        >
          START — {race.subtitle}
        </button>
      </div>
    </div>
  )
}
