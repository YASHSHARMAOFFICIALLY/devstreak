import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const githubUsername =
          user.user_metadata?.user_name ?? user.user_metadata?.preferred_username ?? null
        const displayName = user.user_metadata?.full_name ?? githubUsername
        const avatarUrl = user.user_metadata?.avatar_url ?? null

        await supabase.from('users').upsert(
          {
            id: user.id,
            github_username: githubUsername,
            display_name: displayName,
            avatar_url: avatarUrl,
          },
          { onConflict: 'id' }
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}
