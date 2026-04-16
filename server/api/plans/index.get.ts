import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const query = getQuery(event)
  const accountId = Number(query.accountId)

  if (!accountId) {
    throw createError({ statusCode: 400, message: '缺少 accountId' })
  }

  // 验证账号归属
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
  if (!account) {
    throw createError({ statusCode: 404, message: '账号不存在' })
  }

  const plans = await prisma.contentPlan.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
  })

  return plans
})
