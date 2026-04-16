import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const plan = await prisma.contentPlan.findFirst({
    where: { id },
    include: { account: { select: { userId: true } } },
  })

  if (!plan || plan.account.userId !== userId) {
    throw createError({ statusCode: 404, message: '规划不存在' })
  }

  const updated = await prisma.contentPlan.update({
    where: { id },
    data: {
      title: body.title ?? plan.title,
      topics: body.topics ?? plan.topics,
    },
  })

  return updated
})
