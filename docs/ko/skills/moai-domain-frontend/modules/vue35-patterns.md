# Vue 3.5 패턴

Composition API, 반응성 시스템, TypeScript 통합, Pinia 상태 관리를 포함한 Vue 3.5 개발 종합 패턴 가이드.

---

## Composition API 기본

### TypeScript와 Script Setup

```vue
<!-- components/UserCard.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// 타입 정의
interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: 'admin' | 'user' | 'guest'
}

interface Props {
  userId: string
  showActions?: boolean
}

interface Emits {
  (e: 'update', user: User): void
  (e: 'delete', userId: string): void
  (e: 'select', user: User): void
}

// 기본값이 있는 Props
const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

// 타입 안전한 emits
const emit = defineEmits<Emits>()

// 부모에 메서드 노출
defineExpose({
  refresh: () => fetchUser()
})

// 반응형 상태
const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// 계산된 속성
const displayName = computed(() => {
  if (!user.value) return 'Unknown'
  return user.value.name || user.value.email
})

const isAdmin = computed(() => user.value?.role === 'admin')

// 메서드
async function fetchUser() {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(`/api/users/${props.userId}`)
    if (!response.ok) throw new Error('Failed to fetch user')
    user.value = await response.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

function handleSelect() {
  if (user.value) {
    emit('select', user.value)
  }
}

function handleDelete() {
  emit('delete', props.userId)
}

// 워처
watch(
  () => props.userId,
  (newId, oldId) => {
    if (newId !== oldId) {
      fetchUser()
    }
  },
  { immediate: true }
)

// 라이프사이클
onMounted(() => {
  console.log('UserCard mounted')
})

onUnmounted(() => {
  console.log('UserCard unmounted')
})
</script>

<template>
  <div class="user-card" :class="{ 'is-admin': isAdmin }">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading">
      <Spinner />
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchUser">재시도</button>
    </div>

    <!-- 사용자 콘텐츠 -->
    <div v-else-if="user" class="user-content" @click="handleSelect">
      <img :src="user.avatar" :alt="displayName" class="avatar" />

      <div class="info">
        <h3 class="name">{{ displayName }}</h3>
        <p class="email">{{ user.email }}</p>
        <span class="role" :class="`role-${user.role}`">
          {{ user.role }}
        </span>
      </div>

      <div v-if="showActions" class="actions">
        <button @click.stop="$emit('update', user)">수정</button>
        <button @click.stop="handleDelete" class="danger">삭제</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-card {
  @apply border rounded-lg p-4 hover:shadow-md transition-shadow;
}

.user-card.is-admin {
  @apply border-blue-500;
}

.avatar {
  @apply w-16 h-16 rounded-full object-cover;
}

.role-admin {
  @apply bg-blue-100 text-blue-800;
}

.role-user {
  @apply bg-green-100 text-green-800;
}

.danger {
  @apply text-red-600 hover:text-red-800;
}
</style>
```

---

## Composable (재사용 가능한 로직)

### 데이터 페칭 Composable

```typescript
// composables/useFetch.ts
import { ref, shallowRef, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'

interface UseFetchOptions<T> {
  immediate?: boolean
  refetch?: boolean
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  loading: Ref<boolean>
  execute: () => Promise<void>
  refresh: () => Promise<void>
}

export function useFetch<T>(
  url: MaybeRefOrGetter<string>,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const {
    immediate = true,
    refetch = false,
    initialData = null,
    onSuccess,
    onError
  } = options

  const data = shallowRef<T | null>(initialData as T | null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(toValue(url))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      data.value = result
      onSuccess?.(result)
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Fetch failed')
      error.value = fetchError
      onError?.(fetchError)
    } finally {
      loading.value = false
    }
  }

  if (refetch) {
    watchEffect(() => {
      toValue(url) // URL 변경 추적
      execute()
    })
  } else if (immediate) {
    execute()
  }

  return {
    data,
    error,
    loading,
    execute,
    refresh: execute
  }
}

// 사용법
const { data: users, loading, error, refresh } = useFetch<User[]>('/api/users')
```

### 폼 처리 Composable

