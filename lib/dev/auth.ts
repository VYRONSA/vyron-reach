import { createHmac, timingSafeEqual } from 'crypto'

export const DEV_SESSION_COOKIE = 'vyron_dev_session'
export const DEV_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function expectedToken(username: string, password: string) {
  return createHmac('sha256', password).update(username).digest('hex')
}

export function verifyDevCredentials(username: string, password: string): boolean {
  const validUser = process.env.DEV_USERNAME ?? ''
  const validPass = process.env.DEV_PASSWORD ?? ''
  if (!validUser || !validPass) return false
  return username === validUser && password === validPass
}

export function issueDevToken(): string {
  const username = process.env.DEV_USERNAME ?? ''
  const password = process.env.DEV_PASSWORD ?? ''
  return expectedToken(username, password)
}

export function isValidDevToken(token: string | undefined | null): boolean {
  const username = process.env.DEV_USERNAME ?? ''
  const password = process.env.DEV_PASSWORD ?? ''
  if (!token || !username || !password) return false

  const expected = expectedToken(username, password)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
