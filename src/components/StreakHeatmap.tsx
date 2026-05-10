'use client'

import { useMemo } from 'react'
import clsx from 'clsx'
import { formatDateKey } from '@/lib/date'

type Props = {
  /** Array of YYYY-MM-DD dates where the user had at least one "done" log */
  doneDates: string[]
}

const DAYS_TO_SHOW = 30

export default function StreakHeatmap({ doneDates }: Props) {
  const cells = useMemo(() => {
    const doneSet = new Set(doneDates)
    const today = new Date()
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (DAYS_TO_SHOW - 1 - i))
      const key = formatDateKey(d)
      const isToday = i === DAYS_TO_SHOW - 1
      const done = doneSet.has(key)
      return { key, done, isToday }
    })
  }, [doneDates])

  const doneCount = cells.filter((c) => c.done).length

  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Last 30 days
        </p>
        <p className="text-xs text-zinc-600 tabular-nums">
          {doneCount}/{DAYS_TO_SHOW} active
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {cells.map((cell) => (
          <div
            key={cell.key}
            title={cell.key}
            className={clsx(
              'h-4 w-4 rounded-sm transition-colors',
              cell.isToday && cell.done
                ? 'bg-amber-400 ring-1 ring-amber-300/50'
                : cell.isToday
                ? 'bg-zinc-700 ring-1 ring-zinc-500/50'
                : cell.done
                ? 'bg-amber-500/70'
                : 'bg-zinc-800'
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-800" /> None
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500/70" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400 ring-1 ring-amber-300/50" /> Today
        </span>
      </div>
    </div>
  )
}
