import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const id = Number(getRouterParam(event, 'id'))

  const account = await prisma.account.findFirst({
    where: { id, userId },
    include: {
      _count: { select: { notes: true, plans: true } },
    },
  })

  if (!account) {
    throw createError({ statusCode: 404, message: '账号不存在' })
  }

  return account
})
