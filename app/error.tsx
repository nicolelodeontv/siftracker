'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('SIF Tracker route error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-[0_8px_28px_var(--card-shadow)]">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">SIF Tracker</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight">Something went wrong.</h1>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">The tracker hit an unexpected error. You can retry without losing your saved workload rates.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-[10px] font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </section>
    </main>
  )
}
