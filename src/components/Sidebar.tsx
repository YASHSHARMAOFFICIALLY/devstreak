'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, Flame, Brain, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { todayDateKey } from '@/lib/date'

const today = todayDateKey()

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/wall', label: 'Wall', icon: Flame },
  { href: `/review/${today}`, label: 'Review', icon: Brain },
]

export default function Sidebar({
  username,
  avatarUrl,
  demoMode = false,
}: {
  username?: string | null
  avatarUrl?: string | null
  demoMode?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    if (demoMode) {
      router.push('/dashboard')
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-zinc-800 bg-zinc-950/95 backdrop-blur md:min-h-screen md:w-56 md:border-b-0 md:border-r md:bg-zinc-900">
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 md:block md:px-5 md:py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/10 ring-1 ring-amber-400/20">
            <Flame className="h-4 w-4 text-amber-400" />
          </span>
          <span className="font-bold tracking-tight text-zinc-100">DevStreak</span>
        </div>
        {!demoMode && (
          <button
            onClick={handleSignOut}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400 md:hidden"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-1 md:flex-col md:space-y-1 md:overflow-visible md:py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === `/review/${today}`
              ? pathname.startsWith('/review')
              : pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex min-w-max items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:gap-3',
                isActive
                  ? 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/15'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="hidden space-y-3 border-t border-zinc-800 px-3 py-4 md:block">
        <div className="flex items-center gap-3 px-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={username ?? 'User'}
              className="w-7 h-7 rounded-full ring-1 ring-zinc-700"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
              {username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span className="text-sm text-zinc-300 truncate">
            {username ?? 'Developer'}
          </span>
        </div>
        {demoMode ? (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-300">
            Demo data
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  )
}
