import { useState } from '#app'

interface User {
  id: number
  email: string
}

export function useAuth() {
  const user = useState<User | null>('auth_user', () => null)
  const token = useState<string | null>('auth_token', () => null)

  // 初始化时从 localStorage 恢复
  if (import.meta.client && !token.value) {
    const saved = localStorage.getItem('token')
    if (saved) {
      token.value = saved
    }
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    token.value = res.token
    user.value = res.user
    if (import.meta.client) {
      localStorage.setItem('token', res.token)
    }
    return res
  }

  async function register(email: string, password: string) {
    const res = await $fetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: { email, password },
    })
    token.value = res.token
    user.value = res.user
    if (import.meta.client) {
      localStorage.setItem('token', res.token)
    }
    return res
  }

  async function fetchUser() {
    if (!token.value) return null
    try {
      const res = await $fetch<User>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = res
      return res
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    token.value = null
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('token')
    }
    navigateTo('/login')
  }

  return { user, token, login, register, fetchUser, logout }
}
