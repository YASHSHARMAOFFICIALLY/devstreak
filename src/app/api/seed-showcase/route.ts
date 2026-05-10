import { createClient } from '@/lib/supabase/server'
import { addDaysToDateKey, todayDateKey } from '@/lib/date'
import { NextResponse } from 'next/server'

type Category = 'code' | 'fitness' | 'learning' | 'oss' | 'other'
type Status = 'done' | 'skip' | 'pending'

const seededGoals: { title: string; category: Category; is_active: boolean }[] = [
  {
    title: 'Ship one meaningful DevStreak improvement',
    category: 'code',
    is_active: true,
  },
  {
    title: 'Study product analytics for 25 minutes',
    category: 'learning',
    is_active: true,
  },
  {
    title: 'Review one open-source issue or PR',
    category: 'oss',
    is_active: true,
  },
  {
    title: 'Walk 6,000 steps before dinner',
    category: 'fitness',
    is_active: true,
  },
  {
    title: 'Clean up launch notes',
    category: 'other',
    is_active: false,
  },
]

const statusPattern: Record<number, Status[]> = {
  0: ['done', 'done', 'pending', 'done'],
  1: ['done', 'skip', 'done', 'done'],
  2: ['done', 'done', 'done', 'skip'],
  3: ['done', 'done', 'skip', 'done'],
  4: ['done', 'done', 'done', 'done'],
  5: ['done', 'skip', 'done', 'done'],
  6: ['done', 'done', 'pending', 'done'],
}

const reviewCopy = [
  {
    focus_score: 7.2,
    burnout_flag: false,
    content:
      '[FOCUS] You kept the core engineering habit alive, but the day still had a little drag.\n\n[REVIEW] Shipping work moved forward and the health goal did not get ignored. The skipped learning block is the pattern to watch.\n\n[TOMORROW] Put the study block before inbox and messages.\n\n[BURNOUT] No major burnout signal, just scattered attention.',
  },
  {
    focus_score: 6.4,
    burnout_flag: true,
    content:
      '[FOCUS] Focus dipped because one goal got skipped and the day leaned too hard on late momentum.\n\n[REVIEW] You still shipped code and reviewed community work, so the day was not wasted. But squeezing learning into leftover time is exactly how it keeps getting skipped.\n\n[TOMORROW] Start with the smallest learning task before touching implementation.\n\n[BURNOUT] Burnout risk is mild: too many context switches, not lack of effort.',
  },
  {
    focus_score: 8.8,
    burnout_flag: false,
    content:
      '[FOCUS] Strong execution day with three real completions and one honest skip.\n\n[REVIEW] Product work, learning, and OSS all moved. Fitness was the miss, which is better than pretending the calendar was impossible.\n\n[TOMORROW] Protect a short walk before the second work session.\n\n[BURNOUT] Energy looks stable.',
  },
  {
    focus_score: 7.9,
    burnout_flag: false,
    content:
      '[FOCUS] Good focus because the important build and study blocks were completed early.\n\n[REVIEW] You handled the work that compounds: code shipped, learning happened, and health stayed visible. The OSS review was the only loose thread.\n\n[TOMORROW] Review one issue before opening the editor.\n\n[BURNOUT] No burnout signal today.',
  },
  {
    focus_score: 9.1,
    burnout_flag: false,
    content:
      '[FOCUS] Clean full-completion day. This is what the dashboard is supposed to capture.\n\n[REVIEW] All four active goals landed, and none of them were filler. Strong product progress plus learning and fitness makes this a high-quality streak day.\n\n[TOMORROW] Repeat the morning sequence instead of reinventing it.\n\n[BURNOUT] Low burnout risk.',
  },
  {
    focus_score: 7.5,
    burnout_flag: false,
    content:
      '[FOCUS] Solid focus with one avoidable skip.\n\n[REVIEW] You shipped and reviewed OSS, which are the two public-proof actions. Learning slipped again, so stop treating it like optional garnish.\n\n[TOMORROW] Put analytics study on the calendar as the first non-coding block.\n\n[BURNOUT] Slight fatigue signal, manageable with a cleaner stop time.',
  },
  {
    focus_score: 8.6,
    burnout_flag: false,
    content:
      '[FOCUS] Strong shipping day: you closed product polish, kept learning alive, and still moved your health goal.\n\n[REVIEW] Three of four goals are done. The only loose thread is OSS review, so do not pretend the day is finished yet.\n\n[TOMORROW] Start with the issue queue before opening chat or email.\n\n[BURNOUT] Energy looks fine, but keep the evening clean instead of stretching one more task into midnight.',
  },
]

export async function GET() {
  return seedShowcase()
}

export async function POST() {
  return seedShowcase()
}

