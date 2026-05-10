'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import GoalCard from '@/components/GoalCard'
import StreakBadge from '@/components/StreakBadge'
import {
  Brain,
  Plus,
  Zap,
  Flame,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Bird,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Status = 'done' | 'skip' | 'pending'
type Category = 'code' | 'fitness' | 'learning' | 'oss' | 'other'

type Goal = {
  id: string
  title: string
  category: Category
  is_active: boolean
}

type Log = {
  id: string
  goal_id: string
  status: Status
  date: string
}

type DoneLog = {
  date: string
}

type Review = {
  id: string
  content: string
  burnout_flag: boolean
  focus_score: number
  date: string
}

type CardData = {
  name: string
  username: string
  streak: number
  goal: string | null
  focusScore: number | null
  goalsDone: number
  date: string
  avatar_url: string | null
}

function calculateStreak(doneLogs: DoneLog[]): number {
  const doneDates = new Set(doneLogs.map((l) => l.date))
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    if (doneDates.has(dateStr)) {
      streak++
    } else {
      if (i > 0) break
    }
  }

  return streak
}

function VisualProgressCard({ card }: { card: CardData }) {
  const dateFormatted = new Date(card.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700 p-6 space-y-5 w-full max-w-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">DevStreak</span>
        <span className="text-xs text-zinc-500">{dateFormatted}</span>
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
        {card.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.avatar_url} alt={card.name} className="w-10 h-10 rounded-full ring-2 ring-amber-400/40" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-lg">
            {card.name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-zinc-100">{card.name}</p>
          <p className="text-xs text-zinc-500">@{card.username}</p>
        </div>
      </div>

      {/* Goal */}
      {card.goal && (
        <div className="bg-zinc-800/60 rounded-lg px-3 py-2">
          <p className="text-xs text-zinc-500 mb-0.5">Goal completed</p>
          <p className="text-sm text-zinc-200 font-medium">{card.goal}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xl font-black text-amber-400 tabular-nums">{card.streak}</span>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Streak</p>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xl font-black text-green-400 tabular-nums">{card.goalsDone}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Done</p>
        </div>

        {card.focusScore != null && (
          <div className="text-center space-y-1">
            <p className="text-xl font-black text-purple-400 tabular-nums">{card.focusScore.toFixed(1)}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Focus</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 pt-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Building in public</p>
      </div>
    </div>
  )
}

export default function DashboardClient({
  userId,
  goals,
  initialLogs,
  allDoneLogs,
  displayName,
  initialStreak,
  mode,
  today,
  displayDate,
  existingReview,
}: {
  userId: string
  goals: Goal[]
  initialLogs: Log[]
  allDoneLogs: DoneLog[]
  displayName: string
  initialStreak: number
  mode: string
  today: string
  displayDate: string
  existingReview?: Review | null
}) {
  const supabase = createClient()

  const buildStatusMap = (logs: Log[]) => {
    const map = new Map<string, { logId: string; status: Status }>()
    logs.forEach((l) => map.set(l.goal_id, { logId: l.id, status: l.status }))
    return map
  }

  const [statusMap, setStatusMap] = useState(() => buildStatusMap(initialLogs))
  const [doneLogs, setDoneLogs] = useState<DoneLog[]>(allDoneLogs)
  const [streak, setStreak] = useState(initialStreak)
  const [review, setReview] = useState<Review | null>(existingReview ?? null)
  const [generating, setGenerating] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Share to wall state
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [sharedGoalId, setSharedGoalId] = useState<string | null>(null)
  const [tweetDraft, setTweetDraft] = useState<string | null>(null)
  const [cardData, setCardData] = useState<CardData | null>(null)
  const [copied, setCopied] = useState(false)

  const doneCount = Array.from(statusMap.values()).filter((v) => v.status === 'done').length
  const total = goals.length
  const progressPct = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  const handleStatusChange = useCallback(
    async (goalId: string, newStatus: Status) => {
      setStatusMap((prev) => {
        const next = new Map(prev)
        const existing = next.get(goalId)
        if (existing) {
          next.set(goalId, { ...existing, status: newStatus })
        }
        return next
      })

      const updatedDoneLogs = doneLogs.filter((l) => l.date !== today)
      const todayDone = Array.from(statusMap.values())
        .map((v, idx) => {
          const gId = Array.from(statusMap.keys())[idx]
          const effectiveStatus = gId === goalId ? newStatus : v.status
          return effectiveStatus === 'done' ? { date: today } : null
        })
        .filter(Boolean) as DoneLog[]

      const newDoneLogs = [...updatedDoneLogs, ...(todayDone.length > 0 ? [{ date: today }] : [])]
      setDoneLogs(newDoneLogs)

      const newStreak = calculateStreak(newDoneLogs)
      setStreak(newStreak)

      await supabase
        .from('users')
        .update({ streak_count: newStreak })
        .eq('id', userId)
    },
    [doneLogs, statusMap, today, supabase, userId]
  )

  const generateReview = useCallback(async () => {
    setGenerating(true)
    setReviewError(null)
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, date: today }),
      })
      const data = await res.json()
      if (!res.ok) {
        setReviewError(data.error ?? 'Failed to generate review')
      } else {
        setReview(data.review)
      }
    } catch {
      setReviewError('Network error — try again')
    } finally {
      setGenerating(false)
    }
  }, [userId, today])

  const shareToWall = useCallback(
    async (goalId: string) => {
      setSharing(true)
      setShareError(null)
      try {
        const res = await fetch('/api/wall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalId, isPublic: true }),
        })
        const data = await res.json()
        if (!res.ok) {
          setShareError(data.error ?? 'Failed to share')
        } else {
          setSharedGoalId(goalId)
          setTweetDraft(data.tweetDraft ?? null)
          setCardData(data.cardData ?? null)
        }
      } catch {
        setShareError('Network error — try again')
      } finally {
        setSharing(false)
      }
    },
    []
  )

  const copyTweet = useCallback(() => {
    if (!tweetDraft) return
    navigator.clipboard.writeText(tweetDraft).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [tweetDraft])

  const buttonLabel = mode === 'roast' ? 'Roast me tonight' : 'Hype me up'

  // First done goal for share button
  const firstDoneGoalId = goals.find((g) => statusMap.get(g.id)?.status === 'done')?.id ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-zinc-500 text-sm">{displayDate}</p>
        <h1 className="text-2xl font-bold text-zinc-100">
          Hey, {displayName} 👋
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Streak</p>
          <StreakBadge count={streak} size="md" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Done today</p>
          <p className="text-xl font-bold text-zinc-100">
            {doneCount}
            <span className="text-zinc-600 text-sm font-normal">/{total}</span>
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Mode</p>
          <p className="text-sm font-semibold capitalize text-amber-400">{mode}</p>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-500">
            <span>Today&apos;s progress</span>
            <span className={doneCount === total ? 'text-green-400 font-semibold' : ''}>
              {progressPct}%{doneCount === total ? ' — All done! 🔥' : ''}
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Today's Goals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Today&apos;s Goals
          </h2>
          <Link
            href="/goals"
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Manage
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-8 text-center space-y-2">
            <p className="text-zinc-500 text-sm">No active goals yet.</p>
            <Link href="/goals" className="text-amber-400 text-sm hover:underline">
              Add your first goal →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => {
              const logEntry = statusMap.get(goal.id)
              return (
                <GoalCard
                  key={goal.id}
                  logId={logEntry?.logId}
                  goalId={goal.id}
                  userId={userId}
                  title={goal.title}
                  category={goal.category}
                  initialStatus={logEntry?.status ?? 'pending'}
                  date={today}
                  onStatusChange={handleStatusChange}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Nightly Review Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Nightly Review
          </h2>
          {review && (
            <button
              onClick={generateReview}
              disabled={generating}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>

        {!review ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <p className="text-sm text-zinc-400">
              {mode === 'roast'
                ? 'Ready to get called out for your slacking?'
                : 'Get a personalized pep talk based on your day.'}
            </p>
            {reviewError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {reviewError}
              </p>
            )}
            <button
              onClick={generateReview}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {mode === 'roast' ? <Flame className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {buttonLabel}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            {/* Scores */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Focus</span>
                <span className="text-base font-bold text-amber-400">{review.focus_score}/10</span>
              </div>
              {review.burnout_flag && (
                <div className="flex items-center gap-1 text-xs text-red-400 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  Burnout risk
                </div>
              )}
            </div>

            {/* Review text */}
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {review.content}
            </p>

            {reviewError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {reviewError}
              </p>
            )}

            {/* Actions row */}
            <div className="flex items-center gap-3 pt-1 border-t border-zinc-800 flex-wrap">
              <Link
                href={`/review/${today}`}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                View full review page →
              </Link>

              {firstDoneGoalId && !sharedGoalId && (
                <button
                  onClick={() => shareToWall(firstDoneGoalId)}
                  disabled={sharing}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {sharing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Share2 className="w-3 h-3" />
                  )}
                  {sharing ? 'Sharing...' : 'Share to wall'}
                </button>
              )}

              {sharedGoalId && (
                <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Shared to wall
                </span>
              )}
            </div>

            {shareError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {shareError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Post-share: tweet draft + visual card */}
      {tweetDraft && cardData && (
        <div className="space-y-6">
          {/* Tweet draft */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Bird className="w-3.5 h-3.5 text-sky-400" />
                Tweet Draft
              </h3>
              <span className="text-xs text-zinc-600 tabular-nums">{tweetDraft.length}/240</span>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={tweetDraft}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-200 resize-none h-24 leading-relaxed focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyTweet}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetDraft)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-medium rounded-lg transition-colors"
              >
                <Bird className="w-3 h-3" />
                Post to X
              </a>
            </div>
          </div>

          {/* Visual Progress Card */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Progress Card
            </h3>
            <p className="text-xs text-zinc-600">Screenshot this and share it anywhere.</p>
            <VisualProgressCard card={cardData} />
          </div>
        </div>
      )}
    </div>
  )
}
