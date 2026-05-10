import { createClient } from '@/lib/supabase/server'
import { lastSevenDateKeys, todayDateKey } from '@/lib/date'
import { redirect } from 'next/navigation'
import WeeklyReviewClient from './WeeklyReviewClient'
import { demoDailyLogs, demoGoals, demoReviews, demoUser, isDemoMode } from '@/lib/demo'

export default async function ReviewPage() {
  const demoMode = isDemoMode()

  if (demoMode) {
    const todayStr = todayDateKey()
    const days = lastSevenDateKeys(todayStr)

    return (
      <WeeklyReviewClient
        userId={demoUser.id}
        days={days}
        logs={demoDailyLogs().map(({ id, goal_id, status, date }) => ({ id, goal_id, status, date }))}
        reviews={demoReviews()}
        goals={demoGoals.map(({ id, title }) => ({ id, title }))}
      />
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const todayStr = todayDateKey()
  const days = lastSevenDateKeys(todayStr)
  const sevenDaysAgoStr = days[0]

  const [{ data: logs }, { data: reviews }, { data: goals }] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('id, goal_id, status, date')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .lte('date', todayStr)
      .order('date', { ascending: true }),
    supabase
      .from('ai_reviews')
      .select('id, content, focus_score, burnout_flag, date')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .lte('date', todayStr)
      .order('date', { ascending: true }),
    supabase
      .from('goals')
      .select('id, title')
      .eq('user_id', user.id),
  ])

  return (
    <WeeklyReviewClient
      userId={user.id}
      days={days}
      logs={logs ?? []}
      reviews={reviews ?? []}
      goals={goals ?? []}
    />
  )
}
