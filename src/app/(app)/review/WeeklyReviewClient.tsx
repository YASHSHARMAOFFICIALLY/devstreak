'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Flame,
  SkipForward,
  CheckCircle2,
  Star,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import clsx from 'clsx'

type Log = {
  id: string
  goal_id: string
  status: 'done' | 'skip' | 'pending'
  date: string
}

type Review = {
  id: string
  content: string
  focus_score: number | null
  burnout_flag: boolean | null
  date: string
}

type Goal = {
  id: string
  title: string
}

type DayStat = {
  date: string
  label: string
  shortLabel: string
  done: number
  skipped: number
  total: number
  focusScore: number
  review: Review | null
}

function buildDayStats(
  days: string[],
  logs: Log[],
  reviews: Review[],
  goals: Goal[]
): DayStat[] {
  const reviewMap = new Map(reviews.map((r) => [r.date, r]))
  const goalCount = goals.length || 1

  return days.map((date) => {
    const dayLogs = logs.filter((l) => l.date === date)
    const done = dayLogs.filter((l) => l.status === 'done').length
    const skipped = dayLogs.filter((l) => l.status === 'skip').length
    const total = dayLogs.length

    const review = reviewMap.get(date) ?? null
    const focusScore =
      review?.focus_score != null
        ? review.focus_score
        : total === 0
        ? 0
        : Math.round((done / Math.max(total, goalCount)) * 10 * 10) / 10

    const d = new Date(date + 'T12:00:00')
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    const shortLabel = d.toLocaleDateString('en-US', { weekday: 'short' })

    return { date, label, shortLabel, done, skipped, total, focusScore, review }
  })
}

