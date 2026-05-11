'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import WallCard, { type WallPost } from '@/components/WallCard'
import { Flame, Loader2, RefreshCw, Search, Share2, Users } from 'lucide-react'

type ShareableGoal = {
  id: string
  title: string
  category: string | null
  isDoneToday: boolean
}

type WallClientProps = {
  initialPosts: WallPost[]
  shareableGoals: ShareableGoal[]
  streakCount: number
}

type SortMode = 'recent' | 'streak' | 'focus'
type FilterMode = 'all' | 'done'

export default function WallClient({
  initialPosts,
  shareableGoals,
  streakCount,
}: WallClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [selectedGoalId, setSelectedGoalId] = useState(shareableGoals.find((goal) => goal.isDoneToday)?.id ?? shareableGoals[0]?.id ?? '')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isRefreshing, startRefresh] = useTransition()

  const loadPosts = useCallback(async () => {
    const res = await fetch('/api/wall', { cache: 'no-store' })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error ?? 'Could not refresh wall')
    }

    setPosts(data.posts ?? [])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('wall-posts-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wall_posts' },
        () => {
          startRefresh(() => {
            loadPosts().catch((err) => setError(err.message))
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPosts])

  const refresh = useCallback(() => {
    setError(null)
    startRefresh(() => {
      loadPosts().catch((err) => setError(err.message))
    })
  }, [loadPosts])

  const shareToWall = useCallback(async () => {
    if (!selectedGoalId) return

    setPosting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: selectedGoalId, isPublic: true }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not post to wall')
      }

      setSuccess('Posted to the wall')
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post to wall')
    } finally {
      setPosting(false)
    }
  }, [loadPosts, selectedGoalId])

  const totalPosts = posts.length
  const uniqueDevs = useMemo(() => {
    return new Set(posts.map((post) => post.users?.github_username ?? post.users?.display_name ?? post.id)).size
  }, [posts])

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const visible = posts.filter((post) => {
      if (filterMode === 'done' && !shareableGoals.some((goal) => goal.id === post.goal_id && goal.isDoneToday)) {
        return false
      }

      if (!needle) return true

      const values = [
        post.users?.display_name,
        post.users?.github_username,
        post.goals?.title,
        post.goals?.category,
        post.tweet_draft,
        post.ai_reviews?.content,
      ]

      return values.some((value) => value?.toLowerCase().includes(needle))
    })

    return [...visible].sort((a, b) => {
      if (sortMode === 'streak') return (b.streak_count ?? 0) - (a.streak_count ?? 0)
      if (sortMode === 'focus') {
        const aScore = a.ai_reviews?.focus_score ?? a.focus_score ?? -1
        const bScore = b.ai_reviews?.focus_score ?? b.focus_score ?? -1
        return bScore - aScore
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filterMode, posts, query, shareableGoals, sortMode])

  const doneGoals = shareableGoals.filter((goal) => goal.isDoneToday)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-amber-400" />
              <h1 className="text-2xl font-bold text-zinc-100">Streak Wall</h1>
            </div>
            <p className="text-sm text-zinc-500">
              Live accountability feed for developers shipping in public.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
            <div>
              <p className="text-xs uppercase text-zinc-600">Posts</p>
              <p className="text-lg font-bold tabular-nums text-zinc-200">{totalPosts}</p>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div>
              <p className="flex items-center gap-1 text-xs uppercase text-zinc-600">
                <Users className="h-3 w-3" /> Devs
              </p>
              <p className="text-lg font-bold tabular-nums text-zinc-200">{uniqueDevs}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-amber-200">Share today&apos;s progress</p>
              <p className="text-xs text-amber-300/80">
                {doneGoals.length > 0
                  ? `${doneGoals.length} completed goal${doneGoals.length === 1 ? '' : 's'} ready to post.`
                  : 'Mark a goal done on the dashboard, then post it here.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={selectedGoalId}
                onChange={(event) => setSelectedGoalId(event.target.value)}
                disabled={shareableGoals.length === 0}
                className="min-h-10 rounded-lg border border-amber-500/30 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-300 disabled:opacity-50"
              >
                {shareableGoals.length === 0 ? (
                  <option>No active goals</option>
                ) : (
                  shareableGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.isDoneToday ? 'Done - ' : ''}{goal.title}
                    </option>
                  ))
                )}
              </select>

              <button
                onClick={shareToWall}
                disabled={posting || !selectedGoalId || doneGoals.length === 0}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {posting ? 'Posting' : `Post ${streakCount}d streak`}
              </button>
            </div>
          </div>

          {(error || success) && (
            <p className={`mt-3 text-xs ${error ? 'text-red-300' : 'text-green-300'}`}>
              {error ?? success}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people, goals, categories, reviews"
            className="min-h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="min-h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          >
            <option value="recent">Newest first</option>
            <option value="streak">Highest streak</option>
            <option value="focus">Highest focus</option>
          </select>

          <select
            value={filterMode}
            onChange={(event) => setFilterMode(event.target.value as FilterMode)}
            className="min-h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          >
            <option value="all">All posts</option>
            <option value="done">My done goals</option>
          </select>

          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-20 text-center">
          <Flame className="mx-auto h-10 w-10 text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-500">
            {posts.length === 0 ? 'No posts yet. Be the first to flex your streak.' : 'No posts match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <WallCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
