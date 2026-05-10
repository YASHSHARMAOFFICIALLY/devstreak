import { Flame } from 'lucide-react'
import clsx from 'clsx'

export default function StreakBadge({
  count,
  size = 'md',
}: {
  count: number
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 font-bold tabular-nums',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-2xl'
      )}
    >
      <Flame
        className={clsx(
          'text-amber-400',
          size === 'sm' && 'w-4 h-4',
          size === 'md' && 'w-5 h-5',
          size === 'lg' && 'w-7 h-7'
        )}
      />
      <span className="text-amber-400">{count}</span>
      <span className="text-zinc-500 font-normal text-sm">
        {count === 1 ? 'day' : 'days'}
      </span>
    </div>
  )
}