async function seedShowcase() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sign in first, then open this route again.' }, { status: 401 })
  }

  const today = todayDateKey()
  const dates = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(today, index - 6))
  const githubUsername =
    user.user_metadata?.user_name ?? user.user_metadata?.preferred_username ?? null
  const displayName = user.user_metadata?.full_name ?? githubUsername ?? 'Developer'
  const avatarUrl = user.user_metadata?.avatar_url ?? null

  const { error: profileError } = await supabase.from('users').upsert(
    {
      id: user.id,
      github_username: githubUsername,
      display_name: displayName,
      avatar_url: avatarUrl,
      streak_count: 12,
      mode: 'roast',
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { data: existingGoals, error: existingGoalError } = await supabase
    .from('goals')
    .select('id, title, category, is_active')
    .eq('user_id', user.id)
    .in(
      'title',
      seededGoals.map((goal) => goal.title)
    )

  if (existingGoalError) {
    return NextResponse.json({ error: existingGoalError.message }, { status: 500 })
  }

  const existingTitles = new Set((existingGoals ?? []).map((goal) => goal.title))
  const missingGoals = seededGoals.filter((goal) => !existingTitles.has(goal.title))

  if (missingGoals.length > 0) {
    const { error: insertGoalError } = await supabase.from('goals').insert(
      missingGoals.map((goal) => ({
        user_id: user.id,
        title: goal.title,
        category: goal.category,
        is_active: goal.is_active,
      }))
    )

    if (insertGoalError) {
      return NextResponse.json({ error: insertGoalError.message }, { status: 500 })
    }
  }

  const { data: goals, error: goalError } = await supabase
    .from('goals')
    .select('id, title, category, is_active')
    .eq('user_id', user.id)
    .in(
      'title',
      seededGoals.map((goal) => goal.title)
    )
    .order('created_at', { ascending: true })

  if (goalError || !goals) {
    return NextResponse.json({ error: goalError?.message ?? 'Could not load seeded goals' }, { status: 500 })
  }

  const activeGoals = seededGoals
    .filter((goal) => goal.is_active)
    .map((seedGoal) => goals.find((goal) => goal.title === seedGoal.title))
    .filter(Boolean) as { id: string; title: string; category: Category; is_active: boolean }[]
  const allGoalIds = goals.map((goal) => goal.id)

  await supabase
    .from('daily_logs')
    .delete()
    .eq('user_id', user.id)
    .in('goal_id', allGoalIds)
    .gte('date', dates[0])
    .lte('date', dates[dates.length - 1])

  const logs = dates.flatMap((date, dateIndex) => {
    const offset = dates.length - 1 - dateIndex
    const statuses = statusPattern[offset]

    return activeGoals.map((goal, goalIndex) => ({
      user_id: user.id,
      goal_id: goal.id,
      date,
      status: statuses[goalIndex],
    }))
  })

  const { error: logsError } = await supabase.from('daily_logs').insert(logs)

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 })
  }

  const reviews = dates.map((date, index) => ({
    user_id: user.id,
    date,
    ...reviewCopy[index],
  }))

  const { error: reviewError } = await supabase
    .from('ai_reviews')
    .upsert(reviews, { onConflict: 'user_id,date' })

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 })
  }

  await supabase
    .from('wall_posts')
    .delete()
    .eq('user_id', user.id)
    .in('goal_id', allGoalIds)
    .gte('created_at', `${dates[0]}T00:00:00`)

  const wallGoals = activeGoals.slice(0, 3)
  const wallPosts = wallGoals.map((goal, index) => ({
    user_id: user.id,
    goal_id: goal.id,
    streak_count: 12 - index,
    is_public: true,
    tweet_draft:
      index === 0
        ? 'Day 12 on DevStreak: shipped a real product improvement and kept the streak alive. #buildinpublic'
        : `Day ${12 - index} on DevStreak: completed "${goal.title}" and stayed consistent. #buildinpublic`,
    focus_score: reviewCopy[reviewCopy.length - 1 - index].focus_score,
    card_data: {
      goal: goal.title,
      streak: 12 - index,
      name: displayName,
      focusScore: reviewCopy[reviewCopy.length - 1 - index].focus_score,
      goalsDone: 3,
      date: dates[dates.length - 1 - index],
      avatar_url: avatarUrl,
    },
  }))

  const { error: wallError } = await supabase.from('wall_posts').insert(wallPosts)

  if (wallError) {
    return NextResponse.json({ error: wallError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: 'Seeded showcase data into your authenticated account.',
    userId: user.id,
    goals: goals.length,
    logs: logs.length,
    reviews: reviews.length,
    wallPosts: wallPosts.length,
    open: {
      dashboard: '/dashboard',
      goals: '/goals',
      review: '/review',
      wall: '/wall',
    },
  })
}
