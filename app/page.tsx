'use client'

import { Fragment, useMemo, useState } from 'react'
import { RotateCcw, TimerReset } from 'lucide-react'

type Workload = {
  id: string
  label: string
  unit: string
  minutesPerUnit: number
  accent: string
  examples: string[]
}

const workloads: Workload[] = [
  {
    id: 'teamEdit',
    label: 'Team edit',
    unit: 'teams',
    minutesPerUnit: 15,
    accent: 'var(--chart-1)',
    examples: ['1 team = 15 mins', '4 teams = 1 hour', '16 teams = 4 hours', '32 teams = 8 hours'],
  },
  {
    id: 'indiClip',
    label: 'Indi clip',
    unit: 'indis',
    minutesPerUnit: 5,
    accent: 'var(--chart-2)',
    examples: ['1 indi = 5 mins', '12 indi = 1 hour', '48 indi = 4 hours', '96 indi = 8 hours'],
  },
  {
    id: 'indiEdit',
    label: 'Indi edit',
    unit: 'indis',
    minutesPerUnit: 5,
    accent: 'var(--chart-3)',
    examples: ['1 indi = 5 mins', '12 indi = 1 hour', '48 indi = 4 hours', '96 indi = 8 hours'],
  },
  {
    id: 'indiBuild',
    label: 'Indi build',
    unit: 'orders',
    minutesPerUnit: 4,
    accent: 'var(--chart-4)',
    examples: ['1 order = 4 mins', '15 orders = 1 hour', '60 orders = 4 hours', '120 orders = 8 hours'],
  },
  {
    id: 'lateOrders',
    label: 'Late orders',
    unit: 'orders',
    minutesPerUnit: 15,
    accent: 'var(--chart-5)',
    examples: ['1 order = 15 mins', '4 orders = 1 hour', '16 orders = 4 hours', '32 orders = 8 hours'],
  },
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
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(workloads.map((workload) => [workload.id, ''])),
  )

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
    } catch {
      return null
    }
  }

  const totalMinutes = useMemo(
    () => workloads.reduce((total, workload) => total + (calculateValue(values[workload.id]) ?? 0) * workload.minutesPerUnit, 0),
    [values],
  )

  function updateValue(id: string, value: string) {
    if (!/^[\d+*/().=\s-]*$/.test(value)) return
    setValues((current) => ({ ...current, [id]: value }))
  }

  function reset() {
    setValues(Object.fromEntries(workloads.map((workload) => [workload.id, ''])))
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="flex flex-col gap-8 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-sif-green">
              <TimerReset aria-hidden="true" className="size-4" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em]">SIF / Operations</span>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-primary sm:text-6xl">SIF Tracker</h1>
              <p className="max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                Estimate production time across edits, clips, builds, and late orders.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:self-auto"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Reset all
          </button>
        </header>

        <section aria-labelledby="calculator-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id="calculator-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Workload calculator
            </h2>
            <span className="font-mono text-xs text-muted-foreground">Live estimate</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {workloads.map((workload) => (
              <Fragment key={workload.id}>
                <article className="flex flex-col gap-6 rounded-xl border border-border/80 bg-card/80 p-5 shadow-none backdrop-blur-sm sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: workload.accent }} />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold text-foreground">{workload.label}</h3>
                      <p className="text-sm text-muted-foreground">{workload.minutesPerUnit} minutes per {workload.unit.slice(0, -1)}</p>
                    </div>
                  </div>
                  <output
                    className="font-mono text-right text-lg font-semibold tabular-nums"
                    style={{ color: workload.accent }}
                    aria-live="polite"
                  >
                    {formatDuration((calculateValue(values[workload.id]) ?? 0) * workload.minutesPerUnit)}
                  </output>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Number of {workload.unit}</span>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values[workload.id]}
                      onChange={(event) => updateValue(workload.id, event.target.value)}
                      aria-label={`${workload.label} ${workload.unit}`}
                      className="h-14 w-full rounded-lg border border-input bg-background/70 px-4 pr-20 font-mono text-lg tabular-nums text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                    />
                    {calculateValue(values[workload.id]) !== null && (
                      <output className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-lg tabular-nums text-foreground opacity-50" aria-label="Calculated result">
                        {calculateValue(values[workload.id])}
                      </output>
                    )}
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 border-t border-border pt-4 sm:grid-cols-4">
                  {workload.examples.map((example) => (
                    <span key={example} className="whitespace-nowrap font-mono text-[10px] font-semibold leading-5 tracking-tight text-sif-green">{example}</span>
                  ))}
                </div>
                </article>
                {workload.id === 'lateOrders' && (
                  <section aria-label="Total estimated time" className="flex flex-col gap-4 rounded-lg bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">Combined total</span>
                      <span className="text-sm opacity-80">Across all entered workloads</span>
                    </div>
                    <strong className="font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{formatDuration(totalMinutes)}</strong>
                  </section>
                )}
              </Fragment>
            ))}
          </div>
        </section>
        <footer className="border-t border-border pt-4 text-center font-mono text-xs text-muted-foreground">
          <p>SIF Tracker — internal production estimate tool</p>
          <p>Created by Nicole</p>
        </footer>
      </div>
    </main>
  )
}
