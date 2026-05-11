import { createClient } from '@/lib/supabase/server'
import { todayDateKey } from '@/lib/date'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: posts, error } = await supabase
    .from('wall_posts')
    .select(`
      id, goal_id, streak_count, tweet_draft, focus_score, created_at, is_public,
      users ( github_username, display_name, avatar_url ),
      goals ( title, category ),
      ai_reviews ( content, focus_score )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      posts: (posts ?? []).map((post) => ({
        ...post,
        users: firstRelation(post.users),
        goals: firstRelation(post.goals),
        ai_reviews: firstRelation(post.ai_reviews),
      })),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { goalId, isPublic } = await request.json()

  if (!goalId) {
    return NextResponse.json({ error: 'Missing goalId' }, { status: 400 })
  }

  const today = todayDateKey()

  // Fetch data in parallel
  const [profileRes, goalRes, reviewRes, ghRes] = await Promise.all([
    supabase
      .from('users')
      .select('streak_count, display_name, github_username, avatar_url, mode')
      .eq('id', user.id)
      .single(),
    supabase
      .from('goals')
      .select('title, category')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single(),
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
      .eq('date', today)
      .eq('status', 'done'),
  ])

  const profile = profileRes.data
  const goal = goalRes.data
  const review = reviewRes.data

  if (goalRes.error || !goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }

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
