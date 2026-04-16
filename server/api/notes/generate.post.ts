import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'
import { generateNote } from '~/server/utils/ai'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const body = await readBody(event)
  const { accountId, planId, topic, direction } = body

  if (!accountId || !topic || !direction) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
  if (!account) {
    throw createError({ statusCode: 404, message: '账号不存在' })
  }

  // 获取近期笔记及数据
  const recentNotes = await prisma.note.findMany({
    where: { accountId, status: 'published' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      title: true,
      stats: { select: { views: true, likes: true, collects: true, comments: true } },
    },
  })

  const generated = await generateNote({
    account,
    topic,
    direction,
    recentNotes: recentNotes.map((n) => ({
      title: n.title,
      stats: n.stats || undefined,
    })),
  })

  const note = await prisma.note.create({
    data: {
      accountId,
      planId: planId || null,
      title: generated.title,
      content: generated.content,
      tags: generated.tags,
      topics: generated.topics,
    },
  })

  return note
})
