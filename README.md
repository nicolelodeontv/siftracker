# SIF Tracker

SIF Tracker is a simple internal production estimate tool for calculating workload time across different production activities.

## Overview

The calculator provides live time estimates for:

- **Team Edit** — 15 minutes per team
- **Indi Clip** — 5 minutes per individual
- **Indi Edit** — 5 minutes per individual
- **Indi Build** — 4 minutes per order
- **Late Orders** — 15 minutes per order

Enter quantities for each workload and SIF Tracker automatically calculates the estimated time for each category and a combined total.

The calculator also supports simple additions such as `4+8+12`, and an optional checked total such as `4+8+12=24`.

## Features

- Live workload time calculation
- Combined production time estimate
- Reset-all control
- Input validation for supported quantity expressions
- Responsive layout for desktop and mobile
- Accessible labels and live output updates

## Tech Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- TypeScript
- Tailwind CSS
- Lucide React
- shadcn/ui tooling
- Vercel Analytics

## Getting Started

### Prerequisites

Make sure you have Node.js and pnpm installed.

### Installation

```bash
pnpm install
```

### Run locally

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

## How It Works

Each workload has a fixed time-per-unit value. The application multiplies the entered quantity by that value, converts the result into a readable duration, and adds all workload durations together for the combined estimate.

For example:

```text
Team Edit:   4 teams × 15 min = 60 min
Indi Clip:  12 indis × 5 min = 60 min
Indi Build: 15 orders × 4 min = 60 min
```

The combined total is updated instantly as values are entered.

## Project Structure

```text
siftracker/
├── app/                  # Next.js application pages and styles
├── components/           # Reusable UI components
├── lib/                  # Utility functions
├── public/                # Static assets
├── package.json           # Project scripts and dependencies
├── next.config.mjs        # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## Deployment

The project is configured as a Next.js application and can be deployed to Vercel or another platform that supports Next.js.

## Notes

SIF Tracker is intended as an internal production planning and estimation utility. The workload rates are currently defined in the application and can be updated in `app/page.tsx` as production requirements change.
