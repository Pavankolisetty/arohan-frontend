import type {
  AuthResponse,
  GrowthHabit,
  GrowthHabitInput,
  HabitStatus,
  LifeArea,
  LifeAreaInput,
  PracticeInput,
  PreferencesInput,
  TodayRhythm,
  TrackingEntry,
  User,
  GrowthStudio,
  FinanceDashboard,
  FinanceInsights,
  FinanceMonthPlan,
  FinanceSetup,
  FinanceTransaction,
  FinanceTransactionInput,
  GrowthSignalResponse,
  ReflectionEntry,
  ReflectionInput,
  ReflectionTag,
} from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081/api/v1'

interface ApiErrorBody {
  message?: string
  fields?: Record<string, string>
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Record<string, string> = {},
  ) {
    super(message)
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  retryTransient = false,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch (error) {
    if (retryTransient) {
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      return request<T>(path, options, token, false)
    }
    throw error
  }

  if (!response.ok) {
    if (retryTransient && [502, 503, 504].includes(response.status)) {
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      return request<T>(path, options, token, false)
    }
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new ApiError(
      body.message ?? 'Something interrupted your flow. Please try again.',
      response.status,
      body.fields,
    )
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  register: (input: {
    displayName: string
    email: string
    password: string
  }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      null,
      true,
    ),
  me: (token: string) => request<User>('/users/me', {}, token),
  updatePreferences: (token: string, input: PreferencesInput) =>
    request<User>(
      '/users/me',
      { method: 'PATCH', body: JSON.stringify(input) },
      token,
      true,
    ),
  lifeAreas: (token: string, includeArchived = false) =>
    request<LifeArea[]>(
      `/life-areas?includeArchived=${includeArchived}`,
      {},
      token,
    ),
  lifeArea: (token: string, id: string) =>
    request<LifeArea>(`/life-areas/${id}`, {}, token),
  suggestAreaTheme: (token: string, name: string) =>
    request<{ colorHex: string; iconKey: string; backgroundKey: string }>(
      `/life-areas/theme-suggestion?name=${encodeURIComponent(name)}`,
      {},
      token,
    ),
  createLifeArea: (token: string, input: LifeAreaInput) =>
    request<LifeArea>(
      '/life-areas',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  updateLifeArea: (token: string, id: string, input: LifeAreaInput) =>
    request<LifeArea>(
      `/life-areas/${id}`,
      { method: 'PUT', body: JSON.stringify(input) },
      token,
    ),
  lifeAreaAction: (
    token: string,
    id: string,
    action: 'archive' | 'restore',
  ) =>
    request<void>(
      `/life-areas/${id}/${action}`,
      { method: 'PATCH' },
      token,
    ),
  createStarterAreas: (token: string) =>
    request<LifeArea[]>('/life-areas/from-starters', { method: 'POST' }, token),
  growthHabits: (
    token: string,
    options: { status?: HabitStatus; lifeAreaId?: string } = {},
  ) => {
    const params = new URLSearchParams()
    if (options.status) params.set('status', options.status)
    if (options.lifeAreaId) params.set('lifeAreaId', options.lifeAreaId)
    const suffix = params.size ? `?${params}` : ''
    return request<GrowthHabit[]>(`/growth-habits${suffix}`, {}, token)
  },
  createGrowthHabit: (token: string, input: GrowthHabitInput) =>
    request<GrowthHabit>(
      '/growth-habits',
      { method: 'POST', body: JSON.stringify(input) },
      token,
      true,
    ),
  updateGrowthHabit: (token: string, id: string, input: GrowthHabitInput) =>
    request<GrowthHabit>(
      `/growth-habits/${id}`,
      { method: 'PUT', body: JSON.stringify(input) },
      token,
    ),
  growthHabitAction: (
    token: string,
    id: string,
    action: 'pause' | 'restart' | 'archive',
  ) =>
    request<GrowthHabit>(
      `/growth-habits/${id}/${action}`,
      { method: 'PATCH' },
      token,
    ),
  deleteGrowthHabit: (token: string, id: string) =>
    request<void>(`/growth-habits/${id}`, { method: 'DELETE' }, token),
  todayRhythm: (token: string, date?: string) =>
    request<TodayRhythm>(
      `/tracking/today${date ? `?date=${encodeURIComponent(date)}` : ''}`,
      {},
      token,
    ),
  startCue: (token: string, habitId: string, date: string) =>
    request<TrackingEntry>(
      `/tracking/habits/${habitId}/cue-start?date=${encodeURIComponent(date)}`,
      { method: 'POST' },
      token,
    ),
  recordPractice: (
    token: string,
    habitId: string,
    date: string,
    input: PracticeInput,
  ) =>
    request<TrackingEntry>(
      `/tracking/habits/${habitId}/practice?date=${encodeURIComponent(date)}`,
      { method: 'PUT', body: JSON.stringify(input) },
      token,
    ),
  clearPractice: (token: string, habitId: string, date: string) =>
    request<void>(
      `/tracking/habits/${habitId}/practice?date=${encodeURIComponent(date)}`,
      { method: 'DELETE' },
      token,
    ),
  growthStudio: (
    token: string,
    options: { from?: string; to?: string; lifeAreaId?: string } = {},
  ) => {
    const params = new URLSearchParams()
    if (options.from) params.set('from', options.from)
    if (options.to) params.set('to', options.to)
    if (options.lifeAreaId) params.set('lifeAreaId', options.lifeAreaId)
    return request<GrowthStudio>(
      `/growth-studio${params.size ? `?${params}` : ''}`,
      {},
      token,
    )
  },
  financeSetup: (token: string) =>
    request<FinanceSetup>('/financial-flow/setup', {}, token),
  financeDashboard: (token: string, month: string) =>
    request<FinanceDashboard>(
      `/financial-flow/dashboard?month=${encodeURIComponent(month)}`,
      {},
      token,
    ),
  financeInsights: (
    token: string,
    period: 'MONTH' | 'YEAR',
    anchor: string,
  ) =>
    request<FinanceInsights>(
      `/financial-flow/insights?period=${encodeURIComponent(period)}&anchor=${encodeURIComponent(anchor)}`,
      {},
      token,
    ),
  createFinanceTransaction: (
    token: string,
    input: FinanceTransactionInput,
  ) =>
    request<FinanceTransaction>(
      '/financial-flow/transactions',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  updateFinanceTransaction: (
    token: string,
    id: string,
    input: FinanceTransactionInput,
  ) =>
    request<FinanceTransaction>(
      `/financial-flow/transactions/${id}`,
      { method: 'PUT', body: JSON.stringify(input) },
      token,
    ),
  deleteFinanceTransaction: (token: string, id: string) =>
    request<void>(
      `/financial-flow/transactions/${id}`,
      { method: 'DELETE' },
      token,
    ),
  saveFinancePlan: (
    token: string,
    month: string,
    input: Omit<FinanceMonthPlan, 'monthStart'>,
  ) =>
    request<FinanceMonthPlan>(
      `/financial-flow/months/${month}/plan`,
      {
        method: 'PUT',
        body: JSON.stringify({
          ...input,
          bucketBudgets: Object.entries(input.bucketBudgets).map(
            ([bucketId, amount]) => ({ bucketId, amount }),
          ),
        }),
      },
      token,
    ),
  adjustCash: (
    token: string,
    input: {
      amount: number
      adjustedOn: string
      reason: string
      adjustmentKind: 'OPENING' | 'CORRECTION'
    },
  ) =>
    request(
      '/financial-flow/cash-adjustments',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  updateFinanceBucket: (
    token: string,
    id: string,
    input: {
      name: string
      colorHex: string
      iconKey: string
      positionIndex: number
    },
  ) =>
    request(
      `/financial-flow/buckets/${id}`,
      { method: 'PUT', body: JSON.stringify(input) },
      token,
    ),
  createFinanceCategory: (
    token: string,
    input: {
      bucketId: string
      name: string
      positionIndex: number
      active: boolean
    },
  ) =>
    request(
      '/financial-flow/categories',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  reflections: (
    token: string,
    options: {
      from?: string
      to?: string
      query?: string
      type?: string
      lifeAreaId?: string
      habitId?: string
      tagId?: string
      pinned?: boolean
    } = {},
  ) => {
    const params = new URLSearchParams()
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value))
    })
    return request<ReflectionEntry[]>(
      `/reflections${params.size ? `?${params}` : ''}`,
      {},
      token,
    )
  },
  reflectionTags: (token: string) =>
    request<ReflectionTag[]>('/reflections/tags', {}, token),
  createReflectionTag: (
    token: string,
    input: { name: string; colorHex: string },
  ) =>
    request<ReflectionTag>(
      '/reflections/tags',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  createReflection: (token: string, input: ReflectionInput) =>
    request<ReflectionEntry>(
      '/reflections',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  updateReflection: (token: string, id: string, input: ReflectionInput) =>
    request<ReflectionEntry>(
      `/reflections/${id}`,
      { method: 'PUT', body: JSON.stringify(input) },
      token,
    ),
  deleteReflection: (token: string, id: string) =>
    request<void>(`/reflections/${id}`, { method: 'DELETE' }, token),
  explainableGrowthSignals: (
    token: string,
    options: { from?: string; to?: string } = {},
  ) => {
    const params = new URLSearchParams()
    if (options.from) params.set('from', options.from)
    if (options.to) params.set('to', options.to)
    return request<GrowthSignalResponse>(
      `/growth-signals${params.size ? `?${params}` : ''}`,
      {},
      token,
    )
  },
}
