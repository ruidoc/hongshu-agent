import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const query = getQuery(event)
  const accountId = Number(query.accountId)

  if (!accountId) {
    throw createError({ statusCode: 400, message: '缺少 accountId' })
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
  if (!account) {
    throw createError({ statusCode: 404, message: '账号不存在' })
  }

  const notes = await prisma.note.findMany({
    where: { accountId, status: 'published' },
    include: { stats: true },
    orderBy: { publishedAt: 'desc' },
  })

  const totalNotes = notes.length
  const totalViews = notes.reduce((sum, n) => sum + (n.stats?.views || 0), 0)
  const totalLikes = notes.reduce((sum, n) => sum + (n.stats?.likes || 0), 0)
  const totalCollects = notes.reduce((sum, n) => sum + (n.stats?.collects || 0), 0)
  const totalComments = notes.reduce((sum, n) => sum + (n.stats?.comments || 0), 0)

  const noteDetails = notes.map((n) => ({
    id: n.id,
    title: n.title,
    publishedAt: n.publishedAt,
    views: n.stats?.views || 0,
    likes: n.stats?.likes || 0,
    collects: n.stats?.collects || 0,
    comments: n.stats?.comments || 0,
  }))

  return {
    summary: { totalNotes, totalViews, totalLikes, totalCollects, totalComments },
    notes: noteDetails,
  }
})
