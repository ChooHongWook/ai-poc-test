# 상태 관리

Zustand, Redux Toolkit, Pinia, React Context 패턴을 다루는 최신 상태 관리 종합 패턴 가이드.

---

## Zustand

### 기본 스토어 설정

```typescript
// stores/counterStore.ts
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
  incrementBy: (amount: number) => void
}

export const useCounterStore = create<CounterState>((set, get) => ({
  count: 0,

  increment: () => set((state) => ({ count: state.count + 1 })),

  decrement: () => set((state) => ({ count: state.count - 1 })),

  reset: () => set({ count: 0 }),

  incrementBy: (amount) => set((state) => ({ count: state.count + amount })),
}))

// 컴포넌트에서 사용
function Counter() {
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)

  return (
    <button onClick={increment}>Count: {count}</button>
  )
}
```

### 미들웨어를 활용한 고급 스토어

```typescript
// stores/userStore.ts
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface User {
  id: string
  name: string
  email: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
  }
}

interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null

  // 액션
  setUser: (user: User | null) => void
  updatePreferences: (prefs: Partial<User['preferences']>) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          user: null,
          isLoading: false,
          error: null,

          setUser: (user) => {
            set({ user })
          },

          updatePreferences: (prefs) => {
            set((state) => {
              if (state.user) {
                state.user.preferences = {
                  ...state.user.preferences,
                  ...prefs
                }
              }
            })
          },

          login: async (email, password) => {
            set({ isLoading: true, error: null })

            try {
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
              })

              if (!response.ok) {
                throw new Error('Login failed')
              }

              const user = await response.json()
              set({ user, isLoading: false })
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : 'Unknown error',
                isLoading: false
              })
            }
          },

          logout: () => {
            set({ user: null })
          },
        }))
      ),
      {
        name: 'user-storage',
        partialize: (state) => ({
          user: state.user
        }),
      }
    ),
    { name: 'UserStore' }
  )
)

// 최적화된 리렌더링을 위한 셀렉터
export const selectUser = (state: UserState) => state.user
export const selectIsLoggedIn = (state: UserState) => !!state.user
export const selectTheme = (state: UserState) => state.user?.preferences.theme ?? 'light'

// React 외부에서 변경 구독
useUserStore.subscribe(
  (state) => state.user,
  (user) => {
    console.log('User changed:', user)
  }
)
```

### 대규모 스토어를 위한 슬라이스 패턴

```typescript
// stores/slices/cartSlice.ts
import { StateCreator } from 'zustand'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface CartSlice {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const createCartSlice: StateCreator<CartSlice> = (set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === item.id)
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity: 1 }] }
    })
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }))
  },

  updateQuantity: (id, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    }))
  },

  clearCart: () => set({ items: [] }),

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  totalPrice: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
})

// stores/slices/uiSlice.ts
export interface UISlice {
  sidebarOpen: boolean
  modalOpen: boolean
  toggleSidebar: () => void
  toggleModal: () => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  sidebarOpen: true,
  modalOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleModal: () => set((state) => ({ modalOpen: !state.modalOpen })),
})

// stores/index.ts - 슬라이스 결합
import { create } from 'zustand'
import { createCartSlice, type CartSlice } from './slices/cartSlice'
import { createUISlice, type UISlice } from './slices/uiSlice'

type StoreState = CartSlice & UISlice

export const useStore = create<StoreState>()((...args) => ({
  ...createCartSlice(...args),
  ...createUISlice(...args),
}))
```

---

## Redux Toolkit

### 스토어 설정

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import userReducer from './slices/userSlice'
import cartReducer from './slices/cartSlice'
import { api } from './api'

export const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### 비동기 Thunk가 포함된 슬라이스

```typescript
// store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  email: string
}

interface UserState {
  currentUser: User | null
  users: User[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: UserState = {
  currentUser: null,
  users: [],
  status: 'idle',
  error: null,
}

// 비동기 thunk
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return await response.json()
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
)

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: Omit<User, 'id'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      if (!response.ok) {
        throw new Error('Failed to create user')
      }
      return await response.json()
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
)

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
    updateUser: (state, action: PayloadAction<Partial<User> & { id: string }>) => {
      const index = state.users.findIndex((u) => u.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload }
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // 사용자 조회
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      // 사용자 생성
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload)
      })
  },
})

export const { setCurrentUser, updateUser, clearError } = userSlice.actions
export default userSlice.reducer

// 셀렉터
export const selectAllUsers = (state: RootState) => state.user.users
export const selectUserById = (state: RootState, userId: string) =>
  state.user.users.find((u) => u.id === userId)
export const selectUserStatus = (state: RootState) => state.user.status
```

### API 호출을 위한 RTK Query

```typescript
// store/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface User {
  id: string
  name: string
  email: string
}

interface Post {
  id: string
  title: string
  content: string
  authorId: string
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    // 사용자
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<User, Omit<User, 'id'>>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUser: builder.mutation<User, Partial<User> & Pick<User, 'id'>>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // 낙관적 업데이트를 포함한 게시글
    addPost: builder.mutation<Post, Omit<Post, 'id'>>({
      query: (body) => ({
        url: '/posts',
        method: 'POST',
        body,
      }),
      async onQueryStarted(newPost, { dispatch, queryFulfilled }) {
        // 낙관적 업데이트
        const patchResult = dispatch(
          api.util.updateQueryData('getPosts', undefined, (draft) => {
            draft.push({ ...newPost, id: 'temp-id' })
          })
        )

        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useAddPostMutation,
} = api
```

---

## React Context 패턴

### 타입 안전한 Context와 Reducer

```typescript
// context/AuthContext.tsx
import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'

// 타입 정의
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

// 리듀서
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, isLoading: false, user: action.payload }
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload }
    case 'LOGOUT':
      return { ...state, user: null }
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }
    default:
      return state
  }
}

// Context
const AuthContext = createContext<AuthContextValue | null>(null)

// Provider
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: false,
    error: null,
  })

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const user = await response.json()
      dispatch({ type: 'LOGIN_SUCCESS', payload: user })
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' })
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates })
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 훅
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

---

## 비교 및 선택 가이드

### 각 솔루션을 사용할 시기

Zustand:
- 소규모~중규모 애플리케이션
- 간단한 전역 상태 관리
- 최소 보일러플레이트 선호
- TypeScript 우선 접근

Redux Toolkit:
- 복잡한 상태를 가진 대규모 애플리케이션
- Redux에 익숙한 팀
- 미들웨어 생태계 필요
- 복잡한 비동기 워크플로우

React Context:
- 테마/로케일 설정
- 인증 상태
- 컴포넌트 레벨 공유 상태
- 외부 의존성 회피

Pinia (Vue):
- Vue 3 애플리케이션
- Composition API 통합
- DevTools 지원 필요
- 타입 안전한 스토어 모듈

### 성능 고려사항

Zustand 성능 팁:
- 셀렉터를 사용하여 리렌더링 최소화
- 도메인별로 스토어 분리
- 필요시 shallow 비교 사용

Redux 성능 팁:
- 메모이제이션을 위해 createSelector 사용
- 상태 형태 정규화
- 리듀서를 적절히 분리

Context 성능 팁:
- 업데이트 빈도별로 Context 분리
- Context 값 메모이제이션
- 복잡한 계산에 useMemo 사용

---

Version: 2.0.0
Last Updated: 2026-01-06
