import { createClient } from '@/lib/supabase/server'
import { addDaysToDateKey } from '@/lib/date'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function calcFocusScore(done: number, total: number, streak: number): number {
  if (total === 0) return 0
  const streakMultiplier = Math.min(streak / 7, 1) + 1 // 1.0 – 2.0
  const raw = (done / total) * streakMultiplier
  return Math.round(raw * 5 * 10) / 10 // 0 – 10
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date } = await request.json()

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  }

  // Parallel Supabase queries
  const sevenDaysAgoStr = addDaysToDateKey(date, -6)

  const [goalsRes, todayLogsRes, weekLogsRes, userRes] = await Promise.all([
    supabase
      .from('goals')
      .select('id, title, category')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('daily_logs')
      .select('goal_id, status, skip_reason, notes')
      .eq('user_id', user.id)
      .eq('date', date),
    supabase
      .from('daily_logs')
      .select('goal_id, status, date')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .lte('date', date),
    supabase
      .from('users')
      .select('mode, streak_count')
      .eq('id', user.id)
      .single(),
  ])

  const goals = goalsRes.data ?? []
  const todayLogs = todayLogsRes.data ?? []
  const weekLogs = weekLogsRes.data ?? []
  const userData = userRes.data

  const mode = userData?.mode ?? 'motivate'
  const streak = userData?.streak_count ?? 0

  // Build a goal map
  const goalMap = new Map(goals.map((g) => [g.id, g]))

  // Classify today's logs
  const done: string[] = []
  const skipped: { title: string; reason?: string }[] = []
  const pending: string[] = []

  const loggedGoalIds = new Set(todayLogs.map((l) => l.goal_id))

  for (const log of todayLogs) {
    const goal = goalMap.get(log.goal_id)
    if (!goal) continue
    if (log.status === 'done') done.push(goal.title)
    else if (log.status === 'skip') skipped.push({ title: goal.title, reason: log.skip_reason ?? undefined })
  }

  for (const goal of goals) {
    if (!loggedGoalIds.has(goal.id)) pending.push(goal.title)
  }

  // 7-day skip pattern
  const skipCounts = new Map<string, number>()
  for (const log of weekLogs) {
    if (log.status === 'skip') {
      const cnt = skipCounts.get(log.goal_id) ?? 0
      skipCounts.set(log.goal_id, cnt + 1)
    }
  }
  const totalSkips = Array.from(skipCounts.values()).reduce((a, b) => a + b, 0)
  const mostSkippedId = Array.from(skipCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostSkippedTitle = mostSkippedId ? goalMap.get(mostSkippedId)?.title : undefined

  const skipPatternStr =
    totalSkips === 0
      ? 'No skips in the last 7 days'
      : `${totalSkips} skip${totalSkips > 1 ? 's' : ''} in 7 days${mostSkippedTitle ? `, most skipped: "${mostSkippedTitle}"` : ''}`

  // Focus score
  const focusScore = calcFocusScore(done.length, goals.length, streak)

  // Build prompt
  const systemPrompt = `You are a strict AI accountability partner reviewing someone's daily developer goals. Be direct, specific, and reference the actual data. Max 4 sentences. Never be generic or use filler phrases. End your response with exactly one line: "burnout: true" or "burnout: false".`

  const skippedStr =
    skipped.length === 0
      ? 'None'
      : skipped.map((s) => `"${s.title}"${s.reason ? ` (reason: ${s.reason})` : ''}`).join(', ')

  const userPrompt = `Mode: ${mode}
Goals today (${goals.length} total): ${goals.map((g) => `"${g.title}"`).join(', ')}
Completed (${done.length}): ${done.length > 0 ? done.map((t) => `"${t}"`).join(', ') : 'None'}
Skipped (${skipped.length}): ${skippedStr}
Pending (${pending.length}): ${pending.length > 0 ? pending.map((t) => `"${t}"`).join(', ') : 'None'}
Streak: ${streak} days
Last 7 days skip pattern: ${skipPatternStr}

Write a nightly review. If mode is "roast", be sharp and call out excuses without being cruel. If mode is "motivate", be energetic but still specific. End with one prediction or warning about tomorrow. Then on the very last line write exactly: "burnout: true" or "burnout: false".`

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback: no API key
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let content: string
  let burnoutFlag = false

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const lines = raw.trim().split('\n')
    const lastLine = lines[lines.length - 1].toLowerCase().trim()

    if (lastLine === 'burnout: true' || lastLine === 'burnout: false') {
      burnoutFlag = lastLine === 'burnout: true'
      content = lines.slice(0, -1).join('\n').trim()
    } else {
      content = raw.trim()
      // Heuristic fallback
      burnoutFlag = skipped.length > done.length && goals.length > 2
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }

  // Upsert into ai_reviews (allow regeneration)
  const { data: review, error: upsertError } = await supabase
    .from('ai_reviews')
    .upsert(
      {
        user_id: user.id,
        date,
        content,
        burnout_flag: burnoutFlag,
        focus_score: focusScore,
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ review }, { status: 200 })
}
