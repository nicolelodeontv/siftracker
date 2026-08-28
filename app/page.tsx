'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, RotateCcw, TimerReset } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

type Workload = { id: string; label: string; unit: string; minutesPerUnit: number; accent: string; examples: string[] }

const workloads: Workload[] = [
  { id: 'teamEdit', label: 'Team edit', unit: 'teams', minutesPerUnit: 15, accent: 'var(--chart-1)', examples: ['1 team = 15m', '4 teams = 1h', '16 teams = 4h', '32 teams = 8h'] },
  { id: 'indiClip', label: 'Indi clip', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-2)', examples: ['1 indi = 5m', '12 indi = 1h', '48 indi = 4h', '96 indi = 8h'] },
  { id: 'indiEdit', label: 'Indi edit', unit: 'indis', minutesPerUnit: 5, accent: 'var(--chart-3)', examples: ['1 indi = 5m', '12 indi = 1h', '48 indi = 4h', '96 indi = 8h'] },
  { id: 'indiBuild', label: 'Indi build', unit: 'orders', minutesPerUnit: 4, accent: 'var(--chart-4)', examples: ['1 order = 4m', '15 orders = 1h', '60 orders = 4h', '120 orders = 8h'] },
  { id: 'lateOrders', label: 'Late orders', unit: 'orders', minutesPerUnit: 15, accent: 'var(--chart-5)', examples: ['1 order = 15m', '4 orders = 1h', '16 orders = 4h', '32 orders = 8h'] },
]

