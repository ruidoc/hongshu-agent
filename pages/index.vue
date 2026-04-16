<template>
  <div>
    <div v-if="accounts?.length" class="space-y-6">
      <div class="grid auto-rows-min gap-4 md:grid-cols-3">
        <div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <div class="text-sm font-medium text-muted-foreground">总笔记数</div>
          <div class="text-3xl font-bold mt-1">{{ totalNotes }}</div>
        </div>
        <div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <div class="text-sm font-medium text-muted-foreground">已发布</div>
          <div class="text-3xl font-bold mt-1">{{ publishedNotes }}</div>
        </div>
        <div class="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <div class="text-sm font-medium text-muted-foreground">草稿</div>
          <div class="text-3xl font-bold mt-1">{{ draftNotes }}</div>
        </div>
      </div>
      <div class="rounded-xl border bg-card p-6 shadow min-h-[300px]">
        <h3 class="text-lg font-semibold mb-4">快速开始</h3>
        <div class="grid gap-3 md:grid-cols-2">
          <NuxtLink v-if="currentAccountId" :to="`/accounts/${currentAccountId}/prompt`"
            class="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
            <FileText class="size-5 text-muted-foreground" />
            <div>
              <div class="font-medium">设定人设</div>
              <div class="text-sm text-muted-foreground">编辑账号的提示词和风格定义</div>
            </div>
          </NuxtLink>
          <NuxtLink v-if="currentAccountId" :to="`/accounts/${currentAccountId}/plans`"
            class="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
            <Calendar class="size-5 text-muted-foreground" />
            <div>
              <div class="font-medium">生成规划</div>
              <div class="text-sm text-muted-foreground">让 AI 为你制定内容日历</div>
            </div>
          </NuxtLink>
          <NuxtLink v-if="currentAccountId" :to="`/accounts/${currentAccountId}/notes`"
            class="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
            <BookOpen class="size-5 text-muted-foreground" />
            <div>
              <div class="font-medium">查看笔记</div>
              <div class="text-sm text-muted-foreground">管理已生成的笔记内容</div>
            </div>
          </NuxtLink>
          <NuxtLink v-if="currentAccountId" :to="`/accounts/${currentAccountId}/stats`"
            class="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
            <BarChart3 class="size-5 text-muted-foreground" />
            <div>
              <div class="font-medium">数据看板</div>
              <div class="text-sm text-muted-foreground">查看笔记互动数据和趋势</div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <p class="text-muted-foreground mb-4">还没有账号，先创建一个开始吧</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText, Calendar, BookOpen, BarChart3 } from 'lucide-vue-next'

const { apiFetch } = useApi()
const currentAccountId = useCookie<number | null>('currentAccountId')

const { data: accounts } = useAsyncData('dashboard-accounts', () =>
  apiFetch<any[]>('/api/accounts')
)

const { data: notes } = useAsyncData('dashboard-notes', async () => {
  if (!currentAccountId.value) return []
  return apiFetch<any[]>(`/api/notes?accountId=${currentAccountId.value}`)
}, { watch: [currentAccountId] })

const totalNotes = computed(() => notes.value?.length || 0)
const publishedNotes = computed(() => notes.value?.filter((n: any) => n.status === 'published').length || 0)
const draftNotes = computed(() => notes.value?.filter((n: any) => n.status === 'draft').length || 0)
</script>
