import { api } from './api'
import type { GrowthHabitInput, PreferencesInput } from './types'

const okJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('production request resilience', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retries an idempotent onboarding update after a transient gateway error', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(okJson({}, 503))
      .mockResolvedValueOnce(okJson({ id: 'user-1' }))
    const input = {
      displayName: 'Pavan',
      timeZone: 'Asia/Kolkata',
      locale: 'en-IN',
      themePreference: 'SYSTEM',
      weekStart: 'MONDAY',
      dateFormat: 'AUTO',
      timeFormat: 'SYSTEM',
      reducedMotion: false,
      enhancedContrast: false,
      onboardingComplete: true,
      starterTemplateKeys: ['FINANCIAL'],
    } satisfies PreferencesInput

    await api.updatePreferences('token', input)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries login once while the free API service is waking', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        okJson({ accessToken: 'token', user: { id: 'user-1' } }),
      )

    await api.login({
      email: 'pavan@example.com',
      password: 'a-strong-passphrase',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reuses one creation key when a habit request is retried', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(okJson({}, 502))
      .mockResolvedValueOnce(okJson({ id: 'habit-1' }, 201))
    const input = {
      clientRequestId: crypto.randomUUID(),
      kind: 'GROWTH_HABIT',
      lifeAreaId: crypto.randomUUID(),
      name: 'Read',
      purpose: 'Learn gently',
      trackingMethod: 'CHECKBOX',
      targetValue: null,
      targetUnit: '',
      cueNote: 'Open the book',
      twoMinuteStarter: 'Read one paragraph',
      preferredTime: null,
      preferredPlace: '',
      precedingActivity: '',
      situation: '',
      fallbackPlan: 'Read before bed',
      positionIndex: 0,
      schedule: {
        type: 'DAILY',
        startDate: '2026-07-26',
        weekdays: [],
        intervalDays: null,
        targetCount: null,
        dueDate: null,
        customDescription: '',
      },
    } satisfies GrowthHabitInput

    await api.createGrowthHabit('token', input)

    const bodies = fetchMock.mock.calls.map(([, options]) => options?.body)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(bodies[0]).toBe(bodies[1])
  })
})
