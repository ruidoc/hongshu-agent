export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login' || to.path === '/register') return

  const token = useCookie('token')
  if (!token.value) {
    return navigateTo('/login')
  }
})
