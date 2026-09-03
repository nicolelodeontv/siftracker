'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0A0B] text-[#F4F4F5]">
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <section className="w-full max-w-md rounded-xl border border-[#262A30] bg-[#15171A] p-6 text-center shadow-2xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#A1A7B0]">SIF Tracker</p>
            <h1 className="mt-2 text-xl font-bold">The app needs a refresh.</h1>
            <p className="mt-2 text-sm leading-5 text-[#A1A7B0]">A critical page error occurred. Retry to reload the tracker.</p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#0EA5E9] px-4 text-[10px] font-bold text-white"
            >
              Reload tracker
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
