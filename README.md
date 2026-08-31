# SIF Tracker

A lightweight production workload estimator for calculating time requirements across different Sports In Focus production activities.

## 🌐 Live Demo

https://sif-tracker-omega.vercel.app/

## ✨ Features

- Live workload time calculation
- Per-category production time estimates
- Combined total production estimate
- Quick reset control
- Input validation for supported quantity expressions
- Supports simple calculations such as `4+8+12`
- Supports optional checked totals such as `4+8+12=24`
- Responsive desktop and mobile layout
- Mobile-friendly scrolling and stacked workload cards
- Touch-friendly inputs and controls
- Light and dark mode support
- Accessible labels and live output updates

## ⏱️ Workload Rates

The current production estimates are:

| Activity | Time per Unit |
| --- | ---: |
| Team Edit | 15 minutes / team |
| Indi Clip | 5 minutes / individual |
| Indi Edit | 5 minutes / individual |
| Indi Build | 4 minutes / order |
| Late Orders | 15 minutes / order |

These values are defined by the application and can be adjusted when production requirements change.

## 🧮 Example

If the workload is:

```text
Team Edit:   4 teams × 15 min = 60 min
Indi Clip:  12 indIs × 5 min = 60 min
Indi Build: 15 orders × 4 min = 60 min
```

SIF Tracker automatically combines the estimates and displays the total production time.

## 🛠️ Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide React
- shadcn/ui tooling
- Vercel Analytics
- pnpm

## 📁 Project Structure

```text
siftracker/
├── app/                  # Next.js application pages and styles
│   ├── page.tsx          # Main tracker UI
│   ├── globals.css       # Global theme and layout styles
│   └── mobile.css        # Mobile responsive styles
├── components/           # Reusable UI components
├── lib/                  # Utility functions
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

Each production activity has a fixed time-per-unit value. The application multiplies the entered quantity by that value, converts the result into a readable duration, and adds the category estimates together.

The total updates instantly as values are entered, making it useful for quickly estimating production workload before or during a work session.

## 📱 Mobile Support

The interface is designed to work on phones and tablets as well as desktop screens.

On smaller screens:

- Workload cards switch to a single-column layout.
- The hero heading and description wrap naturally.
- Inputs use larger touch-friendly sizing.
- The workflow total stacks vertically for easier reading.
- The page uses normal vertical scrolling so the full tracker remains accessible.

## ✅ Build Verification

The repository includes an automated build check for changes pushed to `main` or opened as pull requests. The check installs dependencies with the lockfile and runs the production build:

```bash
pnpm install --frozen-lockfile
pnpm run build
```

This helps catch dependency, TypeScript, Next.js, and build-time configuration errors before deployment.

## 🚢 Deployment

SIF Tracker is a Next.js application and can be deployed to Vercel or another platform that supports Next.js.

For Vercel deployments, the intended source of truth is the `main` branch of this repository.

The current live version is available at:

https://sif-tracker-omega.vercel.app/

## 📌 Notes

SIF Tracker is intended as a production planning and estimation utility. The workload rates are application-defined and may need to be updated as production requirements change.

## 👤 Author

**Nicole John Dela Cruz**

GitHub: https://github.com/nicolelodeontv

## 📄 License

No open-source license is currently specified. Unless a license is added to this repository, the source code should be treated as **all rights reserved** by the repository owner.
