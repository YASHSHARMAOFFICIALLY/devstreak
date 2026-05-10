'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, Flame, Brain, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const today = new Date().toISOString().split('T')[0]

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/wall', label: 'Wall', icon: Flame },
  { href: `/review/${today}`, label: 'Review', icon: Brain },
]

export default function Sidebar({
  username,
  avatarUrl,
}: {
  username?: string | null
  avatarUrl?: string | null
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-56 min-h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-800">
        <Flame className="w-5 h-5 text-amber-400" />
        <span className="font-bold text-zinc-100 tracking-tight">DevStreak</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-3">
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
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