function formatDuration(totalMinutes: number) {
  if (totalMinutes === 0) return '0 mins'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`
  if (!minutes) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  return `${hours}h ${minutes}m`
}

export default function Page() {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(workloads.map((workload) => [workload.id, ''])))

  function calculateValue(value: string): number | null {
    const normalized = value.replace(/\s+/g, '')
    if (!normalized || normalized.length > 200 || !/^[\d+*/().=-]+$/.test(normalized)) return null
    const [expression, declaredTotal] = normalized.split('=')
    if (!expression || normalized.split('=').length > 2 || normalized.endsWith('=')) return null
    try {
      const tokens = expression.match(/\d+(?:\.\d+)?|[()+*/-]/g) ?? []
      if (tokens.join('') !== expression) return null
      const parseExpression = (index: { value: number }): number => {
        let result = parseTerm(index)
        while (tokens[index.value] === '+' || tokens[index.value] === '-') {
          const operator = tokens[index.value++]
          const next = parseTerm(index)
          result = operator === '+' ? result + next : result - next
        }
        return result
      }
      const parseTerm = (index: { value: number }): number => {
        let result = parseFactor(index)
        while (tokens[index.value] === '*' || tokens[index.value] === '/') {
          const operator = tokens[index.value++]
          const next = parseFactor(index)
          if (operator === '/' && next === 0) throw new Error('division by zero')
          result = operator === '*' ? result * next : result / next
        }
        return result
      }
      const parseFactor = (index: { value: number }): number => {
        const token = tokens[index.value++]
        if (token === '(') {
          const result = parseExpression(index)
          if (tokens[index.value++] !== ')') throw new Error('unclosed expression')
          return result
        }
        if (token === '-') return -parseFactor(index)
        if (!token || Number.isNaN(Number(token))) throw new Error('invalid expression')
        return Number(token)
      }
      const index = { value: 0 }
      const result = parseExpression(index)
      if (index.value !== tokens.length || !Number.isFinite(result) || Math.abs(result) > 1_000_000) return null
      const roundedResult = Number.isInteger(result) ? result : Number(result.toFixed(2))
      if (declaredTotal !== undefined && Number(declaredTotal) !== roundedResult) return null
      return roundedResult
    } catch { return null }
  }

  const totalMinutes = useMemo(() => workloads.reduce((total, workload) => total + (calculateValue(values[workload.id]) ?? 0) * workload.minutesPerUnit, 0), [values])

  function updateValue(id: string, value: string) {
    if (!/^[\d+*/().=\s-]*$/.test(value)) return
    setValues((current) => ({ ...current, [id]: value }))
  }

  function reset() { setValues(Object.fromEntries(workloads.map((workload) => [workload.id, '']))) }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-[0.25] [background-image:radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-6 sm:px-7 lg:px-8">
        <nav className="flex h-14 items-center justify-between border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><TimerReset className="size-3.5" aria-hidden="true" /></div>
            <div className="leading-none"><span className="block text-sm font-bold tracking-tight">SIF Tracker</span><span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operations</span></div>
          </div>
          <div className="hidden items-center gap-6 text-[11px] font-semibold text-muted-foreground md:flex"><a href="#calculator" className="text-foreground transition hover:text-primary">Calculator</a><a href="#workflow" className="transition hover:text-foreground">Workflow</a><a href="#about" className="transition hover:text-foreground">About</a></div>
          <ThemeToggle />
        </nav>

        <section className="py-8 sm:py-10">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm backdrop-blur"><span className="size-1.5 rounded-full bg-[var(--sif-green)]" aria-hidden="true" />Production time calculator</div>
            <h1 className="text-balance text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">Plan the workload.<br /><span className="text-primary">Know the time.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-5 text-muted-foreground">A fast, focused way to estimate production time across team edits, individual work, builds, and late orders.</p>
          </div>
        </section>

        <section id="calculator" aria-labelledby="calculator-heading" className="scroll-mt-16">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">01 / Calculator</p><h2 id="calculator-heading" className="mt-1 text-lg font-semibold tracking-tight">Enter your workload</h2></div>
            <div className="font-mono text-[10px] text-muted-foreground">Updates instantly</div>
          </div>

          <div className="grid gap-2.5 lg:grid-cols-2">
            {workloads.map((workload) => {
              const calculated = calculateValue(values[workload.id])
              return <article key={workload.id} className="group rounded-xl border border-border bg-card/85 p-3.5 shadow-[0_8px_28px_var(--card-shadow)] backdrop-blur transition duration-200 hover:border-primary/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5"><span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} /><div><h3 className="text-sm font-semibold tracking-tight">{workload.label}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p></div></div>
                  <output aria-live="polite" className="font-mono text-[15px] font-bold tabular-nums" style={{ color: workload.accent }}>{formatDuration((calculated ?? 0) * workload.minutesPerUnit)}</output>
                </div>
                <label className="mt-3 block"><span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Number of {workload.unit}</span><div className="relative"><input type="text" inputMode="numeric" value={values[workload.id]} onChange={(event) => updateValue(workload.id, event.target.value)} aria-label={`${workload.label} ${workload.unit}`} placeholder="0" className="h-11 w-full rounded-lg border border-input bg-background/70 px-3 pr-14 font-mono text-[15px] font-medium tabular-nums outline-none transition placeholder:text-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10" />{calculated !== null && <output className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[15px] font-semibold tabular-nums text-muted-foreground" aria-label="Calculated result">{calculated}</output>}</div></label>
                <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-border pt-2.5 sm:grid-cols-4">{workload.examples.map((example) => <span key={example} className="font-mono text-[8px] font-semibold leading-3.5 tracking-tight text-muted-foreground transition group-hover:text-foreground">{example}</span>)}</div>
              </article>
            })}

            <section id="workflow" className="scroll-mt-16 rounded-xl border border-primary/15 bg-primary p-4 text-primary-foreground shadow-[0_12px_40px_var(--primary-shadow)] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-md"><p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-70">02 / Workflow</p><h3 className="mt-1 text-base font-semibold tracking-tight">One total, all workloads.</h3><p className="mt-1 text-[10px] leading-4.5 opacity-75">The combined estimate updates automatically as you enter quantities above.</p></div>
                <div className="sm:text-right"><span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-60">Combined total</span><strong className="mt-0.5 block font-mono text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl">{formatDuration(totalMinutes)}</strong></div>
              </div>
            </section>
          </div>
        </section>

        <section id="about" className="mt-5 scroll-mt-16 border-y border-border py-4 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">03 / About</p><p className="mt-1 max-w-xl text-[10px] leading-4 text-muted-foreground">Built as a simple internal production planning tool. Type numbers or expressions such as <span className="font-mono text-foreground">4*3</span> directly into any field.</p></div><button type="button" onClick={reset} className="mt-3 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mt-0"><RotateCcw className="size-3" aria-hidden="true" />Reset all<ArrowUpRight className="size-3 opacity-50" aria-hidden="true" /></button></section>
        <footer className="flex flex-col gap-1 py-4 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>SIF Tracker</span><span>Created by Nicole</span></footer>
      </div>
    </main>
  )
}
