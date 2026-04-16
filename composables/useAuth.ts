interface User {
  id: number
  email: string
}

export function useAuth() {
  const token = useCookie('token', { maxAge: 60 * 60 * 24 * 7 })
  const userCookie = useCookie<User | null>('user', { maxAge: 60 * 60 * 24 * 7 })

  async function login(email: string, password: string) {
    const res = await $fetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    token.value = res.token
    userCookie.value = res.user
    return res
  }

  async function register(email: string, password: string) {
    const res = await $fetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: { email, password },
    })
    token.value = res.token
    userCookie.value = res.user
    return res
  }

  function logout() {
    token.value = null
    userCookie.value = null
    navigateTo('/login')
  }

  return { user: userCookie, token, login, register, logout }
}