```typescript
// composables/useForm.ts
import { reactive, ref, computed } from 'vue'
import { z, type ZodSchema } from 'zod'

interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: ZodSchema<T>
  onSubmit: (values: T) => Promise<void>
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
) {
  const { initialValues, validationSchema, onSubmit } = options

  const values = reactive({ ...initialValues }) as T
  const errors = reactive<Partial<Record<keyof T, string>>>({})
  const touched = reactive<Partial<Record<keyof T, boolean>>>({})
  const submitting = ref(false)
  const submitted = ref(false)

  const isValid = computed(() => {
    if (!validationSchema) return true
    const result = validationSchema.safeParse(values)
    return result.success
  })

  const isDirty = computed(() => {
    return Object.keys(initialValues).some(
      key => values[key as keyof T] !== initialValues[key as keyof T]
    )
  })

  function validate(): boolean {
    if (!validationSchema) return true

    const result = validationSchema.safeParse(values)

    // 모든 에러 초기화
    Object.keys(errors).forEach(key => {
      delete errors[key as keyof T]
    })

    if (!result.success) {
      result.error.errors.forEach(err => {
        const path = err.path[0] as keyof T
        if (path) {
          errors[path] = err.message
        }
      })
      return false
    }

    return true
  }

  function validateField(field: keyof T) {
    if (!validationSchema) return

    touched[field] = true
    const result = validationSchema.safeParse(values)

    if (!result.success) {
      const fieldError = result.error.errors.find(
        err => err.path[0] === field
      )
      errors[field] = fieldError?.message
    } else {
      delete errors[field]
    }
  }

  function setFieldValue<K extends keyof T>(field: K, value: T[K]) {
    values[field] = value
    validateField(field)
  }

  function reset() {
    Object.assign(values, initialValues)
    Object.keys(errors).forEach(key => delete errors[key as keyof T])
    Object.keys(touched).forEach(key => delete touched[key as keyof T])
    submitted.value = false
  }

  async function handleSubmit() {
    if (!validate()) return

    submitting.value = true
    try {
      await onSubmit(values)
      submitted.value = true
    } finally {
      submitting.value = false
    }
  }

  return {
    values,
    errors,
    touched,
    submitting,
    submitted,
    isValid,
    isDirty,
    validate,
    validateField,
    setFieldValue,
    reset,
    handleSubmit
  }
}
```

---

## 반응성 심화

### 반응형 참조

```typescript
import {
  ref,
  reactive,
  shallowRef,
  shallowReactive,
  readonly,
  toRef,
  toRefs,
  computed,
  watch,
  watchEffect
} from 'vue'

// ref - 원시값과 단일 값용
const count = ref(0)
const user = ref<User | null>(null)

// reactive - 객체용
const state = reactive({
  users: [] as User[],
  loading: false,
  filters: {
    search: '',
    role: 'all'
  }
})

// shallowRef/shallowReactive - 성능용
// 최상위 레벨의 반응성만 추적
const largeData = shallowRef<LargeObject[]>([])
const config = shallowReactive({
  settings: {} as Settings // settings 변경은 업데이트를 트리거하지 않음
})

// readonly - 변경 방지
const immutableState = readonly(state)

// toRef/toRefs - 반응형 객체를 안전하게 구조 분해
const { search, role } = toRefs(state.filters)
const loadingRef = toRef(state, 'loading')

// getter와 setter가 있는 computed
const fullName = computed({
  get: () => `${state.firstName} ${state.lastName}`,
  set: (value: string) => {
    const [first, last] = value.split(' ')
    state.firstName = first
    state.lastName = last || ''
  }
})
```

### 고급 워처

```typescript
import { watch, watchEffect, watchPostEffect, watchSyncEffect } from 'vue'

// 단일 소스 감시
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`)
})

// 여러 소스 감시
watch(
  [count, () => state.loading],
  ([newCount, newLoading], [oldCount, oldLoading]) => {
    console.log('Count or loading changed')
  }
)

// 옵션이 있는 딥 워치
watch(
  () => state.filters,
  (newFilters) => {
    fetchData(newFilters)
  },
  {
    deep: true,       // 중첩 속성 감시
    immediate: true,  // 즉시 실행
    flush: 'post',    // DOM 업데이트 후 실행
    once: true        // 한 번만 실행
  }
)

// watchEffect - 의존성 자동 추적
watchEffect(async () => {
  const query = state.filters.search
  if (query) {
    const results = await searchUsers(query)
    state.users = results
  }
})

// watchPostEffect - DOM 업데이트 후 실행
watchPostEffect(() => {
  // 여기서 DOM에 안전하게 접근 가능
  document.title = `Users (${state.users.length})`
})

// 정리 함수
watchEffect((onCleanup) => {
  const controller = new AbortController()

  fetch('/api/data', { signal: controller.signal })
    .then(/* ... */)

  onCleanup(() => {
    controller.abort()
  })
})
```

---

## Pinia 상태 관리

### 스토어 정의

```typescript
// stores/userStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

