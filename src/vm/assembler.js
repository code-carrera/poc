const REGISTERS = new Set(['r0', 'r1', 'r2', 'r3'])

const OPCODES = new Set([
  'MOV', 'LOAD', 'LEN', 'ADD', 'SUB', 'CMP',
  'JGT', 'JLT', 'JEQ', 'JMP', 'SLIDER', 'RET',
])

function parseSrc(token) {
  if (!token) return null
  if (REGISTERS.has(token)) return { type: 'reg', name: token }
  if (/^#-?\d+$/.test(token)) return { type: 'imm', value: parseInt(token.slice(1), 10) }
  return null
}

function parseLabel(token) {
  if (!token) return null
  if (/^[a-zA-Z_]\w*$/.test(token)) return token
  return null
}

/**
 * Assemble source text into a program array + label map.
 * Returns { program, labels, errors }
 *
 * Each program entry is one of:
 *   { op: 'MOV',    dst: 'r0', src: {type, ...} }
 *   { op: 'LOAD',   dst: 'r0', src: {type, ...} }
 *   { op: 'LEN',    dst: 'r0' }
 *   { op: 'ADD',    dst: 'r0', src: {type, ...} }
 *   { op: 'SUB',    dst: 'r0', src: {type, ...} }
 *   { op: 'CMP',    left: 'r0', src: {type, ...} }
 *   { op: 'JGT'|'JLT'|'JEQ'|'JMP', label: 'name' }
 *   { op: 'SLIDER', dst: 'r0' }
 *   { op: 'RET',    src: {type:'reg', name:'r0'} }
 */
export function assemble(source) {
  const errors = []
  const program = []
  const labels = {}

  // Strip comments and split into lines
  const lines = source.split('\n').map(line => {
    const semi = line.indexOf(';')
    return semi === -1 ? line.trim() : line.slice(0, semi).trim()
  })

  // First pass: collect label positions
  let instrIndex = 0
  for (const line of lines) {
    if (!line) continue
    if (/^\w+:$/.test(line)) {
      const name = line.slice(0, -1)
      if (labels[name] !== undefined) {
        errors.push(`Duplicate label: ${name}`)
      }
      labels[name] = instrIndex
    } else {
      instrIndex++
    }
  }

  // Second pass: parse instructions
  instrIndex = 0
  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo]
    if (!line) continue
    if (/^\w+:$/.test(line)) continue // label definition, skip

    const tokens = line.split(/[\s,]+/).filter(Boolean)
    const op = tokens[0].toUpperCase()

    if (!OPCODES.has(op)) {
      errors.push(`Line ${lineNo + 1}: Unknown instruction "${tokens[0]}"`)
      instrIndex++
      continue
    }

    let instr = null

    switch (op) {
      case 'MOV':
      case 'ADD':
      case 'SUB': {
        const dst = tokens[1]
        if (!REGISTERS.has(dst)) { errors.push(`Line ${lineNo + 1}: ${op} expects register as first arg`); break }
        const src = parseSrc(tokens[2])
        if (!src) { errors.push(`Line ${lineNo + 1}: ${op} expects register or #imm as second arg`); break }
        instr = { op, dst, src }
        break
      }
      case 'LOAD': {
        const dst = tokens[1]
        if (!REGISTERS.has(dst)) { errors.push(`Line ${lineNo + 1}: LOAD expects register as first arg`); break }
        const src = parseSrc(tokens[2])
        if (!src) { errors.push(`Line ${lineNo + 1}: LOAD expects register or #imm as index`); break }
        instr = { op, dst, src }
        break
      }
      case 'LEN': {
        const dst = tokens[1]
        if (!REGISTERS.has(dst)) { errors.push(`Line ${lineNo + 1}: LEN expects register`); break }
        instr = { op, dst }
        break
      }
      case 'CMP': {
        const left = tokens[1]
        if (!REGISTERS.has(left)) { errors.push(`Line ${lineNo + 1}: CMP expects register as first arg`); break }
        const src = parseSrc(tokens[2])
        if (!src) { errors.push(`Line ${lineNo + 1}: CMP expects register or #imm as second arg`); break }
        instr = { op, left, src }
        break
      }
      case 'JGT':
      case 'JLT':
      case 'JEQ':
      case 'JMP': {
        const label = parseLabel(tokens[1])
        if (!label) { errors.push(`Line ${lineNo + 1}: ${op} expects a label`); break }
        if (labels[label] === undefined) { errors.push(`Line ${lineNo + 1}: Undefined label "${label}"`); break }
        instr = { op, label }
        break
      }
      case 'SLIDER': {
        const dst = tokens[1]
        if (!REGISTERS.has(dst)) { errors.push(`Line ${lineNo + 1}: SLIDER expects register`); break }
        instr = { op, dst }
        break
      }
      case 'RET': {
        const src = parseSrc(tokens[1])
        if (!src || src.type !== 'reg') { errors.push(`Line ${lineNo + 1}: RET expects register`); break }
        instr = { op, src }
        break
      }
    }

    if (instr) program.push(instr)
    instrIndex++
  }

  return { program, labels, errors }
}
