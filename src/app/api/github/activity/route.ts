import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { NextResponse } from 'next/server'

type GitHubEvent = {
  id: string
  type: string
  repo?: { name?: string }
  created_at: string
  payload?: {
    commits?: { message?: string }[]
    action?: string
    pull_request?: { title?: string; html_url?: string }
    issue?: { title?: string; html_url?: string }
  }
}

function summarizeEvent(event: GitHubEvent) {
  const repo = event.repo?.name ?? 'GitHub'

  if (event.type === 'PushEvent') {
    const commitCount = event.payload?.commits?.length ?? 0
    const firstMessage = event.payload?.commits?.[0]?.message?.split('\n')[0]
    return {
      id: event.id,
      type: 'commit',
      label: `${commitCount || 1} commit${commitCount === 1 ? '' : 's'}`,
      detail: firstMessage ?? `Pushed updates to ${repo}`,
      repo,
      createdAt: event.created_at,
    }
  }

  if (event.type === 'PullRequestEvent') {
    const action = event.payload?.action ?? 'updated'
    return {
      id: event.id,
      type: 'pull_request',
      label: `Pull request ${action}`,
      detail: event.payload?.pull_request?.title ?? `Updated a pull request in ${repo}`,
      repo,
      url: event.payload?.pull_request?.html_url,
      createdAt: event.created_at,
    }
  }

  if (event.type === 'IssuesEvent') {
    const action = event.payload?.action ?? 'updated'
    return {
      id: event.id,
      type: 'issue',
      label: `Issue ${action}`,
      detail: event.payload?.issue?.title ?? `Updated an issue in ${repo}`,
      repo,
      url: event.payload?.issue?.html_url,
      createdAt: event.created_at,
    }
  }

  return null
}

function demoActivity() {
  return NextResponse.json({
    username: 'yashcodes',
    events: [
      {
        id: 'demo-gh-1',
        type: 'commit',
        label: '3 commits',
        detail: 'Polish dashboard demo mode and activity insights',
        repo: 'YASHSHARMAOFFICIALLY/devstreak',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-gh-2',
        type: 'pull_request',
        label: 'Pull request opened',
        detail: 'Add GitHub activity sync to accountability dashboard',
        repo: 'YASHSHARMAOFFICIALLY/devstreak',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ],
  })
}

export async function GET() {
  if (isDemoMode()) return demoActivity()

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('github_username')
    .eq('id', user.id)
    .single()

  const username = profile?.github_username

  if (!username) {
    return NextResponse.json({ username: null, events: [] })
  }

  const response = await fetch(`https://api.github.com/users/${username}/events/public`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'DevStreak',
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Unable to load GitHub activity', username, events: [] },
      { status: 502 }
    )
  }

  const events = ((await response.json()) as GitHubEvent[])
    .map(summarizeEvent)
    .filter(Boolean)
    .slice(0, 5)

  return NextResponse.json({ username, events })
}
