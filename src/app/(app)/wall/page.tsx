import { createClient } from '@/lib/supabase/server'
import WallCard from '@/components/WallCard'
import { Flame, Users } from 'lucide-react'
import { demoWallPosts, isDemoMode } from '@/lib/demo'

export const revalidate = 60 // ISR — refresh every 60s

type WallPost = {
  id: string
  streak_count: number | null
  tweet_draft: string | null
  focus_score: number | null
  created_at: string
  is_public?: boolean | null
  users:
    | {
        github_username: string | null
        display_name: string | null
        avatar_url: string | null
      }
    | null
  goals:
    | {
        title: string | null
        category: string | null
      }
    | null
  ai_reviews?:
    | {
        content: string | null
        focus_score: number | null
      }
    | null
}

export default async function WallPage() {
  const demoMode = isDemoMode()

  if (demoMode) {
    return <Wall posts={demoWallPosts()} userSignedIn />
  }

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

  return <Wall posts={(posts ?? []) as unknown as WallPost[]} userSignedIn={Boolean(user)} />
}

function Wall({
  posts,
  userSignedIn,
}: {
  posts: WallPost[]
  userSignedIn: boolean
}) {
  const totalPosts = posts.length
  const uniqueDevs = new Set(posts.map((p) => {
    const u = p.users as { github_username?: string | null } | null
    return u?.github_username ?? 'anon'
  })).size

  return (
    <div className="mx-auto max-w-5xl space-y-8">
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
        {userSignedIn && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
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
      {posts.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Flame className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-zinc-500">No posts yet. Be the first to flex your streak.</p>
          {userSignedIn && (
            <a href="/dashboard" className="text-amber-400 text-sm hover:underline">
              Go generate your review →
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <WallCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
