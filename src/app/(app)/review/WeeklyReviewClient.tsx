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
} from 'lucide-react'

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
    // Use stored focus score if available, else compute
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

  // Most skipped goal
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
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-100">Weekly Digest</h1>
        <p className="text-zinc-500 text-sm">Last 7 days — {days[0]} to {days[days.length - 1]}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-xs uppercase tracking-wider font-medium">Goals Done</p>
          </div>
          <p className="text-3xl font-black text-zinc-100 tabular-nums">{totalCompleted}</p>
          <p className="text-xs text-zinc-600">total this week</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Flame className="w-4 h-4" />
            <p className="text-xs uppercase tracking-wider font-medium">Best Day</p>
          </div>
          <p className="text-xl font-black text-zinc-100">
            {bestDay ? bestDay.shortLabel : '—'}
          </p>
          <p className="text-xs text-zinc-600">
            {bestDay ? `${bestDay.focusScore.toFixed(1)} focus score` : 'no data'}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <SkipForward className="w-4 h-4" />
            <p className="text-xs uppercase tracking-wider font-medium">Most Skipped</p>
          </div>
          <p className="text-sm font-bold text-zinc-200 leading-snug">
            {mostSkipped ? mostSkipped.title : '—'}
          </p>
          <p className="text-xs text-zinc-600">goal most avoided</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Star className="w-4 h-4" />
            <p className="text-xs uppercase tracking-wider font-medium">Avg Focus</p>
          </div>
          <p className="text-3xl font-black text-purple-400 tabular-nums">{avgFocus.toFixed(1)}</p>
          <p className="text-xs text-zinc-600">out of 10</p>
        </div>
      </div>

      {/* CSS Bar Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          Focus Score — 7 Days
        </h2>

        <div className="flex items-end gap-2 h-32 w-full">
          {dayStats.map((d) => {
            const heightPct = maxScore === 0 ? 0 : (d.focusScore / maxScore) * 100
            const isToday = d.date === days[days.length - 1]
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                {/* Score tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-400 tabular-nums">
                  {d.focusScore.toFixed(1)}
                </div>
                {/* Bar */}
                <div className="w-full flex items-end" style={{ height: '96px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      d.focusScore === 0
                        ? 'bg-zinc-800 opacity-40'
                        : isToday
                        ? 'bg-amber-400'
                        : d.focusScore >= 7
                        ? 'bg-green-500/70'
                        : d.focusScore >= 4
                        ? 'bg-purple-500/70'
                        : 'bg-zinc-600'
                    }`}
                    style={{
                      height: d.focusScore === 0 ? '4px' : `${Math.max(heightPct, 4)}%`,
                      minHeight: '4px',
                    }}
                  />
                </div>
                {/* Label */}
                <p className={`text-[10px] ${isToday ? 'text-amber-400 font-semibold' : 'text-zinc-600'}`}>
                  {d.shortLabel}
                </p>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/70 inline-block" />≥7</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500/70 inline-block" />4–7</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 inline-block" />&lt;4</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Today</span>
        </div>
      </div>

      {/* AI Reviews Timeline */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          Review Timeline
        </h2>

        {dayStats.filter((d) => d.review).length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-600 text-sm">No AI reviews generated this week.</p>
            <Link href="/dashboard" className="text-amber-400 text-sm hover:underline mt-1 inline-block">
              Generate today&apos;s review →
            </Link>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-zinc-800 hidden sm:block" />

            {dayStats.map((d) => {
              if (!d.review) return null
              return (
                <div key={d.date} className="flex gap-6 group">
                  {/* Date column */}
                  <div className="w-20 shrink-0 pt-1 text-right hidden sm:block">
                    <p className="text-xs font-medium text-zinc-500 leading-tight">
                      {d.shortLabel}
                    </p>
                    <p className="text-[10px] text-zinc-700">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Dot */}
                  <div className="hidden sm:flex items-start pt-1.5 z-10">
                    <div
                      className={`w-3 h-3 rounded-full border-2 border-zinc-900 ${
                        d.review.burnout_flag ? 'bg-red-500' : 'bg-purple-500'
                      }`}
                    />
                  </div>

                  {/* Review card */}
                  <div className="flex-1 pb-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors">
                      {/* Mobile date */}
                      <p className="text-xs text-zinc-500 sm:hidden">{d.label}</p>

                      {/* Score + burnout row */}
                      <div className="flex items-center gap-3">
                        {d.review.focus_score != null && (
                          <span className="text-sm font-bold text-amber-400 tabular-nums">
                            {d.review.focus_score.toFixed(1)}/10
                          </span>
                        )}
                        {d.review.burnout_flag && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            Burnout risk
                          </span>
                        )}
                        <span className="ml-auto text-xs text-zinc-600 tabular-nums">
                          {d.done}/{d.total} done
                        </span>
                      </div>

                      {/* Review text */}
                      <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
                        {d.review.content}
                      </p>

                      {/* Link to day review */}
                      <Link
                        href={`/review/${d.date}`}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-0.5"
                      >
                        View full day <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-400" />
            Weekly Summary
          </h2>
        </div>

        {summary ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
            <button
              onClick={generateSummary}
              disabled={generating}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <Loader2 className={`w-3 h-3 ${generating ? 'animate-spin' : 'hidden'}`} />
              Regenerate
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Get a 3-sentence AI analysis of your week — strongest habit, weakest habit, and one recommendation.
            </p>

            {genError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {genError}
              </p>
            )}

            <button
              onClick={generateSummary}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-600 disabled:bg-green-900 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your week...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Generate weekly summary
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
