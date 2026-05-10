'use client'

import { GitBranch, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function SignInButton() {
  const [pending, setPending] = useState(false)

  return (
    <a
      href="/api/auth/github"
      aria-disabled={pending}
      onClick={() => setPending(true)}
      className="flex w-full items-center justify-center gap-3 rounded-lg bg-zinc-100 px-6 py-3.5 font-semibold text-zinc-900 shadow-xl shadow-black/30 transition-all duration-150 hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-zinc-950 aria-disabled:pointer-events-none aria-disabled:opacity-80"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <GitBranch className="h-5 w-5" />
      )}
      {pending ? 'Opening GitHub...' : 'Sign in with GitHub'}
    </a>
  )
}
