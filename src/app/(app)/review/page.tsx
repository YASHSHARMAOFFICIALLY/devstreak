import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WeeklyReviewClient from './WeeklyReviewClient'

export default async function ReviewPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

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

  // Build the 7-day range
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }

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
