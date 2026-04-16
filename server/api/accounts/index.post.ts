import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const body = await readBody(event)

  const { name } = body
  if (!name) {
    throw createError({ statusCode: 400, message: '请填写账号名称' })
  }

  const account = await prisma.account.create({
    data: { userId, name, prompt: '' },
  })

  return account
})
