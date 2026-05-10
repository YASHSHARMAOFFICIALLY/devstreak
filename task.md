# DevStreak Build Progress

## Done
- [x] Scaffolded Next.js 14 app
- [x] Installed deps (@supabase/supabase-js, @supabase/ssr, lucide-react, clsx, @anthropic-ai/sdk)
- [x] Supabase client + server helpers
- [x] Middleware (session refresh + route guard)
- [x] Auth callback route (github_username upsert)
- [x] GitHub OAuth API route
- [x] globals.css + layout.tsx
- [x] Landing page (/)
- [x] Sidebar component
- [x] StreakBadge component
- [x] GoalCard component
- [x] WallCard component (updated with focus_score + AI review snippet)
- [x] ReviewCard component
- [x] (app) layout with sidebar
- [x] /dashboard page + DashboardClient
- [x] /goals page
- [x] /wall page — public feed with avatar, username, goal, streak, focus score, AI snippet
- [x] /review page — weekly digest (metrics, CSS bar chart, review timeline, weekly summary)
- [x] /review/[date] page — single day review
- [x] /api/generate-review — Anthropic AI nightly review
- [x] /api/wall — shares goal to wall, generates tweet with Anthropic (claude-haiku)
- [x] /api/review — basic review upsert
- [x] /api/weekly-summary — 7-day Anthropic summary (strongest/weakest/recommendation)
- [x] Dashboard: "Share to wall" button after review generated
- [x] Dashboard: Tweet draft (copyable textarea + Post to X link) after sharing
- [x] Dashboard: Visual progress card (HTML/CSS) after sharing
- [x] Build passes (npx next build ✓)
- [x] Dev server running on port 3000

## Blockers
- None — requires real Supabase + Anthropic keys in .env.local to function
