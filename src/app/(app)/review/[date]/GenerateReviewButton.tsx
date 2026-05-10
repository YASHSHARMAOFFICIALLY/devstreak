'use client'

import { useState } from 'react'
import { Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function GenerateReviewButton({
  userId,
  date,
  mode,
  logsSummary,
}: {
  userId: string
  date: string
  mode: string
  logsSummary: { done: number; skipped: number; pending: number; total: number }
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, mode, logsSummary }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate review')
      }
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error generating review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 mx-auto bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
      >
        <Brain className="w-4 h-4" />
        {loading ? 'Generating…' : `Generate ${mode === 'roast' ? 'Roast' : 'Motivation'}`}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
