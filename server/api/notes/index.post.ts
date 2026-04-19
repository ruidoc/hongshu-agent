import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const body = await readBody(event)
  const { accountId, planId, title, content, tags, topics, status } = body

  if (!accountId || !title || !content) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
  if (!account) {
    throw createError({ statusCode: 404, message: '账号不存在' })
  }

  const note = await prisma.note.create({
    data: {
      accountId,
      planId: planId || null,
      title,
      content,
      tags: tags || '',
      topics: topics || '',
      status: status || 'draft',
    },
  })

  return note
})
