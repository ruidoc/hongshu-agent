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

  const updated = await prisma.note.update({
    where: { id },
    data: {
      title: body.title ?? note.title,
      content: body.content ?? note.content,
      tags: body.tags ?? note.tags,
      topics: body.topics ?? note.topics,
      status: body.status ?? note.status,
      publishedAt: body.status === 'published' && note.status !== 'published' ? new Date() : note.publishedAt,
    },
  })

  return updated
})
