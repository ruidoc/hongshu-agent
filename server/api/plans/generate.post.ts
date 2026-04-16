import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'
import { generateContentPlan } from '~/server/utils/ai'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const body = await readBody(event)
  const { accountId, days = 7 } = body

  if (!accountId) {
    throw createError({ statusCode: 400, message: '缺少 accountId' })
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
  if (!account) {
    throw createError({ statusCode: 404, message: '账号不存在' })
  }

  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + days - 1)

  const topics = await generateContentPlan(
    account,
    startDate.toISOString().split('T')[0],
    days,
  )

  const plan = await prisma.contentPlan.create({
    data: {
      accountId,
      title: `${account.name} - ${days}天内容规划`,
      startDate,
      endDate,
      topics: topics as any,
    },
  })

  return plan
})
