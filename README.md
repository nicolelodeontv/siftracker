# SIF Tracker

A lightweight production workload tracker that turns workload quantities into total work time and an estimated clock-out time.

## 🌐 Live Demo

https://sif-tracker-omega.vercel.app/

## ✨ Features

- Instant workload time calculation
- Supports expressions such as `5+5`, `10*3`, and `(5+5)*2`
- Optional checked totals such as `4+8+12=24`
- Per-workload `−` / `+` quantity controls
- Per-workload clear (`×`) control
- Clear invalid-expression feedback
- Combined **One total, all workloads** result
- Estimated **Clock Out** calculation
- Fixed 1-hour break included in clock-out calculation
- Live Philippine Time (PHT) clock
- Clock In defaults to the current Philippine time when the page opens
- **Now** button to sync Clock In with the current PHT clock
- Clock Out copy button copies only the clock-out time
- Editable workload rates from Settings
- Save and Reset controls for workload rates
- Rate changes automatically update calculator examples and time calculations
- Light and dark mode support
- Responsive desktop and mobile layouts
- Touch-friendly controls and inputs
- Accessible labels and status feedback
- Subtle UX motion with reduced-motion support
- Page inputs reset on refresh while saved workload rates persist

## ⏱️ Default Workload Rates

The default production estimates are:

| Activity | Time per Unit |
| --- | ---: |
| Team Edit | 15 minutes / team |
| Indi Clip | 5 minutes / individual |
| Indi Edit | 5 minutes / individual |
| Indi Build | 4 minutes / order |
| Late Orders | 15 minutes / order |

Rates can be changed from **Settings** without editing the source code. Changes take effect in the calculator after saving.

## 🧮 Example

Entering:

```text
Team Edit: 5+5
```

produces:

```text
10 teams
```

and the corresponding work duration based on the current Team Edit rate.

The calculator also supports checked expressions:

```text
4+8+12=24
```

The expression is accepted only when the declared total matches the calculated result.

## 🕒 Clock Out Calculation

SIF Tracker combines:

```text
Clock In
+ Total Work Time
+ 01:00:00 Break
= Estimated Clock Out
```

The Clock In field starts with the current Philippine time when the page opens. The **Now** button can re-sync it to the live PHT clock at any time.

The live header clock displays the current Philippine date and time in `HH:MM:SS` format.

## 🛠️ Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React
- shadcn/ui tooling
- pnpm
- Vercel

## 📁 Project Structure

```text
siftracker/
├── app/
│   ├── page.tsx          # Main tracker UI and calculator logic
│   ├── globals.css       # Global theme and shared styles
│   ├── mobile.css        # Responsive desktop/mobile layout rules
│   └── motion.css        # UX motion and interaction styles
├── components/           # Reusable UI components
├── public/               # Static assets
├── package.json          # Project scripts and dependencies
├── pnpm-lock.yaml        # Locked dependency versions
├── next.config.mjs       # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

Install:

- Node.js
- pnpm

### Install dependencies

```bash
pnpm install
```

### Start the development server

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

### Create a production build

```bash
pnpm build
pnpm start
```

### Run linting

```bash
pnpm lint
```

## 🔧 How It Works

Each workload has a configurable time-per-unit rate. The app evaluates the entered expression, multiplies the resulting quantity by the active rate, and combines all workload durations into one total.

When workload is present, the Shift section uses the selected Clock In time plus the total workload time and the fixed 1-hour break to calculate the estimated Clock Out time.

Changing a workload rate in Settings also updates the calculator results and the example conversions shown on the workload cards.

## 📱 Mobile Support

The interface is designed to work across phones, tablets, and desktop screens.

On smaller screens:

- Workload cards switch to a single-column layout.
- Inputs and quantity controls use touch-friendly sizing.
- Text wraps naturally to avoid clipping.
- Workflow and Shift sections stack vertically.
- Footer spacing is kept compact and consistent with the rest of the page.
- The full tracker remains vertically scrollable.

## ✅ Build Verification

The production app is continuously deployed from the `main` branch. A production build can be checked locally with:

```bash
pnpm install --frozen-lockfile
pnpm run build
```

## 🚢 Deployment

SIF Tracker is a Next.js application deployed through Vercel.

The `main` branch is the source of truth for production deployments.

Live deployment:

https://sif-tracker-omega.vercel.app/

## 📌 Notes

SIF Tracker is intended as a production planning and time-estimation utility. Workload rates are configurable and should be updated when production requirements change.

Entered workload values are intentionally session-only and are cleared when the page is refreshed. Saved workload rates remain stored locally in the browser.

## 👤 Author

**Nicole John Dela Cruz**

GitHub: https://github.com/nicolelodeontv

## 📄 License

No open-source license is currently specified. Unless a license is added to this repository, the source code should be treated as **all rights reserved** by the repository owner.
