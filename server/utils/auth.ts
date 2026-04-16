import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

interface JwtPayload {
  userId: number
  email: string
}

export function signToken(payload: JwtPayload): string {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  const config = useRuntimeConfig()
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}

export function getUserFromEvent(event: H3Event): JwtPayload {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: '未登录' })
  }
  try {
    return verifyToken(auth.slice(7))
  } catch {
    throw createError({ statusCode: 401, message: '登录已过期' })
  }
}
