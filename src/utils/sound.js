// Synthesized sounds via Web Audio API — no external files needed.
// Two sounds: navigate (cursor move / screen enter) and confirm (selection).

let _ctx = null

function getCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function tone({ freq, gain, attack, decay, type = 'sine' }) {
  const c = getCtx()
  if (!c) return
  try {
    const now = c.currentTime
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.connect(g)
    g.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(gain, now + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay)
    osc.start(now)
    osc.stop(now + attack + decay + 0.05)
  } catch {}
}

// Light cursor-move click — for WASD navigation and screen entry
export function playNavigate() {
  tone({ freq: 1700, gain: 0.09, attack: 0.001, decay: 0.022 })
}

// Satisfying confirmation — for selecting / confirming actions
export function playConfirm() {
  tone({ freq: 1050, gain: 0.14, attack: 0.002, decay: 0.055 })
  tone({ freq: 1575, gain: 0.05, attack: 0.003, decay: 0.038 })
}
