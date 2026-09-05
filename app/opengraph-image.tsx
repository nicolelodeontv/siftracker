import { ImageResponse } from 'next/og'

export const alt = 'SIF Tracker — Production Time Calculator'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
          background: '#0A0A0B',
          color: '#F7FAFC',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            fontWeight: 700,
            color: '#A78BFA',
            marginBottom: 24,
          }}
        >
          SIF TRACKER
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: '-2px',
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          Production Time Calculator
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: '#A1A1AA',
            marginTop: 28,
          }}
        >
          Calculate workload time and estimated clock-out in seconds.
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
