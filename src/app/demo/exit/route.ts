import { DEMO_COOKIE } from '@/lib/demo'
import { NextResponse, type NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.search = ''

  const response = NextResponse.redirect(url)
  response.cookies.set(DEMO_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}
