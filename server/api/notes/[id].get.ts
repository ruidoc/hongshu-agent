import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const id = Number(getRouterParam(event, 'id'))

  const note = await prisma.note.findFirst({
    where: { id },
    include: {
      account: { select: { userId: true, name: true } },
      stats: true,
      plan: { select: { title: true } },
    },
  })

  if (!note || note.account.userId !== userId) {
    throw createError({ statusCode: 404, message: '笔记不存在' })
  }

  return note
})
