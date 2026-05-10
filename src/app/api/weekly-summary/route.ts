import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type DayStat = {
  date: string
  shortLabel: string
  done: number
  skipped: number
  total: number
  focusScore: number
  review: { content: string | null } | null
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { days } = (await request.json()) as { userId: string; days: DayStat[] }

  if (!days || days.length === 0) {
    return NextResponse.json({ error: 'No day data provided' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  // Build a compact summary of the 7 days for the prompt
  const dayLines = days.map((d) => {
    const reviewSnippet = d.review?.content
      ? d.review.content.split(/[.!?]/)[0].trim()
      : 'No review'
    return `${d.shortLabel} (${d.date}): ${d.done} done, ${d.skipped} skipped of ${d.total} total. Focus: ${d.focusScore.toFixed(1)}/10. Review: "${reviewSnippet}"`
  })

  const prompt = `Here is a developer's last 7 days of goal tracking data:

${dayLines.join('\n')}

Write exactly 3 sentences:
1. Their strongest habit or best performing day this week (be specific with data).
2. Their weakest habit or most-avoided goal pattern this week (be specific and direct).
3. One concrete, actionable recommendation for next week.

Keep it sharp and honest. No fluff. Reference actual numbers from the data.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    return NextResponse.json({ summary }, { status: 200 })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
