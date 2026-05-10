'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Trash2,
  PauseCircle,
  PlayCircle,
  Flame,
  X,
  ChevronDown,
  Code2,
  Dumbbell,
  BookOpen,
  GitPullRequest,
  MoreHorizontal,
} from 'lucide-react'
import clsx from 'clsx'

type Category = 'code' | 'fitness' | 'learning' | 'oss' | 'other'

type Goal = {
  id: string
  title: string
  category: Category
  is_active: boolean
  created_at: string
  user_id: string
}

type DoneLog = {
  goal_id: string
  date: string
}

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: 'code', label: 'Code', icon: <Code2 className="w-4 h-4" /> },
  { value: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'learning', label: 'Learning', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'oss', label: 'OSS', icon: <GitPullRequest className="w-4 h-4" /> },
  { value: 'other', label: 'Other', icon: <MoreHorizontal className="w-4 h-4" /> },
]

const BADGE_COLORS: Record<Category, string> = {
  code: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  fitness: 'bg-green-400/10 text-green-400 border-green-400/20',
  learning: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  oss: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  other: 'bg-zinc-700/40 text-zinc-400 border-zinc-600/20',
}

const ICON_COLORS: Record<Category, string> = {
  code: 'text-blue-400',
  fitness: 'text-green-400',
  learning: 'text-purple-400',
  oss: 'text-orange-400',
  other: 'text-zinc-400',
}

function calculateGoalStreak(goalId: string, doneLogs: DoneLog[]): number {
  const dates = doneLogs
    .filter((l) => l.goal_id === goalId)
    .map((l) => l.date)
  const dateSet = new Set(dates)

  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (dateSet.has(dateStr)) {
      streak++
    } else {
      if (i > 0) break
    }
  }

  return streak
}

export default function GoalsClient({
  initialGoals,
  doneLogs: initialDoneLogs,
  userId,
}: {
  initialGoals: Goal[]
  doneLogs: DoneLog[]
  userId: string
}) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [doneLogs] = useState<DoneLog[]>(initialDoneLogs)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('code')
  const [adding, setAdding] = useState(false)
  const [showPaused, setShowPaused] = useState(false)
  const supabase = createClient()

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('goals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGoals((prev) => {
              if (prev.find((g) => g.id === (payload.new as Goal).id)) return prev
              return [payload.new as Goal, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setGoals((prev) =>
              prev.map((g) =>
                g.id === (payload.new as Goal).id ? (payload.new as Goal) : g
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setGoals((prev) => prev.filter((g) => g.id !== (payload.old as Goal).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const addGoal = useCallback(async () => {
    if (!title.trim() || adding) return
    setAdding(true)
    const { error } = await supabase
      .from('goals')
      .insert({ user_id: userId, title: title.trim(), category, is_active: true })

    if (!error) {
      setTitle('')
      setShowForm(false)
    }
    setAdding(false)
  }, [title, category, adding, supabase, userId])

  async function toggleActive(goal: Goal) {
    await supabase
      .from('goals')
      .update({ is_active: !goal.is_active })
      .eq('id', goal.id)
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
  }

  const active = goals.filter((g) => g.is_active)
  const paused = goals.filter((g) => !g.is_active)

  return (
    <div className="space-y-6">
      {/* New Goal Form / Button */}
      {showForm ? (
        <div className="bg-zinc-900 border border-amber-400/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">New Goal</h3>
            <button
              onClick={() => { setShowForm(false); setTitle('') }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            placeholder="e.g. Commit to GitHub daily"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
            autoFocus
          />

          {/* Category dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors pr-8"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Preview badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">Preview:</span>
            <span
              className={clsx(
                'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border',
                BADGE_COLORS[category]
              )}
            >
              {category}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={addGoal}
              disabled={adding || !title.trim()}
              className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {adding ? 'Adding…' : 'Add Goal'}
            </button>
            <button
              onClick={() => { setShowForm(false); setTitle('') }}
              className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      )}

      {/* Active goals grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Active <span className="text-zinc-600 font-normal">({active.length})</span>
          </h2>
        </div>

        {active.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-600 text-sm">No active goals yet. Add one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {active.map((goal) => {
              const streak = calculateGoalStreak(goal.id, doneLogs)
              const cat = CATEGORIES.find((c) => c.value === goal.category)
              return (
                <GoalCardFull
                  key={goal.id}
                  goal={goal}
                  streak={streak}
                  cat={cat}
                  onToggle={() => toggleActive(goal)}
                  onDelete={() => deleteGoal(goal.id)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Paused goals (collapsible) */}
      {paused.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowPaused((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider hover:text-zinc-400 transition-colors"
          >
            <ChevronDown
              className={clsx('w-3.5 h-3.5 transition-transform', showPaused && 'rotate-180')}
            />
            Paused ({paused.length})
          </button>

          {showPaused && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-50">
              {paused.map((goal) => {
                const cat = CATEGORIES.find((c) => c.value === goal.category)
                return (
                  <GoalCardFull
                    key={goal.id}
                    goal={goal}
                    streak={0}
                    cat={cat}
                    onToggle={() => toggleActive(goal)}
                    onDelete={() => deleteGoal(goal.id)}
                    paused
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GoalCardFull({
  goal,
  streak,
  cat,
  onToggle,
  onDelete,
  paused,
}: {
  goal: Goal
  streak: number
  cat?: { value: Category; label: string; icon: React.ReactNode }
  onToggle: () => void
  onDelete: () => void
  paused?: boolean
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors group">
      {/* Top: category badge + actions */}
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border',
            BADGE_COLORS[goal.category]
          )}
        >
          <span className={clsx('w-3 h-3', ICON_COLORS[goal.category])}>
            {cat?.icon}
          </span>
          {goal.category}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggle}
            className="p-1 rounded text-zinc-600 hover:text-amber-400 transition-colors"
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? (
              <PlayCircle className="w-3.5 h-3.5" />
            ) : (
              <PauseCircle className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-zinc-100 leading-snug">{goal.title}</p>

      {/* Streak */}
      <div className="flex items-center gap-1.5 mt-auto">
        <Flame
          className={clsx(
            'w-4 h-4',
            streak > 0 ? 'text-amber-400' : 'text-zinc-700'
          )}
        />
        <span
          className={clsx(
            'text-sm font-bold tabular-nums',
            streak > 0 ? 'text-amber-400' : 'text-zinc-700'
          )}
        >
          {streak}
        </span>
        <span className="text-xs text-zinc-600">
          {streak === 1 ? 'day streak' : 'day streak'}
        </span>
      </div>
    </div>
  )
}
