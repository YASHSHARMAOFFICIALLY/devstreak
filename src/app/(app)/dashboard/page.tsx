import { createClient } from '@/lib/supabase/server'
import { todayDateKey } from '@/lib/date'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { demoDoneLogs, demoGoals, demoReviews, demoTodayLogs, demoUser, isDemoMode } from '@/lib/demo'

export default async function DashboardPage() {
  const demoMode = isDemoMode()

  if (demoMode) {
    const today = todayDateKey()
    const displayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })

    return (
      <DashboardClient
        userId={demoUser.id}
        goals={demoGoals.filter((goal) => goal.is_active)}
        initialLogs={demoTodayLogs()}
        allDoneLogs={demoDoneLogs()}
        displayName={demoUser.display_name}
        initialStreak={demoUser.streak_count}
        mode={demoUser.mode}
        today={today}
        displayDate={displayDate}
        existingReview={demoReviews().at(-1)}
        demoMode
      />
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const today = todayDateKey()

  const [{ data: profile }, { data: goals }, { data: todayLogs }, { data: allDoneLogs }, { data: existingReview }] =
    await Promise.all([
      supabase
        .from('users')
        .select('display_name, github_username, streak_count, mode')
        .eq('id', user.id)
        .single(),
      supabase
        .from('goals')
        .select('id, title, category, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('daily_logs')
        .select('id, goal_id, status, date')
        .eq('user_id', user.id)
        .eq('date', today),
      supabase
        .from('daily_logs')
        .select('date')
        .eq('user_id', user.id)
        .eq('status', 'done')
        .order('date', { ascending: false }),
      supabase
        .from('ai_reviews')
        .select('id, content, burnout_flag, focus_score, date')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle(),
    ])

  const displayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <DashboardClient
      userId={user.id}
      goals={goals ?? []}
      initialLogs={todayLogs ?? []}
      allDoneLogs={allDoneLogs ?? []}
      displayName={profile?.display_name ?? profile?.github_username ?? 'Dev'}
      initialStreak={profile?.streak_count ?? 0}
      mode={profile?.mode ?? 'roast'}
      today={today}
      displayDate={displayDate}
      existingReview={existingReview}
    />
  )
}