// Composition API 스타일 (권장)
export const useUserStore = defineStore('user', () => {
  // 상태
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 게터
  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const userCount = computed(() => users.value.length)

  const getUserById = computed(() => {
    return (id: string) => users.value.find(u => u.id === id)
  })

  // 액션
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      currentUser.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    currentUser.value = null
  }

  async function fetchUsers() {
    loading.value = true

    try {
      const response = await fetch('/api/users')
      users.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch'
    } finally {
      loading.value = false
    }
  }

  function updateUser(id: string, updates: Partial<User>) {
    const index = users.value.findIndex(u => u.id === id)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...updates }
    }
  }

  // 사이드 이펙트를 위한 액션 구독
  function $reset() {
    currentUser.value = null
    users.value = []
    loading.value = false
    error.value = null
  }

  return {
    // 상태
    currentUser,
    users,
    loading,
    error,
    // 게터
    isAuthenticated,
    isAdmin,
    userCount,
    getUserById,
    // 액션
    login,
    logout,
    fetchUsers,
    updateUser,
    $reset
  }
})
```

### 영속화를 포함한 스토어

```typescript
// stores/settingsStore.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // localStorage에서 초기화
  const theme = ref<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )
  const language = ref(localStorage.getItem('language') || 'en')
  const notifications = ref(
    JSON.parse(localStorage.getItem('notifications') || 'true')
  )

  // 변경 시 영속화
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }, { immediate: true })

  watch(language, (newLang) => {
    localStorage.setItem('language', newLang)
  })

  watch(notifications, (enabled) => {
    localStorage.setItem('notifications', JSON.stringify(enabled))
  })

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setLanguage(lang: string) {
    language.value = lang
  }

  return {
    theme,
    language,
    notifications,
    toggleTheme,
    setLanguage
  }
})
```

### 컴포넌트에서 스토어 사용

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'

const userStore = useUserStore()
const settingsStore = useSettingsStore()

// 반응성을 유지하면서 구조 분해
const { currentUser, isAuthenticated, loading } = storeToRefs(userStore)
const { theme } = storeToRefs(settingsStore)

// 액션은 직접 구조 분해 가능
const { login, logout, fetchUsers } = userStore
const { toggleTheme } = settingsStore

async function handleLogin(email: string, password: string) {
  try {
    await login(email, password)
    await fetchUsers()
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>

<template>
  <div :class="{ dark: theme === 'dark' }">
    <header>
      <button @click="toggleTheme">
        {{ theme === 'dark' ? 'Light' : 'Dark' }} Mode
      </button>

      <template v-if="isAuthenticated">
        <span>{{ currentUser?.name }}</span>
        <button @click="logout">로그아웃</button>
      </template>
    </header>
  </div>
</template>
```

---

## Provide/Inject 패턴

```typescript
// context/notification.ts
import { provide, inject, ref, readonly } from 'vue'
import type { InjectionKey, Ref } from 'vue'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface NotificationContext {
  notifications: Readonly<Ref<Notification[]>>
  add: (notification: Omit<Notification, 'id'>) => void
  remove: (id: string) => void
  clear: () => void
}

const NotificationKey: InjectionKey<NotificationContext> = Symbol('notifications')

export function provideNotifications() {
  const notifications = ref<Notification[]>([])

  function add(notification: Omit<Notification, 'id'>) {
    const id = `${Date.now()}-${Math.random()}`
    notifications.value.push({ ...notification, id })

    // 5초 후 자동 제거
    setTimeout(() => remove(id), 5000)
  }

  function remove(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clear() {
    notifications.value = []
  }

  const context: NotificationContext = {
    notifications: readonly(notifications),
    add,
    remove,
    clear
  }

  provide(NotificationKey, context)

  return context
}

export function useNotifications(): NotificationContext {
  const context = inject(NotificationKey)

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }

  return context
}
```

---

## 모범 사례

### 컴포넌트 구조화

Single File Component 구조:
- TypeScript와 Script setup을 상단에 배치
- Template을 중간에 배치
- Scoped styles를 하단에 배치

명명 규칙:
- 컴포넌트: PascalCase (UserCard.vue)
- Composable: useCamelCase (useAuth.ts)
- 스토어: useCamelCaseStore (useUserStore.ts)

### 성능 팁

대형 객체에 shallowRef 사용:
- 딥 반응성이 필요하지 않은 경우
- 대용량 객체 배열에 적합

메서드보다 computed 선호:
- 캐시되며 의존성이 변경될 때만 재평가

정적 콘텐츠에 v-once 사용:
- 초기 렌더링 후 변경되지 않는 콘텐츠

라우트와 컴포넌트 지연 로딩:
- 대형 컴포넌트에 defineAsyncComponent 사용
- 라우트 레벨 코드 분할 설정

---

Version: 2.0.0
Last Updated: 2026-01-06
