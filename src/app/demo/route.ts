import { DEMO_COOKIE } from '@/lib/demo'
import { NextResponse, type NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'
  url.search = ''

  const response = NextResponse.redirect(url)
  response.cookies.set(DEMO_COOKIE, 'true', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return response
}
