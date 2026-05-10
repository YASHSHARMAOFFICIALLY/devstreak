import { createClient } from '@/lib/supabase/server'
import SignInButton from '@/components/SignInButton'
import { redirect } from 'next/navigation'
import { Flame, Target, Brain } from 'lucide-react'

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />

      <div className="relative w-full max-w-lg space-y-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-amber-400/10 ring-1 ring-amber-400/25">
            <Flame className="h-6 w-6 text-amber-400" />
          </span>
          <span className="text-2xl font-bold tracking-tight text-zinc-100">
            DevStreak
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-black leading-tight text-zinc-100 sm:text-5xl">
            Track goals.
            <br />
            <span className="text-amber-300">Get roasted.</span>
            <br />
            Stay consistent.
          </h1>
          <p className="mx-auto max-w-md text-base leading-7 text-zinc-400">
            Daily goal tracking for developers — with AI that either roasts your
            laziness or hypes your grind.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 text-sm sm:gap-3">
          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 shadow-2xl shadow-black/20">
            <Target className="w-5 h-5 text-amber-400 mx-auto" />
            <p className="text-zinc-300 font-medium leading-tight">Goal Tracking</p>
          </div>
          <div className="space-y-2 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 shadow-2xl shadow-amber-950/20">
            <Flame className="w-5 h-5 text-amber-400 mx-auto" />
            <p className="text-zinc-200 font-medium leading-tight">Streaks</p>
          </div>
          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 shadow-2xl shadow-black/20">
            <Brain className="w-5 h-5 text-amber-400 mx-auto" />
            <p className="text-zinc-300 font-medium leading-tight">AI Review</p>
          </div>
        </div>

        {/* CTA */}
        <SignInButton />

        {searchParams.error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Auth failed. Try again.
          </p>
        )}

        <p className="text-zinc-600 text-xs">
          No email. No password. Just GitHub.
        </p>
      </div>
    </div>
  )
}
