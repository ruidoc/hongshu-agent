<template>
  <div class="flex gap-6 h-[calc(100vh-10rem)]">
    <!-- 左侧：笔记预览 + 操作 -->
    <div class="flex-1 flex flex-col min-w-0">
      <div class="mb-4">
        <h2 class="text-lg font-semibold">笔记工作台</h2>
        <p class="text-sm text-muted-foreground mt-1">AI 生成笔记，反复调整到满意后保存</p>
      </div>

      <!-- 初始输入：选题和方向 -->
      <div v-if="!currentNote && !streaming" class="space-y-4 mb-4">
        <div class="space-y-2">
          <Label>选题</Label>
          <Input v-model="topic" placeholder="输入笔记选题，如：新手化妆必看" />
        </div>
        <div class="space-y-2">
          <Label>方向</Label>
          <Input v-model="direction" placeholder="具体角度和方向描述" />
        </div>
        <Button @click="handleGenerate" :disabled="!topic || !direction || streaming">
          AI 生成笔记
        </Button>
      </div>

      <!-- 笔记预览区 -->
      <div v-if="currentNote || streaming" class="flex-1 overflow-y-auto rounded-xl border bg-card p-5 mb-4">
        <div v-if="streaming && !currentNote" class="flex items-center gap-2 text-sm text-muted-foreground">
          <span class="animate-pulse">AI 正在生成中...</span>
        </div>
        <template v-if="currentNote">
          <h3 class="text-xl font-bold mb-3">{{ currentNote.title }}</h3>
          <div class="text-sm whitespace-pre-wrap leading-relaxed mb-4">{{ currentNote.content }}</div>
          <div v-if="currentNote.tags" class="mb-2 flex flex-wrap gap-1">
            <Badge v-for="tag in currentNote.tags.split(',')" :key="tag" variant="outline">
              {{ tag.trim() }}
            </Badge>
          </div>
          <div v-if="currentNote.topics" class="text-xs text-muted-foreground">{{ currentNote.topics }}</div>
        </template>
        <div v-if="streaming && currentNote" class="mt-2 text-xs text-muted-foreground animate-pulse">
          生成中...
        </div>
      </div>

      <!-- 调整指令区 -->
      <div v-if="currentNote && !streaming" class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <Button v-for="preset in presets" :key="preset" variant="outline" size="sm"
            @click="handleAdjust(preset)">
            {{ preset }}
          </Button>
        </div>
        <div class="flex gap-2">
          <Input v-model="instruction" placeholder="输入调整指令，如：开头更吸引人一些"
            @keydown.enter="handleAdjust(instruction)" class="flex-1" />
          <Button @click="handleAdjust(instruction)" :disabled="!instruction">
            调整
          </Button>
        </div>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="handleSave('draft')" :disabled="saving">
            {{ saving ? '保存中...' : '存为草稿' }}
          </Button>
          <Button @click="handleSave('published')" :disabled="saving">
            {{ saving ? '保存中...' : '直接发布' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 右侧：版本历史 -->
    <div v-if="versions.length > 1" class="w-48 shrink-0 border-l pl-4 overflow-y-auto">
      <h4 class="text-sm font-medium mb-3">版本历史</h4>
      <div class="space-y-2">
        <div v-for="(ver, i) in versions" :key="i"
          class="text-xs p-2 rounded-lg cursor-pointer transition-colors"
          :class="i === currentVersionIndex ? 'bg-accent font-medium' : 'hover:bg-accent/50'"
          @click="switchVersion(i)">
          <div class="truncate">{{ ver.note.title || '生成中...' }}</div>
          <div class="text-muted-foreground mt-0.5">{{ ver.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { token } = useAuth()
const accountId = Number(route.params.id)

// 从 URL query 读取选题信息（从规划页跳转过来时）
const topic = ref((route.query.topic as string) || '')
const direction = ref((route.query.direction as string) || '')
const planId = ref(route.query.planId ? Number(route.query.planId) : null)

const instruction = ref('')
const streaming = ref(false)
const saving = ref(false)

interface NoteData {
  title: string
  content: string
  tags: string
  topics: string
}

interface Version {
  note: NoteData
  label: string
}

const versions = ref<Version[]>([])
const currentVersionIndex = ref(0)

const currentNote = computed(() => {
  if (versions.value.length === 0) return null
  return versions.value[currentVersionIndex.value]?.note || null
})

const presets = ['更口语化', '加emoji', '缩短篇幅', '换个角度', '加数据支撑', '重新生成']

async function fetchStream(body: Record<string, any>): Promise<NoteData> {
  const response = await fetch('/api/notes/workbench', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: '请求失败' }))
    throw new Error(err.message || '请求失败')
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    fullText += decoder.decode(value, { stream: true })

    // 尝试实时解析 JSON 更新预览
    try {
      const parsed = parsePartialJSON(fullText)
      if (parsed) {
        updateCurrentVersion(parsed)
      }
    } catch {
      // 还没形成有效 JSON，继续接收
    }
  }

  // 最终解析
  const match = fullText.match(/\{[\s\S]*\}/)
  if (match) {
    return JSON.parse(match[0])
  }
  throw new Error('AI 返回格式异常')
}

function parsePartialJSON(text: string): NoteData | null {
  // 尝试从流式文本中提取部分内容
  const match = text.match(/\{[\s\S]*/)
  if (!match) return null

  let json = match[0]
  // 尝试补全不完整的 JSON
  const openBraces = (json.match(/\{/g) || []).length
  const closeBraces = (json.match(/\}/g) || []).length
  if (openBraces > closeBraces) {
    // 补全缺失的引号和花括号
    if (!json.endsWith('"') && !json.endsWith('}') && !json.endsWith(',')) {
      json += '"'
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      json += '}'
    }
  }

  try {
    const parsed = JSON.parse(json)
    return {
      title: parsed.title || '',
      content: parsed.content || '',
      tags: parsed.tags || '',
      topics: parsed.topics || '',
    }
  } catch {
    return null
  }
}

function updateCurrentVersion(note: NoteData) {
  if (versions.value.length > 0) {
    versions.value[currentVersionIndex.value] = {
      ...versions.value[currentVersionIndex.value],
      note,
    }
  }
}

function addVersion(note: NoteData, label: string) {
  versions.value.push({ note, label })
  currentVersionIndex.value = versions.value.length - 1
}

function switchVersion(index: number) {
  currentVersionIndex.value = index
}

async function handleGenerate() {
  streaming.value = true
  addVersion({ title: '', content: '', tags: '', topics: '' }, '初始生成')

  try {
    const note = await fetchStream({
      action: 'generate',
      accountId,
      topic: topic.value,
      direction: direction.value,
    })
    updateCurrentVersion(note)
  } catch (e: any) {
    versions.value.pop()
    currentVersionIndex.value = Math.max(0, versions.value.length - 1)
    alert(e.message || '生成失败')
  } finally {
    streaming.value = false
  }
}

async function handleAdjust(inst: string) {
  if (!inst || !currentNote.value) return
  streaming.value = true
  const label = inst.length > 6 ? inst.slice(0, 6) + '...' : inst
  addVersion({ ...currentNote.value }, label)

  try {
    const note = await fetchStream({
      action: 'adjust',
      accountId,
      instruction: inst,
      currentNote: currentNote.value,
    })
    updateCurrentVersion(note)
    instruction.value = ''
  } catch (e: any) {
    versions.value.pop()
    currentVersionIndex.value = Math.max(0, versions.value.length - 1)
    alert(e.message || '调整失败')
  } finally {
    streaming.value = false
  }
}

async function handleSave(status: 'draft' | 'published') {
  if (!currentNote.value) return
  saving.value = true
  try {
    await apiFetch('/api/notes', {
      method: 'POST',
      body: {
        accountId,
        planId: planId.value,
        status,
        ...currentNote.value,
      },
    })
    router.push(`/accounts/${accountId}/notes`)
  } catch (e: any) {
    alert(e.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
