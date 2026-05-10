'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import GoalCard from '@/components/GoalCard'
import StreakBadge from '@/components/StreakBadge'
import StreakHeatmap from '@/components/StreakHeatmap'
import AchievementBadges from '@/components/AchievementBadges'
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
  Code2,
  Dumbbell,
  BookOpen,
  GitPullRequest,
  MoreHorizontal,
  Target,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDateKey } from '@/lib/date'

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

// ─── Structured review sections ──────────────────────────────────────────────
type ReviewSections = {
  focus?: string
  review?: string
  tomorrow?: string
  burnout?: string
  raw: string
}

function parseReviewSections(content: string): ReviewSections {
  const sections: ReviewSections = { raw: content }
  const tagRe = /\[(FOCUS|REVIEW|TOMORROW|BURNOUT)\]([\s\S]*?)(?=\[(?:FOCUS|REVIEW|TOMORROW|BURNOUT)\]|$)/gi
  let match
  while ((match = tagRe.exec(content)) !== null) {
    const tag = match[1].toLowerCase() as keyof Omit<ReviewSections, 'raw'>
    sections[tag] = match[2].trim()
  }
  return sections
}

// ─── Quick-add categories for onboarding empty state ─────────────────────────
const QUICK_GOALS: { title: string; category: Category; icon: React.ReactNode }[] = [
  { title: 'Commit to GitHub daily', category: 'code', icon: <Code2 className="w-4 h-4" /> },
  { title: 'Run or exercise 30 min', category: 'fitness', icon: <Dumbbell className="w-4 h-4" /> },
  { title: 'Read / study 20 min', category: 'learning', icon: <BookOpen className="w-4 h-4" /> },
  { title: 'Review an open-source PR', category: 'oss', icon: <GitPullRequest className="w-4 h-4" /> },
  { title: 'Ship a side-project task', category: 'other', icon: <MoreHorizontal className="w-4 h-4" /> },
]

