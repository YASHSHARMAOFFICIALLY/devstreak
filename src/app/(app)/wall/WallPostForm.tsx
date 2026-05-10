'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function WallPostForm({
  userId,
  goals,
  streakCount,
}: {
  userId: string
  goals: { id: string; title: string }[]
  streakCount: number
}) {
  const [selectedGoal, setSelectedGoal] = useState(goals[0]?.id ?? '')
  const [posting, setPosting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function postToWall() {
    if (!selectedGoal) return
    setPosting(true)

    const goal = goals.find((g) => g.id === selectedGoal)
    const tweetDraft = `🔥 Day ${streakCount} streak on DevStreak! Currently working on: "${goal?.title}". Staying consistent 💪 #DevStreak #BuildInPublic`

    await supabase.from('wall_posts').insert({
      user_id: userId,
      goal_id: selectedGoal,
      streak_count: streakCount,
      is_public: true,
      tweet_draft: tweetDraft,
      card_data: { goal: goal?.title, streak: streakCount },
    })

    router.refresh()
    setPosting(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300">Post to Wall</h3>
      <div className="flex gap-3">
        <select
          value={selectedGoal}
          onChange={(e) => setSelectedGoal(e.target.value)}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
        >
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <button
          onClick={postToWall}
          disabled={posting || !selectedGoal}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
      <p className="text-xs text-zinc-600">
        🔥 {streakCount} day streak · Posts are visible to everyone
      </p>
    </div>
  )
}
