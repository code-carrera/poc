const MAX_CYCLES = 10000

function resolve(src, regs) {
  if (src.type === 'reg') return regs[src.name]
  return src.value
}

/**
 * Execute a program on a given array with slider values.
 * sliderValues: [s1, s2, s3] — one value per SLIDER_N slot.
 * Returns { result: number, cycles: number } or { error: string, cycles: number }
 */
export function execute({ program, labels, arr, sliderValues, ownedInstructions }) {
  const regs = { r0: 0, r1: 0, r2: 0, r3: 0 }
  const flags = { gt: false, eq: false, lt: false }
  let pc = 0
  let cycles = 0

  while (pc < program.length && cycles < MAX_CYCLES) {
    const instr = program[pc]

    if (!ownedInstructions.has(instr.op)) {
      return { error: `Instruction ${instr.op} not owned`, cycles }
    }

    cycles++

    switch (instr.op) {
      case 'MOV':
        regs[instr.dst] = resolve(instr.src, regs)
        pc++
        break

      case 'LOAD': {
        const idx = resolve(instr.src, regs)
        regs[instr.dst] = idx >= 0 && idx < arr.length ? arr[idx] : 0
        pc++
        break
      }

      case 'LEN':
        regs[instr.dst] = arr.length
        pc++
        break

      case 'ADD':
        regs[instr.dst] += resolve(instr.src, regs)
        pc++
        break

      case 'SUB':
        regs[instr.dst] -= resolve(instr.src, regs)
        pc++
        break

      case 'CMP': {
        const a = regs[instr.left]
        const b = resolve(instr.src, regs)
        flags.gt = a > b
        flags.eq = a === b
        flags.lt = a < b
        pc++
        break
      }

      case 'JGT':
        pc = flags.gt ? labels[instr.label] : pc + 1
        break

      case 'JLT':
        pc = flags.lt ? labels[instr.label] : pc + 1
        break

      case 'JEQ':
        pc = flags.eq ? labels[instr.label] : pc + 1
        break

      case 'JMP':
        pc = labels[instr.label]
        break

      case 'SLIDER_1':
        regs[instr.dst] = (sliderValues ?? [])[0] ?? 0
        pc++
        break

      case 'SLIDER_2':
        regs[instr.dst] = (sliderValues ?? [])[1] ?? 0
        pc++
        break

      case 'SLIDER_3':
        regs[instr.dst] = (sliderValues ?? [])[2] ?? 0
        pc++
        break

      case 'RET':
        return { result: resolve(instr.src, regs), cycles }

      default:
        return { error: `Unknown instruction: ${instr.op}`, cycles }
    }
  }

  if (cycles >= MAX_CYCLES) return { error: 'Max cycles exceeded (infinite loop?)', cycles }
  return { error: 'Program ended without RET', cycles }
}
