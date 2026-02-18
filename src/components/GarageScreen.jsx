import React from 'react'

export default function GarageScreen({ state, setScreen, reset }) {
  const { credits, ownedInstructions, racesCompleted, runners, selectedRunnerId, hasVisitedManual } = state
  const selectedRunner = runners.find(r => r.id === selectedRunnerId)

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
            <div className="stat-label">RUNNER</div>
            <div className="stat-value">{selectedRunner?.name ?? '—'}</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">RACES</div>
            <div className="stat-value">{racesCompleted}</div>
          </div>
        </div>

        <div className="garage-nav">
          <button className="nav-card" onClick={() => setScreen('marketplace')}>
            <div className="nav-card-tag">SHOP</div>
            <div className="nav-card-title">Marketplace</div>
            <div className="nav-card-desc">Buy and sell instructions for your runners</div>
            <div className="nav-card-meta">{credits} CR available · {ownedInstructions.size}/12 owned</div>
          </button>

          <button className="nav-card" onClick={() => setScreen('runners')}>
            <div className="nav-card-tag">BUILD</div>
            <div className="nav-card-title">Garage</div>
            <div className="nav-card-desc">Create and manage your algorithm versions</div>
            <div className="nav-card-meta">{runners.length} runner{runners.length !== 1 ? 's' : ''}</div>
          </button>

          <button className="nav-card nav-card-race" onClick={() => setScreen('raceSelect')}>
            <div className="nav-card-tag">COMPETE</div>
            <div className="nav-card-title">Race</div>
            <div className="nav-card-desc">Select a circuit and start competing</div>
            <div className="nav-card-meta">{racesCompleted > 0 ? `${racesCompleted} race${racesCompleted !== 1 ? 's' : ''} completed` : 'No records yet'}</div>
          </button>

          <button className={`nav-card nav-card-tutorial ${!hasVisitedManual ? 'attention' : ''}`} onClick={() => setScreen('tutorial')}>
            <div className="nav-card-tag">LEARN</div>
            <div className="nav-card-title">Manual</div>
            <div className="nav-card-desc">How to play, assembly reference, tips</div>
            <div className="nav-card-meta">Read before your first race</div>
          </button>
        </div>
      </div>

      <footer className="garage-footer">
        <button className="btn-ghost btn-sm" onClick={reset}>Reset save</button>
      </footer>
    </div>
  )
}
