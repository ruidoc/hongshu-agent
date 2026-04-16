import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'
import { generateNote } from '~/server/utils/ai'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const id = Number(getRouterParam(event, 'id'))

  const note = await prisma.note.findFirst({
    where: { id },
    include: { account: true },
  })

  if (!note || note.account.userId !== userId) {
    throw createError({ statusCode: 404, message: '笔记不存在' })
  }

  // 获取近期笔记数据
  const recentNotes = await prisma.note.findMany({
    where: { accountId: note.accountId, status: 'published' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      title: true,
      stats: { select: { views: true, likes: true, collects: true, comments: true } },
    },
  })

  const generated = await generateNote({
    account: note.account,
    topic: note.title,
    direction: note.topics || note.tags,
    recentNotes: recentNotes.map((n) => ({
      title: n.title,
      stats: n.stats || undefined,
    })),
  })

  const updated = await prisma.note.update({
    where: { id },
    data: {
      title: generated.title,
      content: generated.content,
      tags: generated.tags,
      topics: generated.topics,
    },
  })

  return updated
})
