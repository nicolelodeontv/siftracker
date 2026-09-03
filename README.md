# SIF Tracker

A lightweight production workload tracker that turns workload quantities into total work time and an estimated clock-out time.

## 🌐 Live Demo

https://sif-tracker-omega.vercel.app/

## ✨ Features

- Instant workload time calculation
- Expressions such as `5+5`, `10*3`, and `(5+5)*2`
- Optional checked totals such as `4+8+12=24`
- Per-workload `−` / `+` quantity controls
- Per-workload clear (`×`) control
- Clear incomplete and invalid-expression feedback
- Combined **One total, all workloads** result
- Estimated **Clock Out** calculation with the fixed 1-hour break
- Live Philippine Time (PHT) clock in `HH:MM:SS`
- Manually editable **Clock In** time in military format
- **NOW · HH:MM:SS** button to sync Clock In with live PHT
- Live **Time Until Clock Out** directly under the Clock Out result
- `✓ SHIFT COMPLETE` state when the calculated shift has reached Clock Out
- Worked and Break summaries in the Shift section
- Clock Out copy button copies only the clock-out time
- Editable workload rates from Settings
- Save and Reset controls for workload rates
- Settings example preview updates with the active rates
- Light and dark mode support
- Responsive desktop and mobile layouts
- Touch-friendly controls and accessible labels
- Subtle motion with reduced-motion support
- Workload inputs reset on refresh while saved rates persist locally

## ⏱️ Default Workload Rates

| Activity | Time per Unit |
| --- | ---: |
| Team Edit | 15 minutes / team |
| Indi Clip | 5 minutes / individual |
| Indi Edit | 5 minutes / individual |
| Indi Build | 4 minutes / order |
| Late Orders | 15 minutes / order |

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

The shift calculation follows:

```text
Clock In
+ Total Work Time
+ 01:00:00 Break
= Estimated Clock Out
```

The live PHT clock is the source of truth for the page. The Clock In field can also be edited manually in `HH:MM:SS` format, and the **NOW** button re-syncs it to the current PHT time.

When workload is present, the Shift section shows:

- Clock In
- Worked — workload time only
- Break — fixed 1-hour break
- Clock Out
- Time until clock out
- Shift-complete state when the current PHT time reaches the calculated Clock Out

## 🛠️ Backend Foundation

The app includes a lightweight API foundation without requiring a database:

```text
GET  /api/workloads
POST /api/workloads
GET  /api/health
```

`/api/workloads` exposes the centralized workload configuration and validates rate payloads. The API is intentionally stateless so the application stays simple and compatible with serverless deployment.

Saved workload rates remain in browser storage, which preserves the existing no-database behavior. A database can be added later for multi-device synchronization or shared user profiles without moving the calculator engine back into the page component.

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

The main UI is intentionally kept as a client component, while calculation rules and workload definitions are independent modules:

```text
app/
├── page.tsx                 # UI, React state, interactions
├── api/
│   ├── health/route.ts     # Health endpoint
│   └── workloads/route.ts  # Workload configuration/validation API
├── globals.css
├── mobile.css
└── motion.css

lib/
├── calculator.ts            # Pure calculator and clock engine
└── workloads.ts             # Central workload/rate definitions

tests/
└── calculator.test.mjs      # Calculator engine tests
```

## 📱 Mobile Support

The interface is designed for phones, tablets, and desktop screens.

On smaller screens:

- Workload cards switch to a single-column layout.
- Inputs and quantity controls remain touch-friendly.
- Text wraps naturally to avoid clipping.
- Workflow and Shift content stack vertically.
- Footer spacing remains compact and consistent.
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

The tracker intentionally keeps daily workload inputs session-only. Refreshing the page clears the entered workload values and resets Clock In to the current PHT time.

Saved workload rates persist locally in the browser. Theme preferences are handled by the theme component.

Shift history is not stored because the current product direction is a fast daily calculator rather than a history dashboard.

## 🚢 Deployment

SIF Tracker is a Next.js application deployed through Vercel.

The `main` branch is the source of truth for production deployments. GitHub Actions runs linting, calculator tests, and a production build on pushes and pull requests to `main`.

Live deployment:

https://sif-tracker-omega.vercel.app/

## 📌 Notes

The calculator engine is deliberately independent from the UI. This makes future layout, mobile, or interaction changes less likely to alter calculation behavior.

The backend API is currently a stateless foundation for centralized workload configuration and validation. Persistent multi-user data can be added later with a database/authentication layer when needed.

## 👤 Author

**Nicole John Dela Cruz**

GitHub: https://github.com/nicolelodeontv

## 📄 License

No open-source license is currently specified. Unless a license is added to this repository, the source code should be treated as **all rights reserved** by the repository owner.

<!-- restore-reference-ui -->
