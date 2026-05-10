import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoalsClient from './GoalsClient'

export default async function GoalsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: goals }, { data: doneLogs }] = await Promise.all([
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('daily_logs')
      .select('goal_id, date')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .order('date', { ascending: false }),
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-100">Goals</h1>
        <p className="text-zinc-500 text-sm">
          Track what matters. Show up daily.
        </p>
      </div>
      <GoalsClient
        initialGoals={goals ?? []}
        doneLogs={doneLogs ?? []}
        userId={user.id}
      />
    </div>
  )
}
