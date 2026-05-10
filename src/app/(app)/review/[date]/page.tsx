import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewCard from '@/components/ReviewCard'
import GenerateReviewButton from './GenerateReviewButton'
import { CheckCircle2, SkipForward, Clock } from 'lucide-react'

export default async function ReviewPage({
  params,
}: {
  params: { date: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { date } = params

  const [{ data: review }, { data: logs }, { data: profile }] = await Promise.all([
    supabase
      .from('ai_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single(),
    supabase
      .from('daily_logs')
      .select('*, goals(title, category)')
      .eq('user_id', user.id)
      .eq('date', date),
    supabase
      .from('users')
      .select('mode')
      .eq('id', user.id)
      .single(),
  ])

  const done = (logs ?? []).filter((l) => l.status === 'done').length
  const skipped = (logs ?? []).filter((l) => l.status === 'skip').length
  const pending = (logs ?? []).filter((l) => l.status === 'pending').length
  const total = (logs ?? []).length

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-100">Daily Review</h1>
        <p className="text-zinc-500 text-sm">{displayDate}</p>
      </div>

      {/* Day Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Day Summary
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center space-y-1">
            <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
            <p className="text-2xl font-bold text-zinc-100">{done}</p>
            <p className="text-xs text-zinc-500">Done</p>
          </div>
          <div className="text-center space-y-1">
            <SkipForward className="w-5 h-5 text-zinc-500 mx-auto" />
            <p className="text-2xl font-bold text-zinc-100">{skipped}</p>
            <p className="text-xs text-zinc-500">Skipped</p>
          </div>
          <div className="text-center space-y-1">
            <Clock className="w-5 h-5 text-zinc-700 mx-auto" />
            <p className="text-2xl font-bold text-zinc-100">{pending}</p>
            <p className="text-xs text-zinc-500">Pending</p>
          </div>
        </div>

        {/* Log list */}
        {(logs ?? []).length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            {(logs ?? []).map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">
                  {(log.goals as { title?: string } | null)?.title ?? 'Unknown goal'}
                </span>
                <span
                  className={
                    log.status === 'done'
                      ? 'text-green-400'
                      : log.status === 'skip'
                      ? 'text-zinc-500'
                      : 'text-zinc-700'
                  }
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {total === 0 && (
          <p className="text-zinc-600 text-sm text-center py-2">
            No goals logged for this date.
          </p>
        )}
      </div>

      {/* AI Review */}
      {review ? (
        <ReviewCard review={review} />
      ) : (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-8 text-center space-y-4">
          <p className="text-zinc-500 text-sm">
            No AI review yet for this day.
          </p>
          {total > 0 && (
            <GenerateReviewButton
              userId={user.id}
              date={date}
              mode={profile?.mode ?? 'roast'}
              logsSummary={{ done, skipped, pending, total }}
            />
          )}
          {total === 0 && (
            <p className="text-zinc-600 text-xs">
              Log some goals first to generate a review.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
