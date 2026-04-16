import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

function getModel() {
  const config = useRuntimeConfig()
  const anthropic = createAnthropic({
    apiKey: config.anthropicApiKey,
    baseURL: config.anthropicBaseUrl || undefined,
  })
  return anthropic('claude-sonnet-4-20250514')
}

interface AccountInfo {
  name: string
  prompt: string
}

interface TopicItem {
  date: string
  topic: string
  direction: string
}

export async function generateContentPlan(
  account: AccountInfo,
  startDate: string,
  days: number,
): Promise<TopicItem[]> {
  const model = getModel()

  const { text } = await generateText({
    model,
    system: `你是一位资深小红书运营专家，擅长制定内容策略和选题规划。

以下是账号的人设和风格定义：
${account.prompt}

输出要求：返回纯 JSON 数组，不要包含 markdown 代码块标记。
格式：[{"date":"2024-01-01","topic":"选题标题","direction":"具体方向和角度描述"}]`,
    prompt: `请为账号「${account.name}」制定 ${days} 天的内容规划。

起始日期：${startDate}
天数：${days} 天

要求：
1. 选题要多样化，覆盖领域内不同话题
2. 考虑选题的热度和互动性
3. 新号起步阶段，注重引流和涨粉内容
4. 选题之间有一定的关联性和递进感
5. 每个选题要有明确的角度和方向`,
  })

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('AI 返回格式异常，请重试')
  }
}

interface NoteGenerationContext {
  account: AccountInfo
  topic: string
  direction: string
  recentNotes?: { title: string; stats?: { likes: number; collects: number; comments: number; views: number } }[]
}

interface GeneratedNote {
  title: string
  content: string
  tags: string
  topics: string
}

export async function generateNote(ctx: NoteGenerationContext): Promise<GeneratedNote> {
  const model = getModel()

  let dataContext = ''
  if (ctx.recentNotes?.length) {
    const notesSummary = ctx.recentNotes.map((n) => {
      const s = n.stats
      return `- ${n.title}${s ? `（阅读${s.views} 点赞${s.likes} 收藏${s.collects} 评论${s.comments}）` : ''}`
    }).join('\n')
    dataContext = `\n近期已发布笔记及数据：\n${notesSummary}\n请参考数据表现，数据好的类型多产出类似内容，数据差的避免重复。`
  }

  const { text } = await generateText({
    model,
    system: `你是一位小红书爆款内容创作者。

以下是账号的人设和风格定义：
${ctx.account.prompt}

输出要求：返回纯 JSON 对象，不要包含 markdown 代码块标记。
格式：{"title":"笔记标题","content":"笔记正文","tags":"标签1,标签2,标签3","topics":"#话题1 #话题2"}

标题要求：15-20个字，吸引眼球，善用数字、疑问、感叹等技巧
正文要求：300-800字，分段清晰，善用emoji，开头要有hook，结尾引导互动`,
    prompt: `请为账号「${ctx.account.name}」生成一篇小红书笔记：

今日选题：${ctx.topic}
选题方向：${ctx.direction}
${dataContext}`,
  })

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('AI 返回格式异常，请重试')
  }
}
