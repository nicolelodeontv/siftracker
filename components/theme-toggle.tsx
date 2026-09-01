'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sif-theme'

type Theme = 'light' | 'dark'

function parseClock(value: string) {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const remaining = safe % 60
  return [hours, minutes, remaining].map((value) => String(value).padStart(2, '0')).join(':')
}

function parseUnits(value: string) {
  const match = value.match(/(-?\d+(?:\.\d+)?)\s+(?:total\s+)?units/i)
  return match ? Math.max(0, Number(match[1])) : 0
}

function setupTrackerEnhancements() {
  const shift = document.querySelector<HTMLElement>('#shift')
  if (!shift) return () => undefined

  let stopped = false
  let frame = 0

  const getPhtSeconds = () => {
    const live = document.querySelector<HTMLElement>('main nav time')?.textContent ?? ''
    const match = live.match(/(\d{2}:\d{2}:\d{2})\s*PHT/i)
    return match ? parseClock(match[1]) : null
  }

  const getClockOut = () => {
    const value = shift.querySelector<HTMLElement>('.grid > div:last-child strong')?.textContent?.trim() ?? '—'
    return value === '—' ? null : parseClock(value)
  }

  const getClockIn = () => {
    const first = shift.querySelector<HTMLElement>('.grid > div:first-child > div')?.textContent?.trim() ?? ''
    return parseClock(first)
  }

  const ensureLiveUi = () => {
    const clockOutCard = shift.querySelector<HTMLElement>('.grid > div:last-child')
    if (!clockOutCard) return

    let status = clockOutCard.querySelector<HTMLElement>('[data-sif-clockout-status]')
    if (!status) {
      status = document.createElement('span')
      status.dataset.sifClockoutStatus = 'true'
      status.className = 'sif-clockout-status'
      clockOutCard.appendChild(status)
    }

    let timeLeft = clockOutCard.querySelector<HTMLElement>('[data-sif-time-left]')
    if (!timeLeft) {
      timeLeft = document.createElement('span')
      timeLeft.dataset.sifTimeLeft = 'true'
      timeLeft.className = 'sif-time-left'
      clockOutCard.appendChild(timeLeft)
    }

    let progress = shift.querySelector<HTMLElement>('[data-sif-progress]')
    if (!progress) {
      progress = document.createElement('div')
      progress.dataset.sifProgress = 'true'
      progress.className = 'sif-progress'
      progress.innerHTML = '<div class="sif-progress-head"><span>SHIFT PROGRESS</span><strong data-sif-progress-value>0%</strong></div><div class="sif-progress-track"><div class="sif-progress-bar" data-sif-progress-bar></div></div>'
      shift.appendChild(progress)
    }

    let today = document.querySelector<HTMLElement>('[data-sif-today]')
    if (!today) {
      today = document.createElement('div')
      today.dataset.sifToday = 'true'
      today.className = 'sif-today'
      const heading = shift.querySelector('div.mb-3')
      heading?.appendChild(today)
    }

    const phtSeconds = getPhtSeconds()
    const clockOut = getClockOut()
    const clockIn = getClockIn()

    if (clockOut === null || phtSeconds === null || clockIn === null) {
      status.textContent = 'Enter a workload to calculate'
      status.className = 'sif-clockout-status is-empty'
      timeLeft.textContent = 'TIME LEFT · —'
      timeLeft.className = 'sif-time-left is-empty'
      progress.querySelector<HTMLElement>('[data-sif-progress-value]')!.textContent = '0%'
      progress.querySelector<HTMLElement>('[data-sif-progress-bar]')!.style.width = '0%'
      today.textContent = formatTodayText()
      return
    }

    const remaining = clockOut >= phtSeconds ? clockOut - phtSeconds : 0
    const complete = phtSeconds >= clockOut
    const totalShift = clockOut >= clockIn ? clockOut - clockIn : clockOut + 86400 - clockIn
    const elapsed = Math.max(0, phtSeconds - clockIn)
    const percent = totalShift > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalShift) * 100))) : 0

    status.textContent = complete ? '✓ SHIFT COMPLETE' : '● ESTIMATED'
    status.className = `sif-clockout-status ${complete ? 'is-complete' : 'is-estimated'}`
    timeLeft.textContent = complete ? 'TIME LEFT · 00:00:00' : `TIME LEFT · ${formatDuration(remaining)}`
    timeLeft.className = `sif-time-left ${complete ? 'is-complete' : ''}`
    progress.querySelector<HTMLElement>('[data-sif-progress-value]')!.textContent = `${percent}%`
    progress.querySelector<HTMLElement>('[data-sif-progress-bar]')!.style.width = `${percent}%`
    today.textContent = formatTodayText()
  }

  const formatTodayText = () => {
    const date = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: '2-digit',
    }).format(new Date())
    const workflowText = document.querySelector<HTMLElement>('#workflow p')?.textContent ?? ''
    const totalText = document.querySelector<HTMLElement>('#workflow strong')?.textContent ?? '00:00:00'
    const units = parseUnits(workflowText)
    return `TODAY · ${date.toUpperCase()}  ·  ${units} total units  ·  ${totalText}`
  }

  const refreshExpressionState = () => {
    document.querySelectorAll<HTMLElement>('#calculator article').forEach((article) => {
      const input = article.querySelector<HTMLInputElement>('input')
      if (!input) return
      const value = input.value.trim()
      const message = Array.from(article.querySelectorAll('p')).find((node) => /Invalid expression|Use numbers or expressions|=/.test(node.textContent ?? '')) as HTMLElement | undefined
      if (!message) return
      const incomplete = value !== '' && /(?:[+*/.=(-]|\s)$/.test(value)
      if (incomplete) {
        message.textContent = 'Waiting for expression…'
        message.className = 'mt-1.5 text-[9px] font-medium text-muted-foreground'
      }
    })
  }

  const enhanceSettings = () => {
    const settings = document.querySelector<HTMLElement>('#settings')
    if (!settings) return
    let preview = settings.querySelector<HTMLElement>('[data-sif-rate-preview]')
    if (!preview) {
      preview = document.createElement('div')
      preview.dataset.sifRatePreview = 'true'
      preview.className = 'sif-rate-preview'
      settings.appendChild(preview)
    }

    const cards = Array.from(settings.querySelectorAll(':scope .grid > div'))
    const examples = cards.map((card) => {
      const label = card.querySelector('span')?.textContent?.trim() ?? ''
      const rateText = Array.from(card.querySelectorAll('button')).find((button) => /\d+m/.test(button.textContent ?? ''))?.textContent?.trim() ?? '0m'
      const rate = Number(rateText.replace(/m/gi, '')) || 0
      if (!label || rate <= 0) return null
      const unit = label.toLowerCase().includes('team') ? 'team' : label.toLowerCase().includes('clip') || label.toLowerCase().includes('edit') ? 'indi' : 'order'
      const amounts = unit === 'team' ? [1, 4, 16, 32] : unit === 'indi' ? [1, 12, 48, 96] : [1, 15, 60, 120]
      return `<div><strong>${label}</strong><span>${amounts.map((amount) => `${amount}${unit === 'team' ? ' team' : unit === 'indi' ? ' indi' : ' order'} = ${formatCompact(amount * rate)}`).join(' · ')}</span></div>`
    }).filter(Boolean)

    preview.innerHTML = `<p>Example</p>${examples.join('')}`
  }

  const formatCompact = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60
    if (hours === 0) return `${remaining}m`
    if (remaining === 0) return `${hours}h`
    return `${hours}h ${remaining}m`
  }

  const nextInput = (current: HTMLInputElement, direction: 1 | -1 = 1) => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('#calculator article input'))
    const index = inputs.indexOf(current)
    const next = inputs[index + direction]
    next?.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const active = document.activeElement as HTMLInputElement | null
    if (event.key === 'Escape') {
      if (active?.matches('#calculator article input')) {
        active.value = ''
        active.dispatchEvent(new Event('input', { bubbles: true }))
        active.dispatchEvent(new Event('change', { bubbles: true }))
      }
      document.querySelector<HTMLButtonElement>('#settings button[aria-label="Close settings"]')?.click()
      return
    }
    if (!active?.matches('#calculator article input')) return

    if (event.key === 'Enter') {
      event.preventDefault()
      nextInput(active)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const delta = event.key === 'ArrowUp' ? 1 : -1
      const button = active.parentElement?.parentElement?.querySelector<HTMLButtonElement>(`button[aria-label*="${delta > 0 ? 'Increase' : 'Decrease'}"]`)
      button?.click()
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      document.querySelector('#shift')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const observer = new MutationObserver(() => {
    if (stopped) return
    ensureLiveUi()
    refreshExpressionState()
    enhanceSettings()
  })
  observer.observe(document.body, { subtree: true, childList: true, characterData: true })

  const inputListener = () => window.setTimeout(refreshExpressionState, 0)
  document.addEventListener('input', inputListener, true)
  document.addEventListener('keydown', onKeyDown, true)

  const tick = () => {
    if (stopped) return
    ensureLiveUi()
    refreshExpressionState()
    frame = window.setTimeout(tick, 1000)
  }

  ensureLiveUi()
  refreshExpressionState()
  enhanceSettings()
  tick()

  return () => {
    stopped = true
    window.clearTimeout(frame)
    observer.disconnect()
    document.removeEventListener('input', inputListener, true)
    document.removeEventListener('keydown', onKeyDown, true)
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const preferred: Theme = saved === 'dark' || saved === 'light'
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

    document.documentElement.classList.toggle('dark', preferred === 'dark')
    document.documentElement.style.colorScheme = preferred
    setTheme(preferred)

    const cleanupEnhancements = setupTrackerEnhancements()
    return cleanupEnhancements
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.style.colorScheme = next
    window.localStorage.setItem(STORAGE_KEY, next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="group inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/80 px-3 text-xs font-semibold text-foreground shadow-sm backdrop-blur transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:text-foreground">
        {theme === 'dark' ? <Moon className="size-3.5" aria-hidden="true" /> : <Sun className="size-3.5" aria-hidden="true" />}
      </span>
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
