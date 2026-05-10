import { createClient } from '@/lib/supabase/server'
import WallCard from '@/components/WallCard'
import { Flame, Users } from 'lucide-react'

export const revalidate = 60 // ISR — refresh every 60s

export default async function WallPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('wall_posts')
    .select(`
      id, streak_count, tweet_draft, focus_score, created_at, is_public,
      users ( github_username, display_name, avatar_url ),
      goals ( title, category ),
      ai_reviews ( content, focus_score )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  const totalPosts = (posts ?? []).length
  const uniqueDevs = new Set((posts ?? []).map((p) => {
    const u = p.users as { github_username?: string | null } | null
    return u?.github_username ?? 'anon'
  })).size

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-bold text-zinc-100">Streak Wall</h1>
            </div>
            <p className="text-zinc-500 text-sm">
              Public accountability board. Devs shipping in the open.
            </p>
          </div>

          {totalPosts > 0 && (
            <div className="hidden sm:flex items-center gap-4 text-right">
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-wider">Posts</p>
                <p className="text-lg font-bold text-zinc-200 tabular-nums">{totalPosts}</p>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3" /> Devs
                </p>
                <p className="text-lg font-bold text-zinc-200 tabular-nums">{uniqueDevs}</p>
              </div>
            </div>
          )}
        </div>

        {/* CTA to share */}
        {user && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-amber-300">
              Complete your goals today and share your streak to the wall.
            </p>
            <a
              href="/dashboard"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold whitespace-nowrap ml-4 transition-colors"
            >
              Go to dashboard →
            </a>
          </div>
        )}
      </div>

      {/* Feed */}
      {(posts ?? []).length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Flame className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-zinc-500">No posts yet. Be the first to flex your streak.</p>
          {user && (
            <a href="/dashboard" className="text-amber-400 text-sm hover:underline">
              Go generate your review →
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(posts ?? []).map((post) => (
            // @ts-expect-error supabase nested type
            <WallCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
