import React from 'react'
import { INSTRUCTIONS, CATEGORY_LABELS } from '../data/instructions.js'

const CATEGORY_ORDER = ['basic', 'memory', 'alu', 'control', 'special']

export default function MarketplaceScreen({ state, setScreen, goBack, buyInstruction, sellInstruction }) {
  const { credits, ownedInstructions } = state

  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat],
    items: Object.entries(INSTRUCTIONS).filter(([, v]) => v.category === cat),
  }))

  const totalCost = Object.entries(INSTRUCTIONS)
    .filter(([name]) => !ownedInstructions.has(name))
    .reduce((sum, [, v]) => sum + v.cost, 0)

  return (
    <div className="screen marketplace-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={goBack}>← BACK</button>
        <div className="screen-title">MARKETPLACE</div>
        <div className="credits-badge">{credits} CR</div>
      </div>

      <div className="marketplace-hint">
        You own <strong>{ownedInstructions.size}</strong> of 12 instructions.
        {totalCost > 0 && <span className="muted"> Remaining set costs {totalCost} CR.</span>}
      </div>

      <div className="marketplace-grid">
        {grouped.map(({ cat, label, items }) => (
          <div key={cat} className="instr-group">
            <div className="instr-group-label">{label}</div>
            <div className="instr-list">
              {items.map(([name, info]) => {
                const owned = ownedInstructions.has(name)
                const canBuy = !owned && credits >= info.cost
                const sellPrice = Math.floor(info.cost * 0.6)
                return (
                  <div key={name} className={`instr-card ${owned ? 'owned' : ''}`}>
                    <div className="instr-card-top">
                      <span className="instr-name">{name}</span>
                      <span className="instr-cycles">{info.cycles}c</span>
                    </div>
                    <div className="instr-syntax">{info.syntax}</div>
                    <div className="instr-desc">{info.desc}</div>
                    <div className="instr-card-bottom">
                      {owned ? (
                        <>
                          <span className="owned-badge">OWNED</span>
                          <button
                            className="btn-sell"
                            onClick={() => sellInstruction(name, info.cost)}
                          >
                            SELL {sellPrice} CR
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-buy"
                          disabled={!canBuy}
                          onClick={() => buyInstruction(name, info.cost)}
                        >
                          {canBuy ? `BUY ${info.cost} CR` : `${info.cost} CR`}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
