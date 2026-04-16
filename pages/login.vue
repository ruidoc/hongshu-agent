<template>
  <div>
    <NuxtLayout name="auth">
      <div class="w-full max-w-sm">
        <div class="rounded-xl border bg-card text-card-foreground shadow p-8">
          <div class="text-center mb-6">
            <h1 class="text-2xl font-bold">登录</h1>
            <p class="text-sm text-muted-foreground mt-1">小红书 AI 笔记助手</p>
          </div>
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-2">
              <Label>邮箱</Label>
              <Input v-model="email" type="email" required placeholder="your@email.com" />
            </div>
            <div class="space-y-2">
              <Label>密码</Label>
              <Input v-model="password" type="password" required />
            </div>
            <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            <Button type="submit" class="w-full" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </Button>
          </form>
          <p class="mt-4 text-center text-sm text-muted-foreground">
            没有账号？<NuxtLink to="/register" class="text-primary hover:underline">注册</NuxtLink>
          </p>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: false })

const { login } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
