import bcrypt from 'bcryptjs'
import prisma from '~/server/utils/prisma'
import { signToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, message: '邮箱和密码不能为空' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({ statusCode: 401, message: '邮箱或密码错误' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: '邮箱或密码错误' })
  }

  const token = signToken({ userId: user.id, email: user.email })

  return { token, user: { id: user.id, email: user.email } }
})
