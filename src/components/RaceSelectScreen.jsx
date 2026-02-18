import React, { useState, useEffect } from 'react'
import { RACES } from '../data/races.js'
import { playNavigate } from '../utils/sound.js'

function DifficultyDots({ level }) {
  return (
    <span className="difficulty">
      {[1, 2, 3].map(i => (
        <span key={i} className={`dot ${i <= level ? 'filled' : ''}`} />
      ))}
    </span>
  )
}

export default function RaceSelectScreen({ state, setScreen, goBack, startChallenge }) {
  const { personalBests } = state
  const races = Object.values(RACES)
  const [focused, setFocused] = useState(0)

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'w') {
        e.preventDefault()
        playNavigate()
        setFocused(f => Math.max(0, f - 1))
      } else if (e.key === 's') {
        e.preventDefault()
        playNavigate()
        setFocused(f => Math.min(races.length - 1, f + 1))
      } else if (e.key === 'a' || e.key === 'Escape') {
        e.preventDefault()
        goBack() // goBack plays playConfirm()
      } else if ((e.key === 'd' || e.key === 'Enter') && !races[focused]?.locked) {
        e.preventDefault()
        startChallenge(races[focused].id) // startChallenge plays playConfirm()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focused, goBack, startChallenge, races])

  return (
    <div className="screen race-select-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={goBack}>← BACK</button>
        <div className="screen-title">SELECT CHALLENGE</div>
      </div>

      <div className="challenge-list-hint muted">
        <span className="kw">W/S</span> navigate · <span className="kw">D</span> or Enter to select
      </div>

      {/* Challenge list */}
      <div className="circuit-list">
        {races.map((race, idx) => {
          const pb = personalBests?.[race.id]

          return (
            <div
              key={race.id}
              className={`circuit-card${race.locked ? ' locked' : ''}${focused === idx ? ' focused' : ''}`}
              onMouseEnter={() => setFocused(idx)}
              onClick={() => { if (!race.locked) startChallenge(race.id) }}
            >
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
                    onClick={(e) => { e.stopPropagation(); startChallenge(race.id) }}
                  >
                    SELECT
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
