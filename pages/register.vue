<template>
  <div>
    <NuxtLayout name="auth">
      <div class="w-full max-w-sm">
        <div class="rounded-xl border bg-card text-card-foreground shadow p-8">
          <div class="text-center mb-6">
            <h1 class="text-2xl font-bold">注册</h1>
            <p class="text-sm text-muted-foreground mt-1">创建你的账号</p>
          </div>
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div class="space-y-2">
              <Label>邮箱</Label>
              <Input v-model="email" type="email" required placeholder="your@email.com" />
            </div>
            <div class="space-y-2">
              <Label>密码</Label>
              <Input v-model="password" type="password" required minlength="6" />
            </div>
            <div class="space-y-2">
              <Label>确认密码</Label>
              <Input v-model="confirmPassword" type="password" required />
            </div>
            <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            <Button type="submit" class="w-full" :disabled="loading">
              {{ loading ? '注册中...' : '注册' }}
            </Button>
          </form>
          <p class="mt-4 text-center text-sm text-muted-foreground">
            已有账号？<NuxtLink to="/login" class="text-primary hover:underline">登录</NuxtLink>
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

const { register } = useAuth()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }
  loading.value = true
  try {
    await register(email.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>
