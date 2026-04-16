import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  return user
})
