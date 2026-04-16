import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const note = await prisma.note.findFirst({
    where: { id },
    include: { account: { select: { userId: true } } },
  })

  if (!note || note.account.userId !== userId) {
    throw createError({ statusCode: 404, message: '笔记不存在' })
  }

  const stats = await prisma.noteStats.upsert({
    where: { noteId: id },
    create: {
      noteId: id,
      views: body.views ?? 0,
      likes: body.likes ?? 0,
      collects: body.collects ?? 0,
      comments: body.comments ?? 0,
    },
    update: {
      views: body.views ?? undefined,
      likes: body.likes ?? undefined,
      collects: body.collects ?? undefined,
      comments: body.comments ?? undefined,
    },
  })

  return stats
})
