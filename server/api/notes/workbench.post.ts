import { streamText } from 'ai'
import { getModel } from '~/server/utils/ai'
import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { userId } = getUserFromEvent(event)
  const body = await readBody(event)
  const { action, accountId, topic, direction, instruction, currentNote } = body

  if (!accountId || !action) {
    throw createError({ statusCode: 400, message: '缺少必要参数' })
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
  if (!account) {
    throw createError({ statusCode: 404, message: '账号不存在' })
  }

  // 获取近期笔记数据用于参考
  const recentNotes = await prisma.note.findMany({
    where: { accountId, status: 'published' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      title: true,
      stats: { select: { views: true, likes: true, collects: true, comments: true } },
    },
  })

  let dataContext = ''
  if (recentNotes.length) {
    const notesSummary = recentNotes.map((n) => {
      const s = n.stats
      return `- ${n.title}${s ? `（阅读${s.views} 点赞${s.likes} 收藏${s.collects} 评论${s.comments}）` : ''}`
    }).join('\n')
    dataContext = `\n近期已发布笔记及数据：\n${notesSummary}\n请参考数据表现，数据好的类型多产出类似内容，数据差的避免重复。`
  }

  const systemPrompt = `你是一位小红书爆款内容创作者。

以下是账号的人设和风格定义：
${account.prompt}

输出要求：返回纯 JSON 对象，不要包含 markdown 代码块标记。
格式：{"title":"笔记标题","content":"笔记正文","tags":"标签1,标签2,标签3","topics":"#话题1 #话题2"}

标题要求：15-20个字，吸引眼球，善用数字、疑问、感叹等技巧
正文要求：300-800字，分段清晰，善用emoji，开头要有hook，结尾引导互动`

  let prompt: string

  if (action === 'generate') {
    if (!topic || !direction) {
      throw createError({ statusCode: 400, message: '生成模式需要提供选题和方向' })
    }
    prompt = `请为账号「${account.name}」生成一篇小红书笔记：

今日选题：${topic}
选题方向：${direction}
${dataContext}`
  } else if (action === 'adjust') {
    if (!currentNote || !instruction) {
      throw createError({ statusCode: 400, message: '调整模式需要提供当前笔记和调整指令' })
    }
    prompt = `以下是当前笔记内容：
${JSON.stringify(currentNote)}

请根据以下要求调整这篇笔记：
${instruction}

请返回调整后的完整笔记，保持 JSON 格式不变。`
  } else {
    throw createError({ statusCode: 400, message: '不支持的操作类型' })
  }

  const model = getModel()
  const result = streamText({ model, system: systemPrompt, prompt })

  return result.toTextStreamResponse()
})
