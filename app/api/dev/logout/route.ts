import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { DEV_SESSION_COOKIE } from '@/lib/dev/auth'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete(DEV_SESSION_COOKIE)
  return NextResponse.redirect(new URL('/dev/login', request.url), { status: 303 })
}
