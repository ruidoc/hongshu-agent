<template>
  <div>
    <div class="mb-6">
      <h2 class="text-lg font-semibold">笔记管理</h2>
      <p class="text-sm text-muted-foreground mt-1">查看、编辑、发布 AI 生成的笔记</p>
    </div>

    <div v-if="notes?.length" class="space-y-3">
      <div v-for="note in notes" :key="note.id"
        class="rounded-xl border bg-card shadow p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-accent/50 transition-colors"
        @click="openNote(note)">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <Badge :variant="note.status === 'published' ? 'default' : 'secondary'">
              {{ note.status === 'published' ? '已发布' : '草稿' }}
            </Badge>
            <span class="text-xs text-muted-foreground">{{ formatDate(note.createdAt) }}</span>
          </div>
          <h3 class="font-medium text-sm truncate">{{ note.title }}</h3>
          <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ note.content }}</p>
          <div v-if="note.stats" class="flex gap-3 mt-2 text-xs text-muted-foreground">
            <span>👀 {{ note.stats.views }}</span>
            <span>❤️ {{ note.stats.likes }}</span>
            <span>⭐ {{ note.stats.collects }}</span>
            <span>💬 {{ note.stats.comments }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <BookOpen class="size-12 mb-4 opacity-50" />
      <p>还没有笔记</p>
      <p class="text-sm mt-1">去「内容规划」从选题生成笔记</p>
    </div>

    <!-- 笔记详情弹窗 -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editing ? '编辑笔记' : '笔记详情' }}</DialogTitle>
          <DialogDescription>
            {{ selectedNote?.status === 'published' ? '已发布' : '草稿' }}
            · {{ selectedNote ? formatDate(selectedNote.createdAt) : '' }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedNote">
          <!-- 编辑模式 -->
          <div v-if="editing" class="space-y-4 py-4">
            <div class="space-y-2">
              <Label>标题</Label>
              <Input v-model="editForm.title" />
            </div>
            <div class="space-y-2">
              <Label>正文</Label>
              <Textarea v-model="editForm.content" :rows="12" />
            </div>
            <div class="space-y-2">
              <Label>标签</Label>
              <Input v-model="editForm.tags" placeholder="标签1,标签2" />
            </div>
            <div class="space-y-2">
              <Label>话题</Label>
              <Input v-model="editForm.topics" placeholder="#话题1 #话题2" />
            </div>
            <div class="flex gap-2 justify-end">
              <Button variant="outline" @click="editing = false">取消</Button>
              <Button @click="saveEdit" :disabled="savingEdit">
                {{ savingEdit ? '保存中...' : '保存' }}
              </Button>
            </div>
          </div>

          <!-- 查看模式 -->
          <div v-else class="py-4">
            <h3 class="text-xl font-bold mb-3">{{ selectedNote.title }}</h3>
            <div class="text-sm whitespace-pre-wrap mb-4 leading-relaxed">{{ selectedNote.content }}</div>
            <div v-if="selectedNote.tags" class="mb-2 flex flex-wrap gap-1">
              <Badge v-for="tag in selectedNote.tags.split(',')" :key="tag" variant="outline">
                {{ tag.trim() }}
              </Badge>
            </div>
            <div v-if="selectedNote.topics" class="text-xs text-muted-foreground mb-4">{{ selectedNote.topics }}</div>

            <!-- 数据录入 -->
            <div v-if="selectedNote.status === 'published'" class="border-t pt-4 mt-4">
              <h4 class="text-sm font-medium mb-3">互动数据</h4>
              <div class="grid grid-cols-4 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">阅读</Label>
                  <Input v-model.number="statsForm.views" type="number" min="0" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">点赞</Label>
                  <Input v-model.number="statsForm.likes" type="number" min="0" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">收藏</Label>
                  <Input v-model.number="statsForm.collects" type="number" min="0" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">评论</Label>
                  <Input v-model.number="statsForm.comments" type="number" min="0" />
                </div>
              </div>
              <Button variant="outline" size="sm" class="mt-3" @click="saveStats" :disabled="savingStats">
                {{ savingStats ? '保存中...' : '保存数据' }}
              </Button>
            </div>

            <div class="flex gap-2 justify-end mt-4">
              <Button variant="outline" @click="startEdit">编辑</Button>
              <Button v-if="selectedNote.status === 'draft'" variant="outline"
                @click="publishNote">标记已发布</Button>
              <Button variant="secondary" @click="handleRegenerate" :disabled="regenerating">
                {{ regenerating ? '重新生成中...' : '重新生成' }}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const route = useRoute()
const { apiFetch } = useApi()
const accountId = Number(route.params.id)

const dialogOpen = ref(false)
const selectedNote = ref<any>(null)
const editing = ref(false)
const savingEdit = ref(false)
const regenerating = ref(false)
const savingStats = ref(false)

const editForm = reactive({ title: '', content: '', tags: '', topics: '' })
const statsForm = reactive({ views: 0, likes: 0, collects: 0, comments: 0 })

const { data: notes, refresh } = useAsyncData(`notes-${accountId}`, () =>
  apiFetch<any[]>(`/api/notes?accountId=${accountId}`)
)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openNote(note: any) {
  selectedNote.value = note
  editing.value = false
  dialogOpen.value = true
  if (note.stats) {
    Object.assign(statsForm, note.stats)
  } else {
    Object.assign(statsForm, { views: 0, likes: 0, collects: 0, comments: 0 })
  }
}

function startEdit() {
  Object.assign(editForm, {
    title: selectedNote.value.title,
    content: selectedNote.value.content,
    tags: selectedNote.value.tags,
    topics: selectedNote.value.topics || '',
  })
  editing.value = true
}

async function saveEdit() {
  savingEdit.value = true
  try {
    const updated = await apiFetch<any>(`/api/notes/${selectedNote.value.id}`, {
      method: 'PUT',
      body: editForm,
    })
    selectedNote.value = { ...selectedNote.value, ...updated }
    editing.value = false
    refresh()
  } catch (e: any) {
    alert(e.data?.message || '保存失败')
  } finally {
    savingEdit.value = false
  }
}

async function publishNote() {
  try {
    const updated = await apiFetch<any>(`/api/notes/${selectedNote.value.id}`, {
      method: 'PUT',
      body: { status: 'published' },
    })
    selectedNote.value = { ...selectedNote.value, ...updated }
    refresh()
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleRegenerate() {
  regenerating.value = true
  try {
    const updated = await apiFetch<any>(`/api/notes/${selectedNote.value.id}/regenerate`, { method: 'POST' })
    selectedNote.value = { ...selectedNote.value, ...updated }
    refresh()
  } catch (e: any) {
    alert(e.data?.message || '重新生成失败')
  } finally {
    regenerating.value = false
  }
}

async function saveStats() {
  savingStats.value = true
  try {
    await apiFetch(`/api/notes/${selectedNote.value.id}/stats`, {
      method: 'PUT',
      body: statsForm,
    })
    refresh()
  } catch (e: any) {
    alert(e.data?.message || '保存失败')
  } finally {
    savingStats.value = false
  }
}
</script>
