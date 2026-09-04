'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sif-theme'

type Theme = 'light' | 'dark'

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const preferred = getPreferredTheme()
    applyTheme(preferred)
    setTheme(preferred)
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement

    root.classList.add('theme-switching')
    applyTheme(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    setTheme(next)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => root.classList.remove('theme-switching'))
    })
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="theme-toggle group inline-flex h-10 w-[92px] shrink-0 items-center gap-2 rounded-full border border-border bg-card/80 px-3 text-xs font-semibold text-foreground shadow-sm backdrop-blur transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:text-foreground">
        {theme === 'dark' ? <Moon className="size-3.5" aria-hidden="true" /> : <Sun className="size-3.5" aria-hidden="true" />}
      </span>
      <span className="theme-toggle__label w-[34px] text-center">{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
