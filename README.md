# DevStreak

DevStreak is an AI-powered accountability platform for developers who want to build consistent shipping habits. It combines daily goal tracking, GitHub-based authentication, AI-generated reviews, streak analytics, and a public accountability wall into one focused workflow.

Built for a hackathon, DevStreak is designed around a simple loop: set meaningful developer goals, mark what actually shipped, get a sharp AI review, and share the progress publicly.

## Problem

Developers often start projects with momentum but lose consistency because progress is scattered across notes, GitHub activity, chats, and memory. Generic habit trackers do not understand developer workflows, and productivity dashboards rarely create real accountability.

DevStreak solves this by turning daily developer work into a visible, reviewable streak system with AI feedback and public proof-of-work sharing.

## Solution

DevStreak gives builders a daily operating system for consistency:

- Track active developer goals by category.
- Mark each goal as done, skipped, or pending.
- Maintain streaks based on completed work.
- Generate AI accountability reviews from the day's actual data.
- Detect focus quality and burnout risk.
- Share completed progress to a live public Streak Wall.
- View weekly review history and performance trends.

## Key Features

### GitHub Authentication

Users sign in with GitHub through Supabase Auth. The app creates or updates a user profile and uses GitHub identity as the foundation for developer accountability.

### Goal Management

Users can create, pause, reactivate, and delete goals. Goals are grouped into practical developer categories such as code, learning, open source, fitness, and other.

### Daily Dashboard

The dashboard is the main daily workflow:

- Shows active goals for the current day.
- Tracks done, skipped, and pending states.
- Updates streak information.
- Shows achievement badges and GitHub activity signals.
- Allows users to generate an AI review after logging progress.

### AI Daily Review

DevStreak uses Anthropic's API to generate daily accountability reviews based on:

- Active goals.
- Completed goals.
- Skipped goals.
- Pending goals.
- Current streak.
- User-selected mode.

The review includes a focus score and burnout flag, helping users see not only whether they worked, but how sustainable the day looked.

### Weekly Review

The review area summarizes the last seven days of activity with:

- Daily completion stats.
- Focus scores.
- Burnout indicators.
- Best day detection.
- Most skipped goal insight.
- Links into individual daily reviews.

### Live Streak Wall

The Streak Wall turns progress into public accountability. Users can share completed goals as public posts with:

- Streak count.
- Goal title and category.
- AI review snippet.
- Focus score.
- Tweet draft.
- Copy and tweet actions.
- Search, sorting, filtering, refresh, and realtime updates.

### Showcase Seeding

The app includes a showcase seeding route for hackathon demos. Authenticated users can seed realistic goals, logs, reviews, and wall posts into their own account to quickly demonstrate the full product flow.

## Tech Stack

- **Framework:** Next.js 14 App Router
- **Language:** TypeScript
- **UI:** React, Tailwind CSS, lucide-react
- **Auth:** Supabase Auth with GitHub OAuth
- **Database:** Supabase Postgres
- **Realtime:** Supabase realtime channels
- **AI:** Anthropic SDK
- **Smooth UI:** Lenis

## Architecture

```text
User
  |
  v
Next.js App Router
  |
  |-- Public landing page
  |-- Protected app layout
  |-- Dashboard
  |-- Goals
  |-- Reviews
  |-- Streak Wall
  |
  v
Supabase
  |
  |-- Auth
  |-- users
  |-- goals
  |-- daily_logs
  |-- ai_reviews
  |-- wall_posts
  |
  v
Anthropic API
  |
  |-- Daily reviews
  |-- Weekly summaries
  |-- Tweet drafts
```

## Core Data Model

The app expects these Supabase tables:

- `users`: profile, GitHub username, avatar, streak count, review mode.
- `goals`: user goals, category, active state.
- `daily_logs`: per-day status for each goal.
- `ai_reviews`: generated review content, focus score, burnout flag.
- `wall_posts`: public progress posts shared to the Streak Wall.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- Supabase project
- GitHub OAuth provider configured in Supabase
- Anthropic API key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_APP_TIME_ZONE=Asia/Kolkata
NEXT_PUBLIC_DEMO_MODE=false
```

### Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If port `3000` is busy, Next.js will automatically use another port.

### Build

```bash
npm run build
```

### Start Production Build

```bash
npm run start
```

## Demo Flow

For hackathon judging, the recommended demo path is:

1. Sign in with GitHub.
2. Create or seed demo data.
3. Open the dashboard.
4. Mark goals as done or skipped.
5. Generate the AI daily review.
6. Share a completed goal to the Streak Wall.
7. Open the Streak Wall and show search, sort, refresh, tweet, and copy actions.
8. Open the weekly review page to show progress history and burnout signals.

## API Routes

- `POST /api/generate-review`: Generates and stores an AI review for the selected day.
- `POST /api/review`: Generates a basic day review for a specific date.
- `GET /api/wall`: Returns public wall posts for the live feed.
- `POST /api/wall`: Creates or updates a public wall post for a completed goal.
- `GET /api/github/activity`: Fetches recent public GitHub activity signals.
- `POST /api/weekly-summary`: Generates an AI summary of weekly performance.
- `GET /api/seed-showcase`: Seeds demo data for the authenticated user.

## Why It Stands Out

DevStreak is not just a habit checklist. It is built specifically for developers and connects three accountability layers:

- **Private tracking:** daily goals and streaks.
- **AI reflection:** specific feedback based on actual completion data.
- **Public proof:** shareable progress on the Streak Wall.

This makes the product useful beyond the hackathon demo: it can become a lightweight accountability tool for indie hackers, open-source contributors, students, and builders trying to ship consistently.

## Project Status

The core product loop is implemented:

- Authentication
- Goal tracking
- Daily dashboard
- AI review generation
- Weekly review view
- Live Streak Wall
- Public sharing workflow
- Demo seeding flow

Future improvements could include team walls, GitHub commit verification, leaderboard scoring, richer analytics, push reminders, and exportable progress cards.

## License

This project was built for hackathon demonstration purposes. Add a license before distributing or using it commercially.
