<template>
  <div>
    <div class="mb-6">
      <h2 class="text-lg font-semibold">数据看板</h2>
      <p class="text-sm text-muted-foreground mt-1">查看已发布笔记的互动数据表现</p>
    </div>

    <div v-if="stats">
      <!-- 汇总卡片 -->
      <div class="grid auto-rows-min gap-4 md:grid-cols-5 mb-6">
        <div class="rounded-xl border bg-card p-4 text-center shadow">
          <p class="text-2xl font-bold">{{ stats.summary.totalNotes }}</p>
          <p class="text-xs text-muted-foreground mt-1">已发布</p>
        </div>
        <div class="rounded-xl border bg-card p-4 text-center shadow">
          <p class="text-2xl font-bold text-blue-600">{{ formatNum(stats.summary.totalViews) }}</p>
          <p class="text-xs text-muted-foreground mt-1">总阅读</p>
        </div>
        <div class="rounded-xl border bg-card p-4 text-center shadow">
          <p class="text-2xl font-bold text-red-500">{{ formatNum(stats.summary.totalLikes) }}</p>
          <p class="text-xs text-muted-foreground mt-1">总点赞</p>
        </div>
        <div class="rounded-xl border bg-card p-4 text-center shadow">
          <p class="text-2xl font-bold text-yellow-500">{{ formatNum(stats.summary.totalCollects) }}</p>
          <p class="text-xs text-muted-foreground mt-1">总收藏</p>
        </div>
        <div class="rounded-xl border bg-card p-4 text-center shadow">
          <p class="text-2xl font-bold text-green-500">{{ formatNum(stats.summary.totalComments) }}</p>
          <p class="text-xs text-muted-foreground mt-1">总评论</p>
        </div>
      </div>

      <!-- 明细表格 -->
      <div v-if="stats.notes.length" class="rounded-xl border bg-card shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/50">
              <th class="text-left px-4 py-3 font-medium">笔记</th>
              <th class="text-right px-4 py-3 font-medium">阅读</th>
              <th class="text-right px-4 py-3 font-medium">点赞</th>
              <th class="text-right px-4 py-3 font-medium">收藏</th>
              <th class="text-right px-4 py-3 font-medium">评论</th>
              <th class="text-right px-4 py-3 font-medium">互动率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="note in stats.notes" :key="note.id" class="border-b last:border-0">
              <td class="px-4 py-3">
                <p class="truncate max-w-xs font-medium">{{ note.title }}</p>
                <p class="text-xs text-muted-foreground">{{ note.publishedAt ? formatDate(note.publishedAt) : '-' }}</p>
              </td>
              <td class="text-right px-4 py-3">{{ note.views }}</td>
              <td class="text-right px-4 py-3">{{ note.likes }}</td>
              <td class="text-right px-4 py-3">{{ note.collects }}</td>
              <td class="text-right px-4 py-3">{{ note.comments }}</td>
              <td class="text-right px-4 py-3">
                <Badge :variant="engagementRate(note) > 5 ? 'default' : 'secondary'">
                  {{ engagementRate(note) }}%
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <BarChart3 class="size-12 mb-4 text-[#ff2442] opacity-50" />
        <p>暂无数据</p>
        <p class="text-sm mt-1">发布笔记并录入数据后这里会显示趋势</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const { apiFetch } = useApi()
const accountId = Number(route.params.id)

const { data: stats } = useAsyncData(`stats-${accountId}`, () =>
  apiFetch<any>(`/api/stats/overview?accountId=${accountId}`)
)

function formatNum(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function engagementRate(note: any) {
  if (!note.views) return '0.0'
  return ((note.likes + note.collects + note.comments) / note.views * 100).toFixed(1)
}
</script>
