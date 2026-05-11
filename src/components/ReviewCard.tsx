import { Brain, AlertTriangle, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

type Review = {
  id: string
  content: string | null
  burnout_flag: boolean | null
  focus_score: number | null
  date: string
}

export default function ReviewCard({ review }: { review: Review }) {
  const score = review.focus_score ?? 0

  return (
    <div className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-sm shadow-black/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-zinc-100">AI Review</span>
        </div>
        <span className="text-xs text-zinc-500">
          {new Date(review.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Burnout flag */}
      {review.burnout_flag && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">Burnout risk detected. Take it easy.</p>
        </div>
      )}

      {/* Focus score */}
      {review.focus_score !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <TrendingUp className="w-4 h-4" />
              Focus Score
            </span>
            <span
              className={clsx(
                'font-bold tabular-nums',
                score >= 7 ? 'text-green-400' : score >= 4 ? 'text-amber-400' : 'text-red-400'
              )}
            >
              {score.toFixed(1)}/10
            </span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                score >= 7 ? 'bg-green-400' : score >= 4 ? 'bg-amber-400' : 'bg-red-400'
              )}
              style={{ width: `${(score / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {review.content && (
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {review.content}
        </p>
      )}
    </div>
  )
}
