export const INSTRUCTIONS = {
  MOV:    { cost: 10,  cycles: 1, category: 'basic',   desc: 'Move value to register',     syntax: 'MOV rx, src' },
  LOAD:   { cost: 30,  cycles: 2, category: 'memory',  desc: 'Load array element',         syntax: 'LOAD rx, idx' },
  LEN:    { cost: 25,  cycles: 1, category: 'memory',  desc: 'Get array length',           syntax: 'LEN rx' },
  ADD:    { cost: 10,  cycles: 1, category: 'alu',     desc: 'Add to register',            syntax: 'ADD rx, src' },
  SUB:    { cost: 10,  cycles: 1, category: 'alu',     desc: 'Subtract from register',     syntax: 'SUB rx, src' },
  CMP:    { cost: 10,  cycles: 1, category: 'alu',     desc: 'Compare two values',         syntax: 'CMP rx, src' },
  JGT:    { cost: 15,  cycles: 1, category: 'control', desc: 'Jump if greater',            syntax: 'JGT label' },
  JLT:    { cost: 15,  cycles: 1, category: 'control', desc: 'Jump if less',               syntax: 'JLT label' },
  JEQ:    { cost: 15,  cycles: 1, category: 'control', desc: 'Jump if equal',              syntax: 'JEQ label' },
  JMP:    { cost: 10,  cycles: 1, category: 'control', desc: 'Unconditional jump',         syntax: 'JMP label' },
  SLIDER_1: { cost: 30,  cycles: 1, category: 'special', desc: 'Read slider 1 value',          syntax: 'SLIDER_1 rx' },
  SLIDER_2: { cost: 50,  cycles: 1, category: 'special', desc: 'Read slider 2 value',          syntax: 'SLIDER_2 rx' },
  SLIDER_3: { cost: 70,  cycles: 1, category: 'special', desc: 'Read slider 3 value',          syntax: 'SLIDER_3 rx' },
  RET:      { cost: 10,  cycles: 1, category: 'special', desc: 'Return value from register',   syntax: 'RET rx' },
}

// Base (non-slider) cost: 160 CR. SLIDER_1: 30, SLIDER_2: 50, SLIDER_3: 70.
// Circuit 1 minimum (all base + SLIDER_1): 190 CR — fits in 250 starting CR.
export const STARTING_CREDITS = 250

export const CATEGORY_LABELS = {
  basic:   'Basic',
  memory:  'Memory',
  alu:     'ALU',
  control: 'Control Flow',
  special: 'Special',
}

export const DEFAULT_CODE = `; Code Carrera — Circuit 01
; ─────────────────────────────────────────────────────
; PRE-MADE TEMPLATE — modify freely or write from scratch
; Task: for each array, return its SUM or MAX.
;   If arr[0] > threshold → return MAX
;   If arr[0] <= threshold → return SUM
; The threshold is HIDDEN. Use SLIDER_1 to find it.
; ─────────────────────────────────────────────────────

  SLIDER_1 r0    ; r0 = your threshold guess
  LOAD r1, #0    ; r1 = arr[0] (first element)
  CMP r1, r0     ; compare first element vs threshold
  JGT find_max   ; if arr[0] > threshold → find max
  JMP find_sum   ; else → find sum

find_max:
  MOV r0, #0     ; r0 = current max
  MOV r1, #0     ; r1 = index
  LEN r2         ; r2 = array length
max_loop:
  CMP r1, r2
  JLT max_body
  JMP max_done
max_body:
  LOAD r3, r1    ; r3 = arr[index]
  CMP r3, r0
  JLT skip_max
  MOV r0, r3     ; update max
skip_max:
  ADD r1, #1
  JMP max_loop
max_done:
  RET r0

find_sum:
  MOV r0, #0     ; r0 = sum
  MOV r1, #0     ; r1 = index
  LEN r2         ; r2 = array length
sum_loop:
  CMP r1, r2
  JLT sum_body
  JMP sum_done
sum_body:
  LOAD r3, r1    ; r3 = arr[index]
  ADD r0, r3     ; sum += element
  ADD r1, #1
  JMP sum_loop
sum_done:
  RET r0
`

export const DEFAULT_CODE_2 = `; Code Carrera — Circuit 02
; ─────────────────────────────────────────────────────
; PRE-MADE TEMPLATE — modify freely or write from scratch
; Task: SUM or MAX, but two hidden thresholds:
;   arr[0] even → compare with SLIDER_1 (even threshold)
;   arr[0] odd  → compare with SLIDER_2 (odd threshold)
; Use W/S to switch between sliders during the race.
; ─────────────────────────────────────────────────────

  LOAD r0, #0    ; r0 = arr[0]
  MOV r1, r0     ; r1 = copy for parity check

; Subtract 2 until r1 < 2 → r1 = 0 (even) or 1 (odd)
parity:
  CMP r1, #2
  JLT parity_done
  SUB r1, #2
  JMP parity

parity_done:
  CMP r1, #0
  JEQ even_branch

odd_branch:
  SLIDER_2 r1    ; r1 = odd threshold
  JMP compare

even_branch:
  SLIDER_1 r1    ; r1 = even threshold

compare:
  CMP r0, r1     ; arr[0] vs threshold
  JGT find_max
  JMP find_sum

find_max:
  MOV r0, #0     ; r0 = current max
  MOV r1, #0     ; r1 = index
  LEN r2         ; r2 = array length
max_loop:
  CMP r1, r2
  JLT max_body
  JMP max_done
max_body:
  LOAD r3, r1    ; r3 = arr[index]
  CMP r3, r0
  JLT skip_max
  MOV r0, r3     ; update max
skip_max:
  ADD r1, #1
  JMP max_loop
max_done:
  RET r0

find_sum:
  MOV r0, #0     ; r0 = sum
  MOV r1, #0     ; r1 = index
  LEN r2         ; r2 = array length
sum_loop:
  CMP r1, r2
  JLT sum_body
  JMP sum_done
sum_body:
  LOAD r3, r1    ; r3 = arr[index]
  ADD r0, r3     ; sum += element
  ADD r1, #1
  JMP sum_loop
sum_done:
  RET r0
`
