'use client'

import { useEffect } from 'react'

function formatExampleDuration(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes * 100) / 100)
  const hours = Math.floor(rounded / 60)
  const remaining = Math.round((rounded % 60) * 100) / 100

  if (hours === 0) return `${remaining}m`
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

function updateExamples() {
  const cards = document.querySelectorAll<HTMLElement>('#calculator article')

  cards.forEach((card) => {
    const rateText = Array.from(card.querySelectorAll('p')).find((element) => /minutes per/i.test(element.textContent ?? ''))?.textContent ?? ''
    const match = rateText.match(/(\d+(?:\.\d+)?)\s+minutes\s+per\s+(.+)$/i)
    if (!match) return

    const rate = Number(match[1])
    const unit = match[2].trim().toLowerCase()
    if (!Number.isFinite(rate) || rate <= 0) return

    const exampleContainer = card.querySelector('.border-t.border-border')
    if (!exampleContainer) return

    const spans = Array.from(exampleContainer.querySelectorAll('span'))
    const amounts = unit === 'team' ? [1, 4, 16, 32] : unit === 'indi' ? [1, 12, 48, 96] : [1, 15, 60, 120]

    spans.slice(0, 4).forEach((span, index) => {
      const amount = amounts[index]
      if (!amount) return
      const nextText = `${amount} ${unit}${amount === 1 ? '' : 's'} = ${formatExampleDuration(amount * rate)}`
      if (span.textContent !== nextText) span.textContent = nextText
    })
  })
}

export function DynamicWorkloadExamples() {
  useEffect(() => {
    updateExamples()
    const interval = window.setInterval(updateExamples, 250)
    return () => window.clearInterval(interval)
  }, [])

  return null
}
