import React from 'react'
import { validateRunner } from '../utils/runner.js'

export default function RunnersScreen({ state, setScreen, goBack, createRunner, deleteRunner, editRunner }) {
  const { runners, ownedInstructions } = state

  return (
    <div className="screen runners-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={goBack}>← BACK</button>
        <div className="screen-title">GARAGE</div>
        <button className="btn-primary btn-sm" onClick={createRunner}>+ NEW RUNNER</button>
      </div>

      <div className="runners-body">
        <div className="runners-hint muted">
          Select a runner to use in races. Edit to modify its code. A runner must compile and use only
          owned instructions to be race-eligible.
        </div>

        <div className="runner-list">
          {runners.map(runner => {
            const v = validateRunner(runner.code, ownedInstructions)

            return (
              <div key={runner.id} className={`runner-card ${v.ok ? '' : 'invalid'}`}>
                <div className="runner-card-left">
                  <div className="runner-card-top">
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
                    &nbsp;·&nbsp;
                    {new Date(runner.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="runner-card-actions">
                  <button
                    className="btn-edit"
                    onClick={() => editRunner(runner.id)}
                    title="Edit in IDE"
                  >
                    EDIT
                  </button>
                  <button
                    className="btn-del"
                    disabled={runners.length <= 1}
                    onClick={() => deleteRunner(runner.id)}
                    title="Delete runner"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
