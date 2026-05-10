import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { goalId, isPublic } = await request.json()

  // Fetch data in parallel
  const [profileRes, goalRes, reviewRes, ghRes] = await Promise.all([
    supabase
      .from('users')
      .select('streak_count, display_name, github_username, avatar_url, mode')
      .eq('id', user.id)
      .single(),
    supabase.from('goals').select('title, category').eq('id', goalId).single(),
    supabase
      .from('ai_reviews')
      .select('content, focus_score')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single(),
    // Get today's done goal count
    supabase
      .from('daily_logs')
      .select('goal_id')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .eq('status', 'done'),
  ])

  const profile = profileRes.data
  const goal = goalRes.data
  const review = reviewRes.data

  const streakCount = profile?.streak_count ?? 0
  const username = profile?.github_username ?? 'developer'
  const goalsDone = (ghRes.data ?? []).length
  const focusScore = review?.focus_score ?? null

  // Generate tweet with Anthropic
  let tweetDraft: string

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = `Write a tweet (max 240 chars) for a developer who just completed "${goal?.title ?? 'their goals'}" with a ${streakCount}-day streak. They completed ${goalsDone} goal${goalsDone !== 1 ? 's' : ''} today${focusScore != null ? ` with a focus score of ${focusScore}/10` : ''}. Tone: proud but humble. Include #buildinpublic. No hashtag spam. No emojis unless it adds meaning. Just the tweet text, nothing else.`

      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
      // Trim to 240 chars
      tweetDraft = raw.length > 240 ? raw.slice(0, 237) + '...' : raw
    } catch {
      tweetDraft = `Day ${streakCount} streak — just completed "${goal?.title}". Staying consistent. #buildinpublic`
    }
  } else {
    tweetDraft = `Day ${streakCount} streak — just completed "${goal?.title}". Staying consistent. #buildinpublic`
  }

  // Check if a wall post already exists for this goal today
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('wall_posts')
    .select('id')
    .eq('user_id', user.id)
    .eq('goal_id', goalId)
    .gte('created_at', today + 'T00:00:00')
    .maybeSingle()

  let post
  let error

  if (existing) {
    // Update existing
    const res = await supabase
      .from('wall_posts')
      .update({
        is_public: isPublic ?? true,
        streak_count: streakCount,
        tweet_draft: tweetDraft,
        focus_score: focusScore,
        card_data: {
          goal: goal?.title,
          streak: streakCount,
          name: profile?.display_name ?? username,
          focusScore,
          goalsDone,
          date: today,
          avatar_url: profile?.avatar_url,
        },
      })
      .eq('id', existing.id)
      .select()
      .single()
    post = res.data
    error = res.error
  } else {
    const res = await supabase
      .from('wall_posts')
      .insert({
        user_id: user.id,
        goal_id: goalId,
        streak_count: streakCount,
        is_public: isPublic ?? true,
        tweet_draft: tweetDraft,
        focus_score: focusScore,
        card_data: {
          goal: goal?.title,
          streak: streakCount,
          name: profile?.display_name ?? username,
          focusScore,
          goalsDone,
          date: today,
          avatar_url: profile?.avatar_url,
        },
      })
      .select()
      .single()
    post = res.data
    error = res.error
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      post,
      tweetDraft,
      cardData: {
        name: profile?.display_name ?? username,
        username,
        streak: streakCount,
        goal: goal?.title,
        focusScore,
        goalsDone,
        date: today,
        avatar_url: profile?.avatar_url,
      },
    },
    { status: 200 }
  )
}
