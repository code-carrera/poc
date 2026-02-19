import React, { useEffect, useRef, useState, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { INSTRUCTIONS } from '../data/instructions.js'
import { validateRunner } from '../utils/runner.js'

const INSTRUCTION_NAMES = Object.keys(INSTRUCTIONS).join('|')
const INSTR_REGEX = new RegExp(`^(${INSTRUCTION_NAMES})\\b`, 'i')

const assemblyLang = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.peek() === ';') { stream.skipToEnd(); return 'comment' }
    if (stream.match(/^[a-zA-Z_]\w*:/)) return 'labelName'
    if (stream.match(INSTR_REGEX)) return 'keyword'
    if (stream.match(/^r[0-3]\b/)) return 'variableName'
    if (stream.match(/^#-?\d+/)) return 'number'
    if (stream.match(/^[a-zA-Z_]\w*/)) return 'name'
    stream.next()
    return null
  },
})

const assemblyTheme = HighlightStyle.define([
  { tag: tags.keyword,      color: '#c678dd', fontWeight: '600' },
  { tag: tags.labelName,    color: '#e5c07b' },
  { tag: tags.comment,      color: '#5c6370', fontStyle: 'italic' },
  { tag: tags.number,       color: '#d19a66' },
  { tag: tags.variableName, color: '#61afef' },
  { tag: tags.name,         color: '#98c379' },
])

const editorTheme = EditorView.theme({
  '&': { backgroundColor: '#141414', color: '#e0e0e0', height: '100%' },
  '.cm-content': { fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', padding: '12px 0' },
  '.cm-gutters': { backgroundColor: '#1a1a1a', borderRight: '1px solid #333', color: '#555' },
  '.cm-activeLineGutter': { backgroundColor: '#1e1e1e' },
  '.cm-activeLine': { backgroundColor: '#1e1e1e' },
  '.cm-cursor': { borderLeftColor: '#e67e22' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#3d4d5a' },
}, { dark: true })

export default function IDEScreen({ state, setScreen, goBack, updateRunner, buyInstruction }) {
  const { runners, editingRunnerId, ownedInstructions, credits } = state
  const runner = runners.find(r => r.id === editingRunnerId) ?? runners[0]

  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const [validation, setValidation] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(runner?.name ?? '')

  const validate = useCallback((src) => {
    setValidation(validateRunner(src, ownedInstructions))
  }, [ownedInstructions])

  // Re-validate when owned instructions change (e.g. after buying from sidebar)
  useEffect(() => {
    if (runner) validate(runner.code)
  }, [validate]) // validate is recreated when ownedInstructions changes

  // Mount editor
  useEffect(() => {
    if (!editorRef.current || !runner) return

    const startState = EditorState.create({
      doc: runner.code,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        assemblyLang,
        syntaxHighlighting(assemblyTheme),
        editorTheme,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const newCode = update.state.doc.toString()
            updateRunner(runner.id, { code: newCode })
            validate(newCode)
          }
        }),
      ],
    })

    const view = new EditorView({ state: startState, parent: editorRef.current })
    viewRef.current = view
    validate(runner.code)

    return () => view.destroy()
  }, [runner?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!runner) return null

  const canRace = validation?.ok

  const commitName = () => {
    if (nameInput.trim()) updateRunner(runner.id, { name: nameInput.trim() })
    setEditingName(false)
  }

  return (
    <div className="screen ide-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={goBack}>← BACK</button>

        {editingName ? (
          <input
            className="runner-name-input"
            value={nameInput}
            autoFocus
            onChange={e => setNameInput(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
          />
        ) : (
          <button className="runner-name-btn screen-title" onClick={() => { setEditingName(true); setNameInput(runner.name) }}>
            {runner.name} ✎
          </button>
        )}

        <div className="ide-header-actions">
          {validation && (
            <span className={`validation-badge ${canRace ? 'ok' : 'err'}`}>
              {canRace ? '✓ READY' : `${validation.errors.length + validation.missing.length} issue(s)`}
            </span>
          )}
          <span className="saved-badge">SAVED ✓</span>
        </div>
      </div>

      <div className="ide-body">
        <div className="ide-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">INSTRUCTIONS</div>
            <div className="instr-tags">
              {Object.entries(INSTRUCTIONS).map(([name, info]) => {
                const owned = ownedInstructions.has(name)
                const used = validation?.usedOps?.includes(name)
                const canBuy = !owned && credits >= info.cost

                return (
                  <span
                    key={name}
                    className={`instr-tag ${owned ? 'owned' : 'missing'} ${used ? 'used' : ''} ${!owned ? (canBuy ? 'buyable' : 'no-credits') : ''}`}
                    title={owned ? info.desc : `${info.cost} CR — ${info.desc}`}
                    data-price={`${info.cost} CR`}
                    onClick={canBuy ? () => buyInstruction(name, info.cost) : undefined}
                  >
                    {name}
                  </span>
                )
              })}
            </div>
            <div className="sidebar-credits muted">{credits} CR available</div>
          </div>

          {validation?.errors?.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-label error-label">ERRORS</div>
              <div className="error-list">
                {validation.errors.map((e, i) => <div key={i} className="error-item">{e}</div>)}
              </div>
            </div>
          )}

          {validation?.missing?.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-label error-label">NOT OWNED</div>
              <div className="error-list">
                {validation.missing.map(op => (
                  <div key={op} className="error-item">
                    {op}
                    {credits >= INSTRUCTIONS[op].cost
                      ? <button className="btn-buy-inline ml" onClick={() => buyInstruction(op, INSTRUCTIONS[op].cost)}>{INSTRUCTIONS[op].cost} CR</button>
                      : <span className="muted"> — {INSTRUCTIONS[op].cost} CR (insufficient)</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <div className="sidebar-label">REGISTERS</div>
            <div className="register-list muted">
              <div>r0  r1  r2  r3</div>
              <div className="register-note">32-bit integer, general purpose</div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">QUICK REF</div>
            <div className="syntax-examples muted">
              <div><span className="kw">MOV</span> r0, #5</div>
              <div><span className="kw">MOV</span> r0, r1</div>
              <div><span className="kw">LOAD</span> r0, r1 <em>; arr[r1]</em></div>
              <div><span className="kw">LEN</span>  r0</div>
              <div><span className="kw">ADD</span>  r0, #1</div>
              <div><span className="kw">CMP</span>  r0, r1</div>
              <div><span className="kw">JGT</span>/<span className="kw">JLT</span>/<span className="kw">JEQ</span> label</div>
              <div><span className="kw">SLIDER_1</span> r0</div>
              <div><span className="kw">SLIDER_2</span> r0</div>
              <div><span className="kw">RET</span>  r0</div>
            </div>
          </div>
        </div>

        <div className="editor-wrap" ref={editorRef} />
      </div>
    </div>
  )
}
