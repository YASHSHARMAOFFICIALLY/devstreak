import { formatDateKey, lastSevenDateKeys, todayDateKey } from './date'
import { cookies } from 'next/headers'

export const DEMO_COOKIE = 'devstreak_demo'
export const envDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export function isDemoMode() {
  return envDemoMode || cookies().get(DEMO_COOKIE)?.value === 'true'
}

type Category = 'code' | 'fitness' | 'learning' | 'oss' | 'other'
type Status = 'done' | 'skip' | 'pending'

export const demoUser = {
  id: 'demo-user',
  display_name: 'Yash Sharma',
  github_username: 'yashcodes',
  avatar_url: null,
  streak_count: 12,
  mode: 'roast',
}

export const demoGoals = [
  {
    id: 'goal-ship',
    title: 'Ship one meaningful DevStreak improvement',
    category: 'code' as Category,
    is_active: true,
    created_at: '2026-04-26T09:00:00Z',
    user_id: demoUser.id,
  },
  {
    id: 'goal-learn',
    title: 'Study product analytics for 25 minutes',
    category: 'learning' as Category,
    is_active: true,
    created_at: '2026-04-27T09:00:00Z',
    user_id: demoUser.id,
  },
  {
    id: 'goal-oss',
    title: 'Review one open-source issue or PR',
    category: 'oss' as Category,
    is_active: true,
    created_at: '2026-04-28T09:00:00Z',
    user_id: demoUser.id,
  },
  {
    id: 'goal-fitness',
    title: 'Walk 6,000 steps before dinner',
    category: 'fitness' as Category,
    is_active: true,
    created_at: '2026-04-29T09:00:00Z',
    user_id: demoUser.id,
  },
  {
    id: 'goal-docs',
    title: 'Clean up launch notes',
    category: 'other' as Category,
    is_active: false,
    created_at: '2026-04-20T09:00:00Z',
    user_id: demoUser.id,
  },
]

const dayKey = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return formatDateKey(d)
}

export function demoDailyLogs() {
  const pattern: Record<number, Record<string, Status>> = {
    0: { 'goal-ship': 'done', 'goal-learn': 'done', 'goal-oss': 'pending', 'goal-fitness': 'done' },
    1: { 'goal-ship': 'done', 'goal-learn': 'skip', 'goal-oss': 'done', 'goal-fitness': 'done' },
    2: { 'goal-ship': 'done', 'goal-learn': 'done', 'goal-oss': 'done', 'goal-fitness': 'skip' },
    3: { 'goal-ship': 'done', 'goal-learn': 'done', 'goal-oss': 'skip', 'goal-fitness': 'done' },
    4: { 'goal-ship': 'done', 'goal-learn': 'done', 'goal-oss': 'done', 'goal-fitness': 'done' },
    5: { 'goal-ship': 'done', 'goal-learn': 'skip', 'goal-oss': 'done', 'goal-fitness': 'done' },
    6: { 'goal-ship': 'done', 'goal-learn': 'done', 'goal-oss': 'pending', 'goal-fitness': 'done' },
  }

  return Object.entries(pattern).flatMap(([offset, statuses]) => {
    const date = dayKey(Number(offset))
    return Object.entries(statuses).map(([goalId, status]) => ({
      id: `log-${date}-${goalId}`,
      user_id: demoUser.id,
      goal_id: goalId,
      status,
      date,
      goals: demoGoals.find((goal) => goal.id === goalId) ?? null,
    }))
  })
}

export function demoTodayLogs() {
  const today = todayDateKey()
  return demoDailyLogs()
    .filter((log) => log.date === today)
    .map(({ id, goal_id, status, date }) => ({ id, goal_id, status, date }))
}

export function demoDoneLogs() {
  return demoDailyLogs()
    .filter((log) => log.status === 'done')
    .map(({ goal_id, date }) => ({ goal_id, date }))
}

export function demoReviews() {
  const days = lastSevenDateKeys(todayDateKey())
  const scores = [7.2, 6.4, 8.8, 7.9, 9.1, 7.5, 8.6]

  return days.map((date, index) => ({
    id: `review-${date}`,
    user_id: demoUser.id,
    date,
    focus_score: scores[index],
    burnout_flag: index === 1,
    content:
      index === days.length - 1
        ? '[FOCUS] Strong shipping day: you closed product polish, kept learning alive, and still moved your health goal.\n\n[REVIEW] Three of four goals are done. The only loose thread is OSS review, so do not pretend the day is finished yet.\n\n[TOMORROW] Start with the issue queue before opening chat or email.\n\n[BURNOUT] Energy looks fine, but keep the evening clean instead of stretching one more task into midnight.'
        : 'Good consistency today. Coding stayed strong, learning moved forward, and the skipped item is visible enough to fix tomorrow.',
  }))
}

export function demoWallPosts() {
  const today = todayDateKey()

  return [
    {
      id: 'wall-1',
      streak_count: 12,
      tweet_draft: 'Day 12 on DevStreak: shipped dashboard polish, studied analytics, and kept the streak alive.',
      focus_score: 8.6,
      created_at: new Date().toISOString(),
      is_public: true,
      users: {
        github_username: demoUser.github_username,
        display_name: demoUser.display_name,
        avatar_url: null,
      },
      goals: {
        title: 'Ship one meaningful DevStreak improvement',
        category: 'code',
      },
      ai_reviews: {
        content: 'Strong shipping day: you closed product polish, kept learning alive, and still moved your health goal.',
        focus_score: 8.6,
      },
    },
    {
      id: 'wall-2',
      streak_count: 21,
      tweet_draft: '21 days of building in public. Small commits, every day.',
      focus_score: 9.1,
      created_at: `${today}T08:30:00.000Z`,
      is_public: true,
      users: {
        github_username: 'nina_builds',
        display_name: 'Nina Patel',
        avatar_url: null,
      },
      goals: {
        title: 'Merge one customer-facing fix',
        category: 'code',
      },
      ai_reviews: {
        content: 'Excellent prioritization: you picked one visible bug and shipped it cleanly.',
        focus_score: 9.1,
      },
    },
    {
      id: 'wall-3',
      streak_count: 8,
      tweet_draft: 'Day 8: docs, tests, and one clean refactor.',
      focus_score: 7.4,
      created_at: dayKey(1) + 'T18:10:00.000Z',
      is_public: true,
      users: {
        github_username: 'samstack',
        display_name: 'Sam Rivera',
        avatar_url: null,
      },
      goals: {
        title: 'Write tests for auth callback',
        category: 'oss',
      },
      ai_reviews: {
        content: 'Solid work. The refactor stayed small and the test coverage makes the change easier to trust.',
        focus_score: 7.4,
      },
    },
  ]
}
