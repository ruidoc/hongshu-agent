import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const account = await prisma.account.findFirst({ where: { id, userId } })
  if (!account) {
    throw createError({ statusCode: 404, message: '账号不存在' })
  }

  const updated = await prisma.account.update({
    where: { id },
    data: {
      name: body.name ?? account.name,
      prompt: body.prompt ?? account.prompt,
    },
  })

  return updated
})
