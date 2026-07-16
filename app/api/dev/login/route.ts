import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import {
  DEV_SESSION_COOKIE,
  DEV_SESSION_MAX_AGE,
  issueDevToken,
  verifyDevCredentials,
} from '@/lib/dev/auth'

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const username = String(form.get('username') ?? '')
  const password = String(form.get('password') ?? '')

  if (!verifyDevCredentials(username, password)) {
    const url = new URL('/dev/login', request.url)
    url.searchParams.set('error', '1')
    return NextResponse.redirect(url, { status: 303 })
  }

  const cookieStore = await cookies()
  cookieStore.set(DEV_SESSION_COOKIE, issueDevToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DEV_SESSION_MAX_AGE,
  })

  return NextResponse.redirect(new URL('/dev', request.url), { status: 303 })
}
