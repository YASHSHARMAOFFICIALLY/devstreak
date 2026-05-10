'use client'

import clsx from 'clsx'

type Badge = {
  id: string
  label: string
  description: string
  icon: string
  unlocked: boolean
  rarity: 'common' | 'rare' | 'epic'
}

type Props = {
  streak: number
  totalDone: number
  doneToday: number
  totalGoals: number
}

function buildBadges({ streak, totalDone, doneToday, totalGoals }: Props): Badge[] {
  return [
    {
      id: 'first_done',
      label: 'First Blood',
      description: 'Complete your first goal',
      icon: '🎯',
      unlocked: totalDone >= 1,
      rarity: 'common',
    },
    {
      id: 'streak_3',
      label: 'On Fire',
      description: '3-day streak',
      icon: '🔥',
      unlocked: streak >= 3,
      rarity: 'common',
    },
    {
      id: 'streak_7',
      label: 'Week Warrior',
      description: '7-day streak',
      icon: '⚡',
      unlocked: streak >= 7,
      rarity: 'rare',
    },
    {
      id: 'streak_30',
      label: 'Month Legend',
      description: '30-day streak',
      icon: '💎',
      unlocked: streak >= 30,
      rarity: 'epic',
    },
    {
      id: 'perfect_day',
      label: 'Perfect Day',
      description: 'Complete all goals in a day',
      icon: '✅',
      unlocked: totalGoals > 0 && doneToday === totalGoals,
      rarity: 'rare',
    },
    {
      id: 'grinder',
      label: 'Grinder',
      description: 'Complete 50 total goals',
      icon: '🏆',
      unlocked: totalDone >= 50,
      rarity: 'epic',
    },
  ]
}

const rarityStyles: Record<Badge['rarity'], string> = {
  common: 'border-zinc-700 bg-zinc-800',
  rare: 'border-blue-500/40 bg-blue-500/10',
  epic: 'border-amber-500/40 bg-amber-500/10',
}

const rarityLocked = 'border-zinc-800 bg-zinc-900/40 opacity-40'

export default function AchievementBadges({ streak, totalDone, doneToday, totalGoals }: Props) {
  const badges = buildBadges({ streak, totalDone, doneToday, totalGoals })
  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Achievements
        </p>
        <p className="text-xs text-zinc-600 tabular-nums">
          {unlockedCount}/{badges.length}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className={clsx(
              'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all',
              badge.unlocked ? rarityStyles[badge.rarity] : rarityLocked
            )}
          >
            <span className="text-xl leading-none">{badge.icon}</span>
            <p className="text-[10px] font-semibold leading-tight text-zinc-300">{badge.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
