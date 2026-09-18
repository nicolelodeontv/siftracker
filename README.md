# SIF Tracker

A lightweight production workload tracker that turns workload quantities into total work time and an estimated clock-out time.

## 🌐 Live Demo

[https://sif-tracker-omega.vercel.app/](https://sif-tracker-omega.vercel.app/)

## ✨ Features

- Instant workload time calculation
- Expressions such as `5+5`, `10*3`, and `(5+5)*2`
- Optional checked totals such as `4+8+12=24`
- Direct quantity/expression input per workload, with a per-row clear (`×`) control
- Live running **Total** row (combined quantity and work time across all workloads)
- Clear incomplete and invalid-expression feedback
- Estimated **Clock Out** calculation with a fixed 1-hour break, once workload is entered
- Live Philippine Time (PHT) clock in `HH:MM:SS`, fixed to PHT regardless of visitor location
- Manually editable **Clock In** time, with a **NOW** button to sync to live PHT
- Live **Progress** and **Time Until Clock Out** once clocked in with workload entered
- `SHIFT COMPLETE` state when the calculated shift has reached Clock Out
- Location-aware **weather widget** (see below)
- Editable workload rates from Settings, saved locally
- Light and dark mode support, with matching light/dark favicon variants
- Responsive desktop and mobile layouts with touch-friendly controls
- Workload inputs reset on refresh while saved rates persist locally

## 🌤️ Weather Widget

The header shows live weather for the visitor, resolved in this order:

1. **Browser geolocation** (`navigator.geolocation`) — precise, requires permission, 5-second timeout.
2. **Vercel IP geolocation headers** (`x-vercel-ip-latitude`, `x-vercel-ip-longitude`, `x-vercel-ip-city`, `x-vercel-ip-timezone`) — silent fallback if permission is denied or geolocation is unavailable. Shown as an "Approx." location since IP-based lookup is only a general reference.
3. **Local development fallback** — a fixed Cebu City location, used only when `NODE_ENV`/`VERCEL_ENV` is `development` and neither of the above resolves. Never used in production.

Weather data itself comes from [Open-Meteo](https://open-meteo.com/) (`timezone=auto`, so the weather timestamp follows the visitor's resolved location) and is cached client-side for 15 minutes to avoid redundant requests. If location can't be resolved at all in production, the API returns a `502` and the widget shows a neutral placeholder rather than a broken state.

The main PHT clock is intentionally **not** affected by any of this — shift timing always stays on `Asia/Manila` regardless of who's viewing the page.

## ⏱️ Default Workload Rates

| Activity Time per Unit  |                        |
| ----------------------- | ---------------------- |
| Team Edit               | 15 minutes / team      |
| Indi Clip               | 5 minutes / individual |
| Indi Edit               | 5 minutes / individual |
| Indi Build              | 4 minutes / order      |
| Late Orders             | 15 minutes / order     |

Rates can be changed from **Settings** without editing source code. Saving a rate immediately changes the calculator and example conversions.

## 🧮 Expression Engine

The calculator engine is separated from the UI in `lib/calculator.ts` and is responsible for expression parsing, duration formatting, clock math, and edge-case handling.

Supported examples:

```text
5+5
10*3
(5+5)*2
4+8+12=24

```

Expressions with incomplete operators show **Waiting for expression…**. Invalid expressions show **Invalid expression** instead of silently failing.

## 🕒 Clock Out Calculation

The shift calculation (`lib/shift.ts`) follows:

```text
Clock In
+ Total Work Time (from entered workload quantities)
+ 01:00:00 Break
= Estimated Clock Out

```

Break, Total Hours, and Progress only populate once at least one workload quantity is entered — before that, they show as empty (`–`) by design. The live PHT clock is the source of truth for the page. The Clock In field can be edited manually, and the **NOW** button re-syncs it to the current PHT time.

## 🛠️ Backend Foundation

```text
GET /api/workloads   # Centralized workload configuration (used for a lightweight readiness check)
GET /api/health       # Health check
GET /api/weather      # Resolves visitor location and returns current weather

```

The API is intentionally stateless and read-only — there is no database. Workload rates are validated centrally in `lib/workloads.ts` but persisted entirely client-side via `localStorage` (`lib/rates-storage.ts`), which keeps the app simple and compatible with serverless deployment. A database can be added later for multi-device synchronization or shared user profiles without moving the calculator engine back into the page component.

## 🧪 Reliability and Tests

The calculator engine has a dedicated test suite covering:

- Basic arithmetic
- Multiplication and parentheses
- Checked totals
- Division by zero
- Invalid and incomplete expressions
- Duration formatting
- Military clock formatting
- Clock parsing
- Midnight elapsed-time handling

Run tests with:

```bash
pnpm test

```

Run the complete verification pipeline with:

```bash
pnpm check

```

`pnpm check` runs linting, calculator tests, and the production build.

## 🏗️ Architecture

The main UI is a client component; calculation rules, shift math, and workload/weather logic are independent modules.

```text
app/
├── page.tsx                 # UI, React state, interactions
├── layout.tsx                # Metadata, fonts, theme bootstrap, favicon config
├── api/
│   ├── health/route.ts      # Health endpoint
│   ├── weather/route.ts     # Geolocation + weather resolution
│   └── workloads/route.ts   # Workload configuration (GET only)
├── globals.css               # Base styles, Tailwind v4 theme tokens
├── motion.css / readability.css / ui-overrides.css / button-normalization.css

components/
├── workload-card.tsx         # Today's workload table
├── workload-settings.tsx     # Rate editing panel
├── clock-in-picker.tsx       # Manual Clock In editor
├── pht-live-time.tsx         # Live PHT clock display
├── weather-widget.tsx        # Location-aware weather header widget
├── theme-toggle.tsx          # Light/dark toggle
├── welcome-popup.tsx         # Quick Guide
└── ui/button.tsx

lib/
├── calculator.ts             # Pure expression/duration/clock engine
├── shift.ts                  # Clock-in/out, break, progress math (PHT-aware)
├── workloads.ts               # Central workload/rate definitions + validation
├── rates-storage.ts          # Client-side rate persistence (localStorage)
├── weather.ts                 # Open-Meteo fetch + formatting
├── use-philippine-clock.ts   # PHT formatting helpers
└── utils.ts

tests/
└── calculator.test.mjs

```

## 📱 Mobile Support

The interface is designed for phones, tablets, and desktop screens.

On smaller screens:

- The workload table switches to a stacked layout.
- Inputs remain touch-friendly with generous tap targets now that quantity is entered directly (no separate +/- controls to misfire).
- Text wraps naturally to avoid clipping.
- The full tracker remains vertically scrollable.

## 🚀 Getting Started

### Prerequisites

Install Node.js and pnpm.

### Install dependencies

```bash
pnpm install

```

### Development

```bash
pnpm dev

```

Open `http://localhost:3000`.

### Production build

```bash
pnpm build
pnpm start

```

### Lint

```bash
pnpm lint

```

### Tests

```bash
pnpm test

```

### Full check

```bash
pnpm check

```

## 🔐 Persistence

The tracker intentionally keeps daily workload inputs session-only. Refreshing the page clears entered workload values and resets Clock In to the current PHT time.

Saved workload rates and time-format preference persist locally in the browser via `localStorage`. Weather results are cached client-side for 15 minutes. Theme preference is handled by the theme component.

Shift history is not stored because the current product direction is a fast daily calculator rather than a history dashboard.

## 🚢 Deployment

SIF Tracker is a Next.js application deployed through Vercel.

The `main` branch is the source of truth for production deployments. GitHub Actions runs linting, calculator tests, and a production build on pushes and pull requests to `main`.

Live deployment:

[https://sif-tracker-omega.vercel.app/](https://sif-tracker-omega.vercel.app/)

## 📌 Notes

The calculator engine is deliberately independent from the UI. This makes future layout, mobile, or interaction changes less likely to alter calculation behavior.

The backend API is a stateless, read-only foundation (workload config, health, weather). Persistent multi-user data can be added later with a database/authentication layer when needed.

## 👤 Author

**Nicole John Dela Cruz**

GitHub: [https://github.com/nicolelodeontv](https://github.com/nicolelodeontv)

## 📄 License

No open-source license is currently specified. Unless a license is added to this repository, the source code should be treated as **all rights reserved** by the repository owner.
