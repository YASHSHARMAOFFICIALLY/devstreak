# DevStreak

DevStreak is a developer-focused accountability dashboard for tracking daily goals, building streaks, reviewing progress with AI, and turning GitHub activity into visible proof-of-work. The application combines habit tracking, public progress sharing, and weekly reflection into a single workflow designed for developers who want to stay consistent.

## Overview

DevStreak helps users define daily development goals, mark progress, review public GitHub activity, generate nightly AI reviews, and share selected wins to a public wall. It uses Supabase for authentication and persistence, Anthropic for AI review generation, and GitHub public events for developer activity signals.

## Problem

Developers often start projects with momentum but lose consistency because their goals, actual coding activity, and reflection live in separate places. Generic habit trackers do not understand developer output, and GitHub alone does not explain whether the work matched the user's intended goals.

## Solution

DevStreak connects daily intent with visible proof-of-work. It gives builders a daily operating loop: define the work, check real progress, review the day with AI, detect burnout risk, and share selected wins publicly.

The product is built around a simple loop:

1. Sign in with GitHub.
2. Create daily development goals.
3. Mark goals as done, skipped, or pending.
4. Generate a daily review with focus score and burnout signal.
5. Compare progress against GitHub activity.
6. Review weekly progress and share completed work publicly.

## Features

- GitHub OAuth authentication through Supabase
- Daily goal tracking with status updates
- Public GitHub activity signals on the dashboard
- Developer streak calculation
- 30-day activity heatmap
- Achievement badges based on consistency and completed work
- AI-generated nightly reviews
- Focus scoring and burnout flagging
- Weekly review timeline with aggregate stats
- AI-generated weekly summary
- Public wall for shared progress updates
- Tweet draft generation for completed goals
- Responsive dashboard, review, goals, and wall pages

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Authentication | Supabase Auth |
| Database | Supabase Postgres |
| AI | Anthropic API |
| Icons | Lucide React |
| Package Manager | npm |

## Project Structure

```text
src/
  app/
    (app)/
      dashboard/       Authenticated dashboard
      goals/           Goal management
      review/          Weekly and daily review pages
      wall/            Public progress wall
    api/
      auth/github/     GitHub OAuth start route
      github/activity/ Public GitHub activity signal endpoint
      generate-review/ Daily AI review generation
      review/          Review persistence endpoint
      wall/            Public wall sharing endpoint
      weekly-summary/  Weekly AI summary generation
    auth/callback/     Supabase OAuth callback
    page.tsx           Landing page
  components/          Reusable UI components
  lib/
    supabase/          Supabase browser/server clients
    date.ts            App timezone date helpers
  middleware.ts        Auth session refresh and route protection
```

## Requirements

- Node.js 20 or newer
- npm
- Supabase project
- Anthropic API key
- GitHub OAuth provider configured in Supabase

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_TIME_ZONE=Asia/Kolkata
NEXT_PUBLIC_DEMO_MODE=false
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous public key |
| `ANTHROPIC_API_KEY` | Yes | API key used for daily and weekly AI reviews |
| `NEXT_PUBLIC_APP_TIME_ZONE` | No | App date timezone. Defaults to `Asia/Kolkata` |
| `NEXT_PUBLIC_DEMO_MODE` | No | Enables seeded demo mode for the whole deployment when set to `true` |

## Demo Mode

Judges can open a seeded demo without creating an account:

```text
/demo
```

This route sets a short-lived demo cookie and redirects to the dashboard with realistic goals, logs, AI reviews, GitHub activity, and wall posts. The normal authenticated product remains available unless `NEXT_PUBLIC_DEMO_MODE=true` is set.

## Database Tables

The code expects the following Supabase tables:

- `users`
- `goals`
- `daily_logs`
- `ai_reviews`
- `wall_posts`

A production-ready setup should define these tables with row-level security policies so each authenticated user can only access and mutate their own private records, while public wall posts can be read by visitors.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run start    # Start the production server
npm run lint     # Run Next.js linting
```

## Authentication Flow

DevStreak uses Supabase GitHub OAuth:

1. The user clicks "Sign in with GitHub".
2. `/api/auth/github` starts the Supabase OAuth flow.
3. Supabase redirects back to `/auth/callback`.
4. The callback exchanges the code for a session.
5. User profile data is upserted into the `users` table.
6. Authenticated users are routed into the dashboard.

## AI Review Flow

Daily reviews are generated from the user's active goals and daily logs. The review endpoint calculates completion data, focus score, streak context, and skip patterns, then requests a structured review from Anthropic.

The generated review includes:

- Focus analysis
- Daily performance review
- Recommendation for tomorrow
- Burnout risk signal

Weekly summaries use the last seven days of goals, logs, and reviews to generate a concise progress analysis.

## GitHub Activity Flow

DevStreak reads the authenticated user's stored GitHub username and loads recent public GitHub events from the GitHub public events API. Pushes, pull requests, and issue activity are summarized into dashboard signals that help users connect stated goals with actual developer output.

## Deployment

The app can be deployed to Vercel or any platform that supports Next.js.

Before deploying:

1. Add all environment variables to the hosting provider.
2. Configure Supabase Auth redirect URLs for the production domain.
3. Confirm Supabase row-level security policies are enabled.
4. Confirm `/demo` works for judging and fallback demos.
5. Run a production build locally:

```bash
npm run build
```

## Repository Notes

- Generated files such as `.next/`, `node_modules/`, and `tsconfig.tsbuildinfo` are ignored.
- Local secrets are stored in `.env.local` and should never be committed.
- The project uses `package-lock.json`; avoid committing lockfiles from other package managers unless the package manager is intentionally changed.

## License

No license has been specified yet.
