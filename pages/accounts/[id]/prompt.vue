<template>
  <div class="max-w-4xl">
    <div class="mb-6">
      <h2 class="text-lg font-semibold">账号人设</h2>
      <p class="text-sm text-muted-foreground mt-1">
        通过一段提示词定义你的账号风格、领域、人设和目标人群。AI 生成内容时会参考这段上下文。
      </p>
    </div>

    <div v-if="account" class="space-y-6">
      <div class="space-y-2">
        <Label>账号名称</Label>
        <Input v-model="form.name" />
      </div>

      <div class="space-y-2">
        <Label>人设提示词</Label>
        <p class="text-xs text-muted-foreground">
          描述你的账号定位、人设、目标人群、语言风格等。越详细 AI 生成的内容越贴合你的需求。
        </p>
        <Textarea
          v-model="form.prompt"
          :rows="16"
          placeholder="例如：&#10;我是一个25岁的美食博主，账号名「吃货小王」，主要做美食探店和家常菜教程。&#10;&#10;目标人群：18-35岁的女性，关注美食和生活品质。&#10;&#10;语言风格：活泼可爱，多用emoji，口语化表达，善用感叹号。标题要有吸引力，善用数字和疑问句。&#10;&#10;内容方向：&#10;1. 探店打卡（人均、推荐菜、环境）&#10;2. 家常菜教程（简单易学、食材常见）&#10;3. 美食好物推荐&#10;&#10;注意：不要用太书面的语言，要像朋友之间聊天一样自然。"
          class="font-mono text-sm"
        />
      </div>

      <div class="flex items-center gap-3">
        <Button @click="handleSave" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </Button>
        <span v-if="saved" class="text-sm text-green-600">已保存</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const route = useRoute()
const { apiFetch } = useApi()
const accountId = Number(route.params.id)

const saving = ref(false)
const saved = ref(false)
const form = reactive({ name: '', prompt: '' })

const { data: account } = useAsyncData(`account-${accountId}`, () =>
  apiFetch<any>(`/api/accounts/${accountId}`)
)

watch(account, (acc) => {
  if (acc) {
    form.name = acc.name
    form.prompt = acc.prompt || ''
  }
}, { immediate: true })

async function handleSave() {
  saving.value = true
  saved.value = false
  try {
    await apiFetch(`/api/accounts/${accountId}`, { method: 'PUT', body: form })
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  } catch (e: any) {
    alert(e.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
