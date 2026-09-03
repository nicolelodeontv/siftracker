'use client'

import { Check } from 'lucide-react'

type Feedback = 'saved' | 'reset' | 'copied' | 'cleared' | 'save-warning'

const messages: Record<Feedback, string> = {
  saved: 'Rates saved',
  'save-warning': 'Saved locally',
  reset: 'Workload reset',
  cleared: 'All workloads cleared',
  copied: 'Clock Out copied',
}

export function FeedbackToast({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] font-semibold shadow-lg" role="status" aria-live="polite">
      <Check className="size-3 shrink-0 text-primary" aria-hidden="true" />
      <span className="truncate">{messages[feedback]}</span>
    </div>
  )
}
