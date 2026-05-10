import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Flame, Target, Brain, GitBranch } from 'lucide-react'

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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <Flame className="w-8 h-8 text-amber-400" />
          <span className="text-2xl font-bold tracking-tight text-zinc-100">
            DevStreak
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-zinc-100 leading-tight">
            Track goals.
            <br />
            <span className="text-amber-400">Get roasted.</span>
            <br />
            Stay consistent.
          </h1>
          <p className="text-zinc-400 text-base">
            Daily goal tracking for developers — with AI that either roasts your
            laziness or hypes your grind.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1">
            <Target className="w-5 h-5 text-amber-400 mx-auto" />
            <p className="text-zinc-300 font-medium">Goal Tracking</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1">
            <Flame className="w-5 h-5 text-amber-400 mx-auto" />
            <p className="text-zinc-300 font-medium">Streaks</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1">
            <Brain className="w-5 h-5 text-amber-400 mx-auto" />
            <p className="text-zinc-300 font-medium">AI Review</p>
          </div>
        </div>

        {/* CTA */}
        <form action="/api/auth/github" method="GET">
          <SignInButton />
        </form>

        {searchParams.error && (
          <p className="text-red-400 text-sm">
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

function SignInButton() {
  return (
    <a
      href="/api/auth/github"
      className="flex items-center justify-center gap-3 w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-3 px-6 rounded-xl transition-colors duration-150"
    >
      <GitBranch className="w-5 h-5" />
      Sign in with GitHub
    </a>
  )
}
