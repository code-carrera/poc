import React from 'react'

function Section({ title, children }) {
  return (
    <div className="tut-section">
      <div className="tut-section-title">{title}</div>
      {children}
    </div>
  )
}

function Code({ children }) {
  return <code className="tut-code">{children}</code>
}

export default function TutorialScreen({ setScreen, goBack }) {
  return (
    <div className="screen tutorial-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={goBack}>← BACK</button>
        <div className="screen-title">MANUAL</div>
      </div>

      <div className="tutorial-scroller">
        <div className="tutorial-body">
          <Section title="What is Code Carrera?">
            <p>
              Code Carrera is a competitive programming platform where you don't race cars — you
              race <strong>algorithms</strong>. You act as a technical director: you write a program
              in a low-level assembly language, tune its parameters in real-time, and compete for
              the best time on data circuits.
            </p>
          </Section>

          <Section title="The Flow">
            <ol className="tut-steps">
              <li><strong>Marketplace</strong> — Buy instructions with your starting credits (250 CR). Each instruction has a cost.</li>
              <li><strong>Garage</strong> — Write your algorithm. You can create multiple named versions.</li>
              <li><strong>Race</strong> — Select a circuit. Your runner processes work units (data problems). Each correct answer moves your car one step forward.</li>
              <li><strong>Tune</strong> — Adjust the slider in real-time during the race to refine your algorithm's behavior.</li>
              <li><strong>Earn</strong> — Finish the circuit to earn credits. Use them to buy more instructions.</li>
            </ol>
          </Section>

          <Section title="The Assembly Language">
            <p className="muted">Your runner is written in a simple low-level language. Registers: <Code>r0  r1  r2  r3</Code> (32-bit integers).</p>
            <div className="tut-table">
              <div className="tut-row"><Code>MOV rx, #n</Code><span>Set register to immediate value</span></div>
              <div className="tut-row"><Code>MOV rx, ry</Code><span>Copy register to register</span></div>
              <div className="tut-row"><Code>LOAD rx, ry</Code><span>Load <Code>arr[ry]</Code> into <Code>rx</Code></span></div>
              <div className="tut-row"><Code>LEN rx</Code><span>Store array length in <Code>rx</Code></span></div>
              <div className="tut-row"><Code>ADD rx, src</Code><span><Code>rx = rx + src</Code> (src = register or #imm)</span></div>
              <div className="tut-row"><Code>SUB rx, src</Code><span><Code>rx = rx - src</Code></span></div>
              <div className="tut-row"><Code>CMP rx, src</Code><span>Compare — sets flags for the next jump</span></div>
              <div className="tut-row"><Code>JGT label</Code><span>Jump if last CMP: first &gt; second</span></div>
              <div className="tut-row"><Code>JLT label</Code><span>Jump if last CMP: first &lt; second</span></div>
              <div className="tut-row"><Code>JEQ label</Code><span>Jump if last CMP: equal</span></div>
              <div className="tut-row"><Code>JMP label</Code><span>Unconditional jump</span></div>
              <div className="tut-row"><Code>SLIDER_1 rx</Code><span>Read slider 1 value into <Code>rx</Code> (use for first threshold)</span></div>
              <div className="tut-row"><Code>SLIDER_2 rx</Code><span>Read slider 2 value into <Code>rx</Code> (use for second threshold)</span></div>
              <div className="tut-row"><Code>RET rx</Code><span>Return the value of <Code>rx</Code> as your answer</span></div>
            </div>
            <p className="muted tut-note">Labels are defined by ending a line with <Code>:</Code> (e.g., <Code>my_loop:</Code>). Comments start with <Code>;</Code>.</p>
          </Section>

          <Section title="Circuit 01 — Sum or Max">
            <p>
              Each work unit is an integer array. Your runner must return:
            </p>
            <ul className="tut-list">
              <li>The <strong>SUM</strong> of all elements, if <Code>arr[0] ≤ threshold</Code></li>
              <li>The <strong>MAX</strong> of all elements, if <Code>arr[0] &gt; threshold</Code></li>
            </ul>
            <p>
              The <strong>threshold is hidden and changes every race</strong>. You must discover it by watching
              the results and adjusting <strong>SLIDER_1</strong>:
            </p>
            <ul className="tut-list">
              <li>If arrays with <em>large</em> first elements are returning wrong answers → your slider is too high (treating MAX cases as SUM)</li>
              <li>If arrays with <em>small</em> first elements are wrong → your slider is too low</li>
              <li>Watch the log panel: it shows what your runner returned vs. what was expected</li>
            </ul>
          </Section>

          <Section title="The Sliders">
            <p>
              During a race, use <strong>A/D</strong> to adjust the active slider by ±1, and <strong>Shift+A/D</strong> for ±10.
              The value is read by <Code>SLIDER_1</Code> / <Code>SLIDER_2</Code> each time a new work unit is processed —
              changes take effect immediately on the next unit.
              On circuits with multiple sliders, use <strong>W/S</strong> to switch between them.
            </p>
          </Section>

          <Section title="Race Mechanics">
            <ul className="tut-list">
              <li><strong>Steps</strong>: Circuit 01 has 20 steps. Each correct answer advances your car one step.</li>
              <li><strong>Work units</strong>: You have 100 total. Wrong answers still consume a unit — no do-overs.</li>
              <li><strong>DNF</strong>: If all 100 work units are used before completing 20 steps, you're disqualified.</li>
              <li><strong>Personal best</strong>: Measured in total work units used. Fewer = faster.</li>
              <li><strong>Processor</strong>: Runs at 100 Hz. Each instruction costs at least 1 cycle.</li>
            </ul>
          </Section>

          <Section title="Tips">
            <ul className="tut-list">
              <li>Start the race immediately, then adjust the slider as you learn from the results.</li>
              <li>The threshold is random each race — pay attention and adapt quickly.</li>
              <li>A perfect slider means 100% correct answers. You'd finish in just 20 work units.</li>
              <li>You can sell instructions you don't use for 60% of their cost.</li>
              <li>You can have multiple runners with different strategies — name them clearly.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}
