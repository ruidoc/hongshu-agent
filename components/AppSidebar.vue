<template>
  <Sidebar>
    <SidebarHeader>
      <!-- 账号切换器 -->
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#ff2442]/15 text-[#ff2442] text-sm font-bold">
                  {{ currentAccount ? currentAccount.name.charAt(0) : '?' }}
                </div>
                <div class="flex flex-col gap-0.5 leading-none">
                  <span class="font-semibold">{{ currentAccount?.name || '选择账号' }}</span>
                  <span class="text-xs text-muted-foreground">{{ accounts?.length || 0 }} 个账号</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-[--reka-popper-anchor-width]" align="start">
              <DropdownMenuLabel>切换账号</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem v-for="acc in accounts" :key="acc.id" @click="switchAccount(acc.id)">
                <div class="flex items-center gap-2">
                  <div class="flex size-6 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                    {{ acc.name.charAt(0) }}
                  </div>
                  <span>{{ acc.name }}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="showCreateDialog = true">
                <Plus class="size-4 mr-2 text-[#ff2442]" />
                新建账号
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>功能</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navItems" :key="item.to">
              <SidebarMenuButton as-child :is-active="isActive(item.to)">
                <NuxtLink
                  :to="item.to"
                  :class="[
                    'flex w-full items-center gap-2 transition-[opacity,color]',
                    isActive(item.to) ? 'text-hongshu opacity-100' : 'opacity-60',
                  ]"
                >
                  <component
                    :is="item.icon"
                    :class="[
                      'size-4 transition-colors',
                      isActive(item.to) ? 'text-[#ff2442]' : 'text-white',
                    ]"
                  />
                  <span
                    :class="[
                      'transition-colors',
                      isActive(item.to) ? 'text-white' : 'text-white',
                    ]"
                  >
                    {{ item.label }}
                  </span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg">
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarFallback class="rounded-lg bg-[#ff2442]/15 text-[#ff2442]">{{ user?.email?.charAt(0)?.toUpperCase() }}</AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ user?.email }}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-[--reka-popper-anchor-width]" align="start" side="top">
              <DropdownMenuItem @click="logout">
                <LogOut class="size-4 mr-2 text-[#ff2442]" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>

  <!-- 新建账号对话框 -->
  <Dialog v-model:open="showCreateDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>新建账号</DialogTitle>
        <DialogDescription>创建一个小红书账号，之后可以设定人设提示词</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label>账号名称</Label>
          <Input v-model="newAccountName" placeholder="如：美食日记号" @keydown.enter="handleCreate" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showCreateDialog = false">取消</Button>
        <Button @click="handleCreate" :disabled="creating">
          {{ creating ? '创建中...' : '创建' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  ChevronsUpDown,
  FileText,
  Calendar,
  BookOpen,
  BarChart3,
  LayoutDashboard,
  Plus,
  LogOut,
} from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const route = useRoute()
const { user, logout } = useAuth()
const { apiFetch } = useApi()

const showCreateDialog = ref(false)
const newAccountName = ref('')
const creating = ref(false)

const currentAccountId = useCookie<number | null>('currentAccountId')

const { data: accounts, refresh: refreshAccounts } = useAsyncData('sidebar-accounts', () =>
  apiFetch<any[]>('/api/accounts')
)

const currentAccount = computed(() => {
  if (!accounts.value?.length) return null
  if (currentAccountId.value) {
    return accounts.value.find((a: any) => a.id === currentAccountId.value) || accounts.value[0]
  }
  return accounts.value[0]
})

watch(accounts, (accs) => {
  if (accs?.length && !currentAccountId.value) {
    currentAccountId.value = accs[0].id
  }
}, { immediate: true })

const navItems = computed(() => {
  const id = currentAccountId.value
  if (!id) return []
  return [
    { to: '/', label: '仪表盘', icon: LayoutDashboard },
    { to: `/accounts/${id}/prompt`, label: '账号人设', icon: FileText },
    { to: `/accounts/${id}/plans`, label: '内容规划', icon: Calendar },
    { to: `/accounts/${id}/notes`, label: '笔记管理', icon: BookOpen },
    { to: `/accounts/${id}/stats`, label: '数据看板', icon: BarChart3 },
  ]
})

function isActive(to: string) {
  return route.path === to
}

function switchAccount(id: number) {
  currentAccountId.value = id
  navigateTo('/')
}

async function handleCreate() {
  if (!newAccountName.value.trim()) return
  creating.value = true
  try {
    const acc = await apiFetch<any>('/api/accounts', {
      method: 'POST',
      body: { name: newAccountName.value.trim() },
    })
    await refreshAccounts()
    currentAccountId.value = acc.id
    showCreateDialog.value = false
    newAccountName.value = ''
    navigateTo(`/accounts/${acc.id}/prompt`)
  } catch (e: any) {
    alert(e.data?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

provide('currentAccountId', currentAccountId)
provide('refreshAccounts', refreshAccounts)
</script>
