import bcrypt from 'bcryptjs'
import prisma from '~/server/utils/prisma'
import { signToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, message: '邮箱和密码不能为空' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 400, message: '该邮箱已注册' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashed },
  })

  const token = signToken({ userId: user.id, email: user.email })

  return { token, user: { id: user.id, email: user.email } }
})
