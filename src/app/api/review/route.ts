import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, mode, logsSummary } = await request.json()

  // Check if review already exists
  const { data: existing } = await supabase
    .from('ai_reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Review already exists for this date' }, { status: 409 })
  }

  const { done, skipped, pending, total } = logsSummary ?? {}
  const completion = total > 0 ? Math.round((done / total) * 100) : 0
  const focusScore = Math.min(10, Math.max(0, (done / Math.max(total, 1)) * 10 - skipped * 0.5))
  const burnoutFlag = skipped > done && total > 2

  let content: string

  if (mode === 'roast') {
    if (completion === 100) {
      content = `Wow, you actually did everything? Someone call the press. ${done}/${total} goals completed. Enjoy it while it lasts — tomorrow's another chance to disappoint yourself. 🔥`
    } else if (completion >= 60) {
      content = `${done} out of ${total}? Not terrible, I guess. You skipped ${skipped} things because... what, your fingers got tired? You're running a streak, not a vacation. Lock in. 🔥`
    } else if (completion > 0) {
      content = `${done} done, ${skipped} skipped, ${pending} still pending. You had ONE job. Actually you had ${total} jobs, and you couldn't finish most of them. The streak is judging you. 💀`
    } else {
      content = `Zero goals completed. ZERO. Your streak is crying in the corner. What exactly happened today? Was breathing too exhausting? Come on. 💀`
    }
  } else {
    if (completion === 100) {
      content = `PERFECT DAY. ${done}/${total} goals crushed. You're unstoppable right now — this is what consistency looks like. The streak is real and so are you. Keep building. 🚀`
    } else if (completion >= 60) {
      content = `Solid effort today — ${done} out of ${total} goals done. That's real progress. You showed up, and that matters more than perfection. Tomorrow, go for ${total}/${total}. 💪`
    } else if (completion > 0) {
      content = `You got ${done} done today. That's ${done} more than zero. Life happens, and you still moved forward. Reset tomorrow and give it everything. The streak continues. ⚡`
    } else {
      content = `Today was rough — no completed goals, but you're still here and that counts. Rest if you need to, but come back tomorrow ready to go. The streak is waiting for you. 🌱`
    }
  }

  const { data: review, error } = await supabase
    .from('ai_reviews')
    .insert({
      user_id: user.id,
      date,
      content,
      burnout_flag: burnoutFlag,
      focus_score: Math.round(focusScore * 10) / 10,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review }, { status: 200 })
}
