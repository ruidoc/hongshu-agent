<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold">内容规划</h2>
        <p class="text-sm text-muted-foreground mt-1">AI 根据账号人设生成内容日历，点击选题可直接生成笔记</p>
      </div>
      <div class="flex items-center gap-2">
        <select v-model="days"
          class="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option :value="7">7 天</option>
          <option :value="14">14 天</option>
          <option :value="30">30 天</option>
        </select>
        <Button @click="handleGenerate" :disabled="generating">
          {{ generating ? 'AI 生成中...' : '生成规划' }}
        </Button>
      </div>
    </div>

    <div v-if="plans?.length" class="space-y-4">
      <div v-for="plan in plans" :key="plan.id" class="rounded-xl border bg-card shadow">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="font-semibold">{{ plan.title }}</h3>
          <span class="text-xs text-muted-foreground">
            {{ formatDate(plan.startDate) }} ~ {{ formatDate(plan.endDate) }}
          </span>
        </div>
        <div class="divide-y">
          <div v-for="(topic, i) in parsedTopics(plan.topics)" :key="i"
            class="flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors">
            <div class="text-xs text-muted-foreground whitespace-nowrap pt-0.5 w-20">{{ topic.date }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">{{ topic.topic }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ topic.direction }}</p>
            </div>
            <Button variant="outline" size="sm" @click="generateNoteFromTopic(plan.id, topic, i)"
              :disabled="generatingNote === `${plan.id}-${i}`">
              {{ generatingNote === `${plan.id}-${i}` ? '生成中...' : '生成笔记' }}
            </Button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Calendar class="size-12 mb-4 text-[#ff2442] opacity-80" />
      <p>还没有内容规划</p>
      <p class="text-sm mt-1">点击上方「生成规划」让 AI 为你制定内容日历</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const { apiFetch } = useApi()
const accountId = Number(route.params.id)

const days = ref(7)
const generating = ref(false)
const generatingNote = ref('')

const { data: plans, refresh } = useAsyncData(`plans-${accountId}`, () =>
  apiFetch<any[]>(`/api/plans?accountId=${accountId}`)
)

function parsedTopics(topics: any) {
  if (Array.isArray(topics)) return topics
  try { return JSON.parse(topics) } catch { return [] }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

async function handleGenerate() {
  generating.value = true
  try {
    await apiFetch('/api/plans/generate', {
      method: 'POST',
      body: { accountId, days: days.value },
    })
    refresh()
  } catch (e: any) {
    alert(e.data?.message || '生成失败，请确认已设定账号人设')
  } finally {
    generating.value = false
  }
}

async function generateNoteFromTopic(planId: number, topic: any, index: number) {
  generatingNote.value = `${planId}-${index}`
  try {
    await apiFetch('/api/notes/generate', {
      method: 'POST',
      body: { accountId, planId, topic: topic.topic, direction: topic.direction },
    })
    alert('笔记已生成，去「笔记管理」查看')
  } catch (e: any) {
    alert(e.data?.message || '生成失败')
  } finally {
    generatingNote.value = ''
  }
}
</script>
