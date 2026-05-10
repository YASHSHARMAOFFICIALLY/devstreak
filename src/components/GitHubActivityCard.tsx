'use client'

import { useEffect, useState } from 'react'
import { Code2, GitPullRequest, Loader2, Radio, AlertTriangle } from 'lucide-react'

type ActivityEvent = {
  id: string
  type: 'commit' | 'pull_request' | 'issue'
  label: string
  detail: string
  repo: string
  url?: string
  createdAt: string
}

type ActivityResponse = {
  username: string | null
  events: ActivityEvent[]
  error?: string
}

function ActivityIcon({ type }: { type: ActivityEvent['type'] }) {
  if (type === 'pull_request') return <GitPullRequest className="h-4 w-4 text-purple-400" />
  if (type === 'issue') return <AlertTriangle className="h-4 w-4 text-amber-400" />
  return <Code2 className="h-4 w-4 text-green-400" />
}

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default function GitHubActivityCard() {
  const [activity, setActivity] = useState<ActivityResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetch('/api/github/activity')
      .then((response) => response.json())
      .then((data: ActivityResponse) => {
        if (active) setActivity(data)
      })
      .catch(() => {
        if (active) setActivity({ username: null, events: [], error: 'Unable to load GitHub activity' })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Radio className="h-3.5 w-3.5 text-green-400" />
            GitHub Signals
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Public activity that can support today&apos;s progress.
          </p>
        </div>
        {activity?.username && (
          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400">
            @{activity.username}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking GitHub activity...
        </div>
      ) : activity?.events.length ? (
        <div className="space-y-2">
          {activity.events.map((event) => {
            const content = (
              <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 transition-colors hover:border-zinc-700">
                <span className="mt-0.5 shrink-0">
                  <ActivityIcon type={event.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-zinc-200">{event.label}</p>
                    <span className="shrink-0 text-xs text-zinc-600">
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm text-zinc-400">{event.detail}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-600">{event.repo}</p>
                </div>
              </div>
            )

            return event.url ? (
              <a key={event.id} href={event.url} target="_blank" rel="noreferrer">
                {content}
              </a>
            ) : (
              <div key={event.id}>{content}</div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-sm text-zinc-500">
          {activity?.error ?? 'No recent public GitHub activity found. Push a commit or open a PR to create proof-of-work.'}
        </div>
      )}
    </div>
  )
}
