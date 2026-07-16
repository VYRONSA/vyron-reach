import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEV_SESSION_COOKIE, isOwner, isValidDevToken } from '@/lib/dev/auth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/dev/login') {
    return NextResponse.next()
  }

  const token = request.cookies.get(DEV_SESSION_COOKIE)?.value
  if (!isValidDevToken(token)) {
    const loginUrl = new URL('/dev/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/dev/admin') && !isOwner()) {
    return NextResponse.redirect(new URL('/dev', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dev', '/dev/:path*'],
}
