import { Flame, ExternalLink, Star } from 'lucide-react'

type WallPost = {
  id: string
  streak_count: number | null
  tweet_draft: string | null
  focus_score: number | null
  created_at: string
  users: {
    github_username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
  goals: {
    title: string | null
    category: string | null
  } | null
  ai_reviews?: {
    content: string | null
    focus_score: number | null
  } | null
  review_snippet?: string | null
}

export default function WallCard({ post }: { post: WallPost }) {
  const user = post.users
  const goal = post.goals
  const streak = post.streak_count ?? 0

  // AI review snippet — first sentence only
  const reviewContent = post.ai_reviews?.content ?? null
  const snippet = reviewContent
    ? reviewContent.split(/[.!?]/)[0].trim() + '.'
    : null

  const focusScore = post.ai_reviews?.focus_score ?? post.focus_score ?? null

  const tweetUrl = post.tweet_draft
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.tweet_draft)}`
    : null

  const relativeTime = (() => {
    const diff = Date.now() - new Date(post.created_at).getTime()
    const h = Math.floor(diff / 3_600_000)
    const d = Math.floor(diff / 86_400_000)
    if (h < 1) return 'just now'
    if (h < 24) return `${h}h ago`
    if (d < 7) return `${d}d ago`
    return new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })()

  return (
    <div className="group space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/20">
      {/* Header — avatar + name + tweet link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.github_username ?? ''}
              className="w-9 h-9 rounded-full ring-1 ring-zinc-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
              {(user?.display_name ?? user?.github_username ?? '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-zinc-100 leading-tight">
              {user?.display_name ?? user?.github_username ?? 'Anonymous'}
            </p>
            {user?.github_username && (
              <p className="text-xs text-zinc-500">@{user.github_username}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">{relativeTime}</span>
          {tweetUrl && (
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-sky-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Tweet this"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Goal title */}
      {goal?.title && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Goal</p>
          <p className="text-sm text-zinc-200 font-medium leading-snug">{goal.title}</p>
        </div>
      )}

      {/* AI Review snippet */}
      {snippet && (
        <p className="text-xs text-zinc-400 italic leading-relaxed border-l-2 border-zinc-700 pl-3">
          &ldquo;{snippet}&rdquo;
        </p>
      )}

      {/* Streak + Focus row */}
      <div className="flex items-center gap-4 pt-1 border-t border-zinc-800">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold tabular-nums">{streak}</span>
          <span className="text-zinc-500 text-xs">day streak</span>
        </div>

        {focusScore != null && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-purple-400 font-semibold text-sm tabular-nums">
              {focusScore.toFixed(1)}
            </span>
            <span className="text-zinc-600 text-xs">/10</span>
          </div>
        )}
      </div>
    </div>
  )
}
