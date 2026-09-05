import { Analytics } from '@vercel/analytics/next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { WelcomePopup } from '@/components/welcome-popup'
import './globals.css'
import './page-order.css'
import './sidebar-overrides.css'

const siteUrl = 'https://sif-tracker-omega.vercel.app'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SIF Tracker | Production Time Calculator',
    template: '%s | SIF Tracker',
  },
  description: 'SIF Tracker is a fast production workload calculator that estimates work time and clock-out time for edits, clips, builds, and late orders.',
  applicationName: 'SIF Tracker',
  keywords: [
    'SIF Tracker',
    'production time calculator',
    'workload calculator',
    'work time calculator',
    'clock out calculator',
    'shift calculator',
    'production workload tracker',
    'Philippine time tracker',
  ],
  authors: [{ name: 'Nicole John Dela Cruz' }],
  creator: 'Nicole John Dela Cruz',
  publisher: 'SIF Tracker',
  category: 'productivity',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'SIF Tracker',
    title: 'SIF Tracker | Production Time Calculator',
    description: 'Calculate production workload time and estimated clock-out time quickly and accurately.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'SIF Tracker | Production Time Calculator',
    description: 'A fast production workload and clock-out time calculator.',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0B' },
  ],
}

const themeBootstrap = `(() => {
  try {
    const saved = localStorage.getItem('sif-theme')
    const theme = saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  } catch {}
})()`

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SIF Tracker',
  url: siteUrl,
  description: 'A production workload calculator for estimating work time and clock-out time.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@type': 'Person', name: 'Nicole John Dela Cruz' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable} bg-background`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <WelcomePopup />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
