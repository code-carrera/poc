import { assemble } from '../vm/assembler.js'
import { INSTRUCTIONS } from '../data/instructions.js'

export function getUsedOps(code) {
  const used = new Set()
  for (const line of code.split('\n')) {
    const stripped = line.replace(/;.*$/, '').trim()
    if (!stripped || /^\w+:$/.test(stripped)) continue
    const op = stripped.split(/[\s,]+/)[0]?.toUpperCase()
    if (op && INSTRUCTIONS[op]) used.add(op)
  }
  return used
}

export function validateRunner(code, ownedInstructions) {
  const { errors } = assemble(code)
  const usedOps = getUsedOps(code)
  const missing = [...usedOps].filter(op => !ownedInstructions.has(op))
  return {
    ok: errors.length === 0 && missing.length === 0,
    errors,
    missing,
    usedOps: [...usedOps],
  }
}
