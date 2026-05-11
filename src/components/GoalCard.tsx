'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  SkipForward,
  Circle,
  Code2,
  Dumbbell,
  BookOpen,
  GitPullRequest,
  MoreHorizontal,
} from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

type Status = 'done' | 'skip' | 'pending'
type Category = 'code' | 'fitness' | 'learning' | 'oss' | 'other'

export const categoryIcons: Record<Category, React.ReactNode> = {
  code: <Code2 className="w-4 h-4" />,
  fitness: <Dumbbell className="w-4 h-4" />,
  learning: <BookOpen className="w-4 h-4" />,
  oss: <GitPullRequest className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
}

export const categoryColors: Record<Category, string> = {
  code: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  fitness: 'bg-green-400/10 text-green-400 border-green-400/20',
  learning: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  oss: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  other: 'bg-zinc-700/40 text-zinc-400 border-zinc-600/20',
}

export const categoryIconColors: Record<Category, string> = {
  code: 'text-blue-400',
  fitness: 'text-green-400',
  learning: 'text-purple-400',
  oss: 'text-orange-400',
  other: 'text-zinc-400',
}

export default function GoalCard({
  logId: initialLogId,
  goalId,
  userId,
  title,
  category,
  initialStatus,
  date,
  onStatusChange,
}: {
  logId?: string
  goalId: string
  userId: string
  title: string
  category: Category
  initialStatus: Status
  date: string
  onStatusChange?: (goalId: string, status: Status, logId?: string) => void
}) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [logId, setLogId] = useState<string | undefined>(initialLogId)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function updateStatus(newStatus: Status) {
    if (loading) return
    setLoading(true)
    const previousStatus = status
    setStatus(newStatus)

    let savedLogId = logId
    let error: { message?: string } | null = null

    if (logId) {
      const result = await supabase
        .from('daily_logs')
        .update({ status: newStatus })
        .eq('id', logId)
      error = result.error
    } else {
      const { data, error: insertError } = await supabase
        .from('daily_logs')
        .insert({ goal_id: goalId, user_id: userId, date, status: newStatus })
        .select('id')
        .single()
      error = insertError
      if (data?.id) {
        savedLogId = data.id
        setLogId(data.id)
      }
    }

    if (error) {
      setStatus(previousStatus)
      setLoading(false)
      return
    }

    onStatusChange?.(goalId, newStatus, savedLogId)
    setLoading(false)
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-4 rounded-lg border bg-zinc-900 p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20',
        status === 'done' && 'border-green-500/30 bg-green-500/5 shadow-green-950/10',
        status === 'skip' && 'border-zinc-700 opacity-60',
        status === 'pending' && 'border-zinc-800'
      )}
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-3 min-w-0">
        <span className={clsx('shrink-0', categoryIconColors[category])}>
          {categoryIcons[category]}
        </span>
        <div className="min-w-0">
          <p
            className={clsx(
            'truncate text-sm font-semibold',
              status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-100'
            )}
          >
            {title}
          </p>
          <span
            className={clsx(
            'mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              categoryColors[category]
            )}
          >
            {category}
          </span>
        </div>
      </div>

      {/* Right: 3 action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => updateStatus('done')}
          disabled={loading}
          title="Done"
          className={clsx(
            'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
            status === 'done'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'text-zinc-600 hover:text-green-400 hover:bg-green-400/10 border border-transparent'
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Done</span>
        </button>

        <button
          onClick={() => updateStatus('skip')}
          disabled={loading}
          title="Skip"
          className={clsx(
            'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
            status === 'skip'
              ? 'bg-zinc-700 text-zinc-300 border border-zinc-600'
              : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent'
          )}
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Skip</span>
        </button>

        <button
          onClick={() => updateStatus('pending')}
          disabled={loading}
          title="Reset to pending"
          className={clsx(
            'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
            status === 'pending'
              ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              : 'text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800/50 border border-transparent'
          )}
        >
          <Circle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pending</span>
        </button>
      </div>
    </div>
  )
}
