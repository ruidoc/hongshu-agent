import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)

  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { notes: true, plans: true } },
    },
  })

  return accounts
})
