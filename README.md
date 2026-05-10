# DevStreak

DevStreak is a habit and accountability dashboard for developers. It tracks daily goals, streaks, AI-generated reviews, and public progress updates.

## Features

- GitHub sign-in with Supabase auth
- Daily goals with done, skipped, and pending states
- Streak tracking and 30-day activity heatmap
- AI nightly reviews with focus score and burnout flag
- Weekly review timeline and AI summary
- Public wall posts with tweet draft generation

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase
- Anthropic API

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_TIME_ZONE=Asia/Kolkata
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
