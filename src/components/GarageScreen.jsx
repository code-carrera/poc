import React, { useState, useEffect } from 'react'
import { playNavigate } from '../utils/sound.js'

const CARDS = [
  { screen: 'marketplace', tag: 'SHOP',  title: 'Marketplace' },
  { screen: 'runners',     tag: 'BUILD', title: 'Garage'      },
  { screen: 'raceSelect',  tag: 'RUN',   title: 'Challenges'  },
  { screen: 'tutorial',    tag: 'LEARN', title: 'Manual'      },
]

export default function GarageScreen({ state, setScreen, reset }) {
  const { credits, ownedInstructions, racesCompleted, runners, hasVisitedManual } = state
  const [focused, setFocused] = useState(-1)

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'a') {
        e.preventDefault()
        playNavigate()
        setFocused(f => f <= 0 ? CARDS.length - 1 : f - 1)
      } else if (e.key === 'd') {
        e.preventDefault()
        playNavigate()
        setFocused(f => (f + 1) % CARDS.length)
      } else if ((e.key === 'Enter' || e.key === ' ') && focused >= 0) {
        e.preventDefault()
        setScreen(CARDS[focused].screen) // navigate plays playConfirm()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focused, setScreen])

  const cardMeta = [
    `${credits} CR available · ${ownedInstructions.size}/12 owned`,
    `${runners.length} runner${runners.length !== 1 ? 's' : ''}`,
    racesCompleted > 0 ? `${racesCompleted} challenge${racesCompleted !== 1 ? 's' : ''} completed` : 'No records yet',
    'Read before your first challenge',
  ]

  const cardDesc = [
    'Buy and sell instructions for your runners',
    'Create and manage your algorithm versions',
    'Select a challenge and compete',
    'How to play, assembly reference, tips',
  ]

  return (
    <div className="garage-screen">
      <header className="garage-header">
        <div className="logo">
          <span className="logo-code">CODE</span>
          <span className="logo-carrera">CARRERA</span>
        </div>
        <div className="header-sub">
          <span className="header-tag">PILOT YOUR ALGORITHM</span>
        </div>
      </header>

      <div className="garage-body">
        <div className="garage-stats">
          <div className="stat-block">
            <div className="stat-label">CREDITS</div>
            <div className="stat-value accent">{credits} CR</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">INSTRUCTIONS</div>
            <div className="stat-value">{ownedInstructions.size} / 12</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">RUNNERS</div>
            <div className="stat-value">{runners.length}</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">CHALLENGES</div>
            <div className="stat-value">{racesCompleted}</div>
          </div>
        </div>

        <div className="garage-nav">
          {CARDS.map((card, i) => (
            <button
              key={card.screen}
              className={`nav-card${card.screen === 'raceSelect' ? ' nav-card-race' : ''}${card.screen === 'tutorial' && !hasVisitedManual ? ' attention' : ''}${focused === i ? ' focused' : ''}`}
              onClick={() => setScreen(card.screen)}
              onMouseEnter={() => setFocused(i)}
              onMouseLeave={() => setFocused(-1)}
            >
              <div className="nav-card-tag">{card.tag}</div>
              <div className="nav-card-title">{card.title}</div>
              <div className="nav-card-desc">{cardDesc[i]}</div>
              <div className="nav-card-meta">{cardMeta[i]}</div>
            </button>
          ))}
        </div>
      </div>

      <footer className="garage-footer">
        <span className="muted" style={{ fontSize: '10px' }}>A/D navigate · Enter select</span>
        <button className="btn-ghost btn-sm" onClick={reset}>Reset save</button>
      </footer>
    </div>
  )
}
