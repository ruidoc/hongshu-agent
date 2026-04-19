// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  components: [
    {
      path: '~/components',
      ignore: ['ui/**'],
    },
  ],
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL || '',
  },
  app: {
    head: {
      title: '小红书 AI 笔记助手',
      meta: [
        { name: 'description', content: 'AI 驱动的小红书内容生成工具' },
      ],
    },
  },
})