// ─── Status banner ────────────────────────────────────────────────────────────
function StatusBanner({
  doneCount,
  total,
  streak,
  mode,
}: {
  doneCount: number
  total: number
  streak: number
  mode: string
}) {
  if (total === 0) return null

  let message: string
  let color: string

  if (doneCount === total) {
    message = streak > 6
      ? `🏆 Full streak — ${streak} days straight. Legendary.`
      : '✅ All done for today. Come back tomorrow.'
    color = 'border-green-500/30 bg-green-500/5 text-green-400'
  } else if (doneCount === 0) {
    message = mode === 'roast'
      ? '😤 Nothing logged yet. You\'re not that busy.'
      : '💡 Day\'s still young — get at least one done.'
    color = 'border-zinc-700 bg-zinc-900/60 text-zinc-400'
  } else {
    const remaining = total - doneCount
    message = mode === 'roast'
      ? `🔥 ${doneCount}/${total} done — ${remaining} more excuses to go.`
      : `⚡ ${doneCount}/${total} done — ${remaining} left. Keep the momentum.`
    color = 'border-amber-500/20 bg-amber-500/5 text-amber-300'
  }

  return (
    <div className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${color}`}>
      {message}
    </div>
  )
}

function calculateStreak(doneLogs: DoneLog[]): number {
  const doneDates = new Set(doneLogs.map((l) => l.date))
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDateKey(d)

    if (doneDates.has(dateStr)) {
      streak++
    } else {
      if (i > 0) break
    }
  }

  return streak
}

// ─── Polished share card ──────────────────────────────────────────────────────
function VisualProgressCard({ card }: { card: CardData }) {
  const dateFormatted = new Date(card.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 shadow-2xl shadow-black/40">
      {/* Amber accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300" />

      <div className="space-y-5 p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">DevStreak</span>
          </div>
          <span className="text-xs text-zinc-500">{dateFormatted}</span>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.avatar_url}
              alt={card.name}
              className="h-11 w-11 rounded-full ring-2 ring-amber-400/30"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400/20 text-lg font-bold text-amber-400">
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
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2.5">
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-zinc-500">Completed</p>
            <p className="text-sm font-semibold text-zinc-200">{card.goal}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800">
          <div className="space-y-0.5 pr-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-2xl font-black tabular-nums text-amber-400">{card.streak}</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Streak</p>
          </div>
          <div className="space-y-0.5 px-3 text-center">
            <p className="text-2xl font-black tabular-nums text-green-400">{card.goalsDone}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Done</p>
          </div>
          {card.focusScore != null ? (
            <div className="space-y-0.5 pl-3 text-center">
              <p className="text-2xl font-black tabular-nums text-purple-400">
                {card.focusScore.toFixed(1)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">Focus</p>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1.5 border-t border-zinc-800 pt-3">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Building in public</p>
        </div>
      </div>
    </div>
  )
}

// ─── Structured AI Review display ─────────────────────────────────────────────
function StructuredReview({ review }: { review: Review }) {
  const sections = parseReviewSections(review.content)
  const hasStructure = sections.focus || sections.review || sections.tomorrow || sections.burnout

  if (!hasStructure) {
    return (
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{review.content}</p>
    )
  }

  return (
    <div className="space-y-3">
      {sections.focus && (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            <Target className="h-3 w-3" /> Focus
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">{sections.focus}</p>
        </div>
      )}
      {sections.review && (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-purple-400">
            <Brain className="h-3 w-3" /> Review
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">{sections.review}</p>
        </div>
      )}
      {sections.tomorrow && (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
            <TrendingUp className="h-3 w-3" /> Tomorrow
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">{sections.tomorrow}</p>
        </div>
      )}
      {sections.burnout && (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
            <AlertTriangle className="h-3 w-3" /> Burnout Watch
          </p>
          <p className="text-sm text-red-300 leading-relaxed">{sections.burnout}</p>
        </div>
      )}
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
  demoMode = false,
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
  demoMode?: boolean
}) {
  const supabase = demoMode ? null : createClient()

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

  // Quick-add state (for onboarding empty state)
  const [quickAdding, setQuickAdding] = useState<string | null>(null)

  const doneCount = Array.from(statusMap.values()).filter((v) => v.status === 'done').length
  const total = goals.length
  const progressPct = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  // Unique done dates for heatmap
  const doneDateStrings = Array.from(new Set(doneLogs.map((l) => l.date)))

  const handleStatusChange = useCallback(
    async (goalId: string, newStatus: Status, logId?: string) => {
      const nextStatusMap = new Map(statusMap)
      const existing = nextStatusMap.get(goalId)
      nextStatusMap.set(goalId, {
        logId: logId ?? existing?.logId ?? '',
        status: newStatus,
      })

      setStatusMap((prev) => {
        const next = new Map(prev)
        next.set(goalId, {
          logId: logId ?? existing?.logId ?? '',
          status: newStatus,
        })
        return next
      })

      const updatedDoneLogs = doneLogs.filter((l) => l.date !== today)
      const hasDoneToday = Array.from(nextStatusMap.values()).some((v) => v.status === 'done')

      const newDoneLogs = [...updatedDoneLogs, ...(hasDoneToday ? [{ date: today }] : [])]
      setDoneLogs(newDoneLogs)

      const newStreak = calculateStreak(newDoneLogs)
      setStreak(newStreak)

      if (demoMode) return

      await supabase!
        .from('users')
        .update({ streak_count: newStreak })
        .eq('id', userId)
    },
    [demoMode, doneLogs, statusMap, today, supabase, userId]
  )

  const generateReview = useCallback(async () => {
    setGenerating(true)
    setReviewError(null)
    if (demoMode) {
      setReview({
        id: 'demo-review-regenerated',
        content:
          '[FOCUS] You kept momentum across product, learning, and health.\n\n[REVIEW] Three goals are complete. The unfinished OSS review is the one task still trying to sneak out the side door.\n\n[TOMORROW] Open the issue queue first, then code.\n\n[BURNOUT] No major burnout signal, but stop work at a sane hour.',
        burnout_flag: false,
        focus_score: 8.8,
        date: today,
      })
      setGenerating(false)
      return
    }

    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
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
  }, [demoMode, today])

  const shareToWall = useCallback(
    async (goalId: string) => {
      setSharing(true)
      setShareError(null)
      if (demoMode) {
        const goal = goals.find((g) => g.id === goalId)
        setSharedGoalId(goalId)
        setTweetDraft(
          `Day ${streak} on DevStreak: completed ${doneCount}/${total} goals and shipped "${goal?.title ?? "today's focus"}".`
        )
        setCardData({
          name: displayName,
          username: 'yashcodes',
          streak,
          goal: goal?.title ?? null,
          focusScore: review?.focus_score ?? 8.6,
          goalsDone: doneCount,
          date: today,
          avatar_url: null,
        })
        setSharing(false)
        return
      }

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
    [demoMode, displayName, doneCount, goals, review?.focus_score, streak, today, total]
  )

  const copyTweet = useCallback(() => {
    if (!tweetDraft) return
    navigator.clipboard.writeText(tweetDraft).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [tweetDraft])

  const quickAddGoal = useCallback(
    async (title: string, category: Category) => {
      setQuickAdding(title)
      if (demoMode) {
        setQuickAdding(null)
        return
      }

      await supabase!
        .from('goals')
        .insert({ user_id: userId, title, category, is_active: true })
      // Page will re-fetch on next load; notify user
      setQuickAdding(null)
      window.location.reload()
    },
    [demoMode, supabase, userId]
  )

  const buttonLabel = mode === 'roast' ? 'Roast me tonight' : 'Hype me up'

  // First done goal for share button
  const firstDoneGoalId = goals.find((g) => statusMap.get(g.id)?.status === 'done')?.id ?? null

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20">
        <p className="text-sm font-medium text-amber-300">{displayDate}</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-100 sm:text-3xl">
          Hey, {displayName} 👋
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Mark what moved today, then generate a review when you are done.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Streak</p>
          <StreakBadge count={streak} size="md" />
        </div>

        <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Done today</p>
          <p className="text-xl font-bold text-zinc-100">
            {doneCount}
            <span className="text-zinc-600 text-sm font-normal">/{total}</span>
          </p>
        </div>

        <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Mode</p>
          <p className="text-sm font-semibold capitalize text-amber-400">{mode}</p>
        </div>
      </div>

      {/* Feature 1: Today status banner */}
      <StatusBanner doneCount={doneCount} total={total} streak={streak} mode={mode} />

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-500">
            <span>Today&apos;s progress</span>
            <span className={doneCount === total ? 'text-green-400 font-semibold' : ''}>
              {progressPct}%{doneCount === total ? ' — All done! 🔥' : ''}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
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

        {/* Feature 4: Onboarding empty state with quick-add */}
        {goals.length === 0 ? (
          <div className="space-y-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/60 p-6">
            <div className="text-center space-y-1">
              <p className="text-zinc-400 text-sm font-medium">No goals yet — pick one to start:</p>
              <p className="text-zinc-600 text-xs">Or <Link href="/goals" className="text-amber-400 hover:underline">create your own →</Link></p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {QUICK_GOALS.map((qg) => (
                <button
                  key={qg.title}
                  onClick={() => quickAddGoal(qg.title, qg.category)}
                  disabled={quickAdding !== null}
                  className="flex items-center gap-2.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-left text-sm text-zinc-300 transition-all hover:border-amber-400/40 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
                >
                  {quickAdding === qg.title ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" />
                  ) : (
                    <span className="shrink-0 text-zinc-500">{qg.icon}</span>
                  )}
                  {qg.title}
                </button>
              ))}
            </div>
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
                  demoMode={demoMode}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Feature 2: 30-day streak heatmap */}
      <StreakHeatmap doneDates={doneDateStrings} />

      {/* Feature 7: Achievement badges */}
      <AchievementBadges
        streak={streak}
        totalDone={doneLogs.length}
        doneToday={doneCount}
        totalGoals={total}
      />

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
          <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
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
              className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-400 disabled:bg-purple-800 disabled:opacity-60"
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
          <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
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

            {/* Feature 3: Structured review display */}
            <StructuredReview review={review} />

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
                className="flex items-center gap-0.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                View full review <ChevronRight className="w-3 h-3" />
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

      {/* Feature 5: Post-share polished card + tweet draft */}
      {tweetDraft && cardData && (
        <div className="space-y-6">
          {/* Tweet draft */}
          <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                <Bird className="h-3.5 w-3.5 text-sky-400" />
                Tweet Draft
              </h3>
              <span className="text-xs tabular-nums text-zinc-600">{tweetDraft.length}/240</span>
            </div>

            <textarea
              readOnly
              value={tweetDraft}
              className="h-24 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200 focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={copyTweet}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetDraft)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
              >
                <Bird className="h-3 w-3" />
                Post to X
              </a>
            </div>
          </div>

          {/* Feature 5: Polished progress card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Progress Card
              </h3>
              <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">
                Screenshot &amp; share
              </span>
            </div>
            <VisualProgressCard card={cardData} />
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile nav */}
      <div className="h-4 md:hidden" />
    </div>
  )
}
