import { createClient } from '@/lib/supabase/server'
import { todayDateKey } from '@/lib/date'
import { redirect } from 'next/navigation'
import WallClient from './WallClient'
import type { WallPost } from '@/components/WallCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

export default async function WallPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const today = todayDateKey()

  const [{ data: posts }, { data: profile }, { data: goals }, { data: todayLogs }] = await Promise.all([
    supabase
      .from('wall_posts')
      .select(`
      id, goal_id, streak_count, tweet_draft, focus_score, created_at, is_public,
      users ( github_username, display_name, avatar_url ),
      goals ( title, category )
    `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('users')
      .select('streak_count')
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
      .select('goal_id')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('status', 'done'),
  ])

  const doneGoalIds = new Set((todayLogs ?? []).map((log) => log.goal_id))
  const shareableGoals = (goals ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    category: goal.category,
    isDoneToday: doneGoalIds.has(goal.id),
  }))
  const normalizedPosts = (posts ?? []).map((post) => ({
    ...post,
    users: firstRelation(post.users),
    goals: firstRelation(post.goals),
    ai_reviews: null,
  })) satisfies WallPost[]

  return (
    <WallClient
      initialPosts={normalizedPosts}
      shareableGoals={shareableGoals}
      streakCount={profile?.streak_count ?? 0}
    />
  )
}
