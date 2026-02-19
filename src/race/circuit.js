// Hidden threshold range — a random value is picked each race
const THRESHOLD_MIN = 20
const THRESHOLD_MAX = 80

// Race parameters (used as defaults; authoritative data lives in src/data/races.js)
export const RACE = {
  steps: 20,
  totalUnits: 100,
  unitInterval: 900,
  reward: 120,
}

// Processor frequency (display only)
export const PROCESSOR_HZ = 100

// Circuit 01 waypoints — Monaco-inspired street circuit (viewBox 500x300)
// 21 waypoints: index 0 = start/finish, index 20 = same point closing the loop
export const CIRCUIT_WAYPOINTS = [
  { x: 435, y: 175 }, // 0  Start / Finish
  { x: 435, y: 138 }, // 1  SF straight
  { x: 443, y: 105 }, // 2  Casino entry
  { x: 432, y: 76  }, // 3  Casino apex
  { x: 405, y: 56  }, // 4  Casino exit
  { x: 362, y: 43  }, // 5  Top straight
  { x: 305, y: 38  }, // 6  Top straight
  { x: 250, y: 42  }, // 7  Top straight end
  { x: 208, y: 56  }, // 8  Mirabeau / chicane
  { x: 172, y: 80  }, // 9  Beau Rivage
  { x: 142, y: 112 }, // 10 Loews entry
  { x: 112, y: 148 }, // 11 Loews apex
  { x: 118, y: 182 }, // 12 Loews exit
  { x: 148, y: 208 }, // 13 Portier
  { x: 192, y: 232 }, // 14 Tunnel entry
  { x: 255, y: 252 }, // 15 Tunnel
  { x: 322, y: 255 }, // 16 Tunnel
  { x: 375, y: 246 }, // 17 Tunnel exit
  { x: 410, y: 228 }, // 18 Chicane / Swimming Pool
  { x: 428, y: 202 }, // 19 Anthony Noghes
  { x: 435, y: 175 }, // 20 Back to SF
]

// Smooth Catmull-Rom path through all waypoints
export function buildCircuitPath() {
  const pts = CIRCUIT_WAYPOINTS.slice(0, -1) // 20 unique points (closed loop)
  const n = pts.length
  let d = `M ${pts[0].x} ${pts[0].y}`

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`
  }

  return d
}

export function getCarPosition(step) {
  const idx = Math.min(step, RACE.steps)
  return CIRCUIT_WAYPOINTS[idx]
}

/**
 * Generate a single work unit.
 * arr[0] > threshold → expected = max(arr)
 * arr[0] <= threshold → expected = sum(arr)
 */
export function generateWorkUnit(rng, threshold) {
  const r = rng || Math.random
  const length = 5 + Math.floor(r() * 6)
  const arr = Array.from({ length }, () => 1 + Math.floor(r() * 100))
  const needsMax = arr[0] > threshold
  const expected = needsMax
    ? Math.max(...arr)
    : arr.reduce((a, b) => a + b, 0)
  return { arr, expected, needsMax }
}

export function generateRace() {
  const threshold = THRESHOLD_MIN + Math.floor(Math.random() * (THRESHOLD_MAX - THRESHOLD_MIN + 1))
  let s = Date.now()
  const lcg = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  return {
    threshold,
    units: Array.from({ length: RACE.totalUnits }, () => generateWorkUnit(lcg, threshold)),
  }
}

/**
 * Circuit 02 — Even & Odd.
 * Two independent hidden thresholds: one for arrays whose first element is even,
 * one for arrays whose first element is odd.
 * Logic: arr[0] > threshold → return MAX(arr); else → return SUM(arr).
 * SLIDER_1 maps to thresholdEven, SLIDER_2 to thresholdOdd.
 *
 * Thresholds are guaranteed far apart: one in [20,35], one in [65,80].
 * This ensures a ~30+ point gap so a single-slider runner suffers ~30% error rate.
 */
export function generateRace2() {
  const low  = 20 + Math.floor(Math.random() * 16)   // [20, 35]
  const high = 65 + Math.floor(Math.random() * 16)   // [65, 80]
  const [thresholdEven, thresholdOdd] = Math.random() < 0.5 ? [low, high] : [high, low]
  let s = Date.now()
  const lcg = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  const units = Array.from({ length: RACE.totalUnits }, () => {
    const length = 5 + Math.floor(lcg() * 6)
    const arr = Array.from({ length }, () => 1 + Math.floor(lcg() * 100))
    const isEven = arr[0] % 2 === 0
    const threshold = isEven ? thresholdEven : thresholdOdd
    const needsMax = arr[0] > threshold
    const expected = needsMax ? Math.max(...arr) : arr.reduce((a, b) => a + b, 0)
    return { arr, expected, needsMax }
  })
  return { thresholdEven, thresholdOdd, units }
}

/**
 * Build a partial Catmull-Rom path through waypoints 0..nSteps (open curve).
 */
export function buildPartialPath(nSteps) {
  if (nSteps <= 0) return ''
  const pts = CIRCUIT_WAYPOINTS.slice(0, nSteps + 1)
  const n = pts.length
  if (n < 2) return `M ${pts[0].x} ${pts[0].y}`

  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(n - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`
  }
  return d
}