function buildStats(dayStats: DayStat[], goals: Goal[], logs: Log[]) {
  const totalCompleted = dayStats.reduce((s, d) => s + d.done, 0)
  const avgFocus =
    dayStats.length === 0
      ? 0
      : Math.round((dayStats.reduce((s, d) => s + d.focusScore, 0) / dayStats.length) * 10) / 10

  const bestDay = dayStats.reduce<DayStat | null>((best, d) => {
    if (!best || d.focusScore > best.focusScore) return d
    return best
  }, null)

  const skipCounts = new Map<string, number>()
  logs.filter((l) => l.status === 'skip').forEach((l) => {
    skipCounts.set(l.goal_id, (skipCounts.get(l.goal_id) ?? 0) + 1)
  })
  const mostSkippedId = Array.from(skipCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostSkipped = goals.find((g) => g.id === mostSkippedId) ?? null

  return { totalCompleted, avgFocus, bestDay, mostSkipped }
}

export default function WeeklyReviewClient({
  userId,
  days,
  logs,
  reviews,
  goals,
}: {
  userId: string
  days: string[]
  logs: Log[]
  reviews: Review[]
  goals: Goal[]
}) {
  const dayStats = buildDayStats(days, logs, reviews, goals)
  const { totalCompleted, avgFocus, bestDay, mostSkipped } = buildStats(dayStats, goals, logs)

  const [summary, setSummary] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const maxScore = Math.max(...dayStats.map((d) => d.focusScore), 1)
  const reviewsWithContent = dayStats.filter((d) => d.review)

  const generateSummary = useCallback(async () => {
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, days: dayStats }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenError(data.error ?? 'Failed to generate summary')
      } else {
        setSummary(data.summary)
      }
    } catch {
      setGenError('Network error — try again')
    } finally {
      setGenerating(false)
    }
  }, [userId, dayStats])

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
          <Calendar className="h-4 w-4" />
          Weekly Digest
        </div>
        <h1 className="mt-1 text-2xl font-bold text-zinc-100 sm:text-3xl">Your Week in Review</h1>
        <p className="mt-1 text-xs text-zinc-500 tabular-nums">
          {days[0]} — {days[days.length - 1]}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Done</p>
          </div>
          <p className="text-3xl font-black tabular-nums text-zinc-100">{totalCompleted}</p>
          <p className="text-xs text-zinc-600">goals this week</p>
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Flame className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Best Day</p>
          </div>
          <p className="text-xl font-black text-zinc-100">{bestDay ? bestDay.shortLabel : '—'}</p>
          <p className="text-xs text-zinc-600">
            {bestDay ? `${bestDay.focusScore.toFixed(1)} focus` : 'no data'}
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <SkipForward className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Avoided</p>
          </div>
          <p className="truncate text-sm font-bold leading-snug text-zinc-200">
            {mostSkipped ? mostSkipped.title : '—'}
          </p>
          <p className="text-xs text-zinc-600">most skipped</p>
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Star className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Avg Focus</p>
          </div>
          <p className="text-3xl font-black tabular-nums text-purple-400">{avgFocus.toFixed(1)}</p>
          <p className="text-xs text-zinc-600">out of 10</p>
        </div>
      </div>

      {/* Focus chart */}
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          Focus Score — 7 Days
        </h2>

        <div className="flex h-32 w-full items-end gap-2">
          {dayStats.map((d) => {
            const heightPct = maxScore === 0 ? 0 : (d.focusScore / maxScore) * 100
            const isToday = d.date === days[days.length - 1]
            return (
              <div key={d.date} className="group flex flex-1 flex-col items-center gap-1.5">
                <div className="text-xs tabular-nums text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
                  {d.focusScore.toFixed(1)}
                </div>
                <div className="flex w-full items-end" style={{ height: '96px' }}>
                  <div
                    className={clsx(
                      'w-full rounded-t-md transition-all duration-300',
                      d.focusScore === 0
                        ? 'bg-zinc-800 opacity-40'
                        : isToday
                        ? 'bg-amber-400'
                        : d.focusScore >= 7
                        ? 'bg-green-500/70'
                        : d.focusScore >= 4
                        ? 'bg-purple-500/70'
                        : 'bg-zinc-600'
                    )}
                    style={{
                      height: d.focusScore === 0 ? '4px' : `${Math.max(heightPct, 4)}%`,
                      minHeight: '4px',
                    }}
                  />
                </div>
                <p
                  className={clsx(
                    'text-[10px]',
                    isToday ? 'font-semibold text-amber-400' : 'text-zinc-600'
                  )}
                >
                  {d.shortLabel}
                </p>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500/70" /> ≥7
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-purple-500/70" /> 4–7
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-600" /> &lt;4
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /> Today
          </span>
        </div>
      </div>

      {/* Review timeline */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Brain className="h-4 w-4 text-purple-400" />
          Review Timeline
          <span className="ml-auto text-xs font-normal normal-case text-zinc-600 tabular-nums">
            {reviewsWithContent.length}/{dayStats.length} reviewed
          </span>
        </h2>

        {reviewsWithContent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 py-10 text-center">
            <p className="text-sm text-zinc-600">No AI reviews this week.</p>
            <Link
              href="/dashboard"
              className="mt-1 inline-block text-sm text-amber-400 hover:underline"
            >
              Generate today&apos;s review →
            </Link>
          </div>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute bottom-0 left-[5.5rem] top-0 hidden w-px bg-zinc-800 sm:block" />

            {dayStats.map((d) => {
              if (!d.review) return null
              return (
                <div key={d.date} className="group flex gap-6">
                  <div className="hidden w-20 shrink-0 pt-4 text-right sm:block">
                    <p className="text-xs font-medium leading-tight text-zinc-500">{d.shortLabel}</p>
                    <p className="text-[10px] text-zinc-700">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="z-10 hidden items-start pt-5 sm:flex">
                    <div
                      className={clsx(
                        'h-3 w-3 rounded-full border-2 border-zinc-900',
                        d.review.burnout_flag ? 'bg-red-500' : 'bg-purple-500'
                      )}
                    />
                  </div>

                  <div className="flex-1 pb-5">
                    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20">
                      <p className="text-xs text-zinc-500 sm:hidden">{d.label}</p>

                      <div className="flex items-center gap-3">
                        {d.review.focus_score != null && (
                          <span
                            className={clsx(
                              'text-sm font-bold tabular-nums',
                              d.review.focus_score >= 7
                                ? 'text-green-400'
                                : d.review.focus_score >= 4
                                ? 'text-amber-400'
                                : 'text-red-400'
                            )}
                          >
                            {d.review.focus_score.toFixed(1)}/10
                          </span>
                        )}
                        {d.review.burnout_flag && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            Burnout risk
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-600 tabular-nums">
                          <span className="text-green-400">{d.done} ✓</span>
                          {d.skipped > 0 && <span className="text-zinc-500">{d.skipped} skip</span>}
                        </div>
                      </div>

                      <p className="line-clamp-3 text-sm leading-relaxed text-zinc-300">
                        {d.review.content}
                      </p>

                      <Link
                        href={`/review/${d.date}`}
                        className="flex items-center gap-0.5 text-xs text-purple-400 transition-colors hover:text-purple-300"
                      >
                        Full review <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Weekly AI Summary */}
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <TrendingDown className="h-4 w-4 text-green-400" />
            Weekly Summary
          </h2>
          {summary && (
            <button
              onClick={generateSummary}
              disabled={generating}
              className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
            >
              <Loader2 className={clsx('h-3 w-3', generating ? 'animate-spin' : 'hidden')} />
              Regenerate
            </button>
          )}
        </div>

        {summary ? (
          <p className="text-sm leading-relaxed text-zinc-300">{summary}</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              AI analysis of your week — best habit, weak point, one recommendation.
            </p>

            {genError && (
              <p className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {genError}
              </p>
            )}

            <button
              onClick={generateSummary}
              disabled={generating}
              className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:bg-green-900 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generate weekly summary
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="h-4 md:hidden" />
    </div>
  )
}
