export type ThemePreference = 'SYSTEM' | 'LIGHT' | 'DARK'
export type WeekStart = 'MONDAY' | 'SUNDAY'
export type DateFormatPreference =
  | 'AUTO'
  | 'DAY_FIRST'
  | 'MONTH_FIRST'
  | 'ISO'
export type TimeFormatPreference =
  | 'SYSTEM'
  | 'TWELVE_HOUR'
  | 'TWENTY_FOUR_HOUR'

export interface User {
  id: string
  email: string
  displayName: string
  timeZone: string
  locale: string
  themePreference: ThemePreference
  weekStart: WeekStart
  dateFormat: DateFormatPreference
  timeFormat: TimeFormatPreference
  reducedMotion: boolean
  enhancedContrast: boolean
  onboardingComplete: boolean
  starterTemplateKeys: string[]
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresInSeconds: number
  user: User
}

export interface PreferencesInput {
  displayName: string
  timeZone: string
  locale: string
  themePreference: ThemePreference
  weekStart: WeekStart
  dateFormat: DateFormatPreference
  timeFormat: TimeFormatPreference
  reducedMotion: boolean
  enhancedContrast: boolean
  onboardingComplete: boolean
  starterTemplateKeys: string[]
}

export type LifeAreaStatus = 'ACTIVE' | 'ARCHIVED'

export interface LifeArea {
  id: string
  parentId: string | null
  name: string
  description: string | null
  colorHex: string
  iconKey: string
  backgroundKey: string
  backgroundImageUrl: string | null
  desiredImportance: number
  status: LifeAreaStatus
  positionIndex: number
  habitCount: number
  subareas: LifeArea[]
  createdAt: string
  updatedAt: string
}

export interface LifeAreaInput {
  parentId: string | null
  name: string
  description: string
  colorHex: string
  iconKey: string
  backgroundKey: string
  backgroundImageUrl: string
  desiredImportance: number
  positionIndex: number
}

export type HabitKind = 'GROWTH_HABIT' | 'MILESTONE'
export type TrackingMethod =
  | 'CHECKBOX'
  | 'DURATION'
  | 'QUANTITY'
  | 'RATING'
  | 'VALUE'
  | 'MILESTONE'
export type HabitStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
export type ScheduleType =
  | 'DAILY'
  | 'SELECTED_WEEKDAYS'
  | 'ALTERNATE_DAYS'
  | 'EVERY_N_DAYS'
  | 'TIMES_PER_WEEK'
  | 'TIMES_PER_MONTH'
  | 'ROTATION'
  | 'ONE_TIME'
  | 'CUSTOM'

export interface HabitSchedule {
  type: ScheduleType
  startDate: string
  weekdays: string[]
  intervalDays: number | null
  targetCount: number | null
  dueDate: string | null
  customDescription: string | null
}

export interface GrowthHabit {
  id: string
  lifeAreaId: string
  lifeAreaName: string
  lifeAreaColor: string
  kind: HabitKind
  name: string
  purpose: string
  trackingMethod: TrackingMethod
  targetValue: number | null
  targetUnit: string | null
  cueNote: string
  twoMinuteStarter: string
  preferredTime: string | null
  preferredPlace: string | null
  precedingActivity: string | null
  situation: string | null
  fallbackPlan: string
  status: HabitStatus
  positionIndex: number
  schedule: HabitSchedule
  pausedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface GrowthHabitInput {
  kind: HabitKind
  lifeAreaId: string
  name: string
  purpose: string
  trackingMethod: TrackingMethod
  targetValue: number | null
  targetUnit: string
  cueNote: string
  twoMinuteStarter: string
  preferredTime: string | null
  preferredPlace: string
  precedingActivity: string
  situation: string
  fallbackPlan: string
  positionIndex: number
  schedule: HabitSchedule
}

export type TrackingStatus = 'COMPLETED' | 'PARTIAL' | 'SKIPPED'

export interface TrackingEntry {
  id: string
  habitId: string
  scheduledDate: string
  status?: TrackingStatus
  actualValue?: number
  qualityRating?: number
  reflection?: string
  frictionNote?: string
  cueStartedAt?: string
  completedAt?: string
}

export interface TodayHabit {
  habitId: string
  lifeAreaId: string
  lifeAreaName: string
  lifeAreaColor: string
  name: string
  purpose: string
  cueNote: string
  twoMinuteStarter: string
  preferredTime?: string
  preferredPlace?: string
  trackingMethod: TrackingMethod
  targetValue?: number
  targetUnit?: string
  scheduleType: ScheduleType
  rhythmLabel: string
  opportunityType: 'DUE' | 'FLEXIBLE' | 'CUSTOM' | 'RECORDED'
  entry?: TrackingEntry
}

export interface TodayRhythm {
  date: string
  timeZone: string
  completedCount: number
  partialCount: number
  remainingCount: number
  habits: TodayHabit[]
}

export interface PracticeInput {
  status: TrackingStatus
  actualValue: number | null
  qualityRating: number | null
  reflection: string
  frictionNote: string
}

export interface CountSummary {
  eligible: number
  completed: number
  partial: number
  skipped: number
  missed: number
  consistencyPercent?: number
}

export interface GrowthSignal {
  key: string
  label: string
  value?: number
  unit: string
  sampleSize: number
  minimumSample: number
  ready: boolean
  direction?: 'IMPROVING' | 'STEADY' | 'DECLINING' | 'GATHERING'
  explanation: string
}

export interface LifeAreaPulse {
  lifeAreaId: string
  name: string
  colorHex: string
  desiredImportance: number
  eligible: number
  completed: number
  consistencyPercent?: number
  desiredFocusShare: number
  actualAttentionShare: number
  alignment: string
}

export interface RhythmRecord {
  habitId: string
  habitName: string
  lifeAreaName: string
  status?: TrackingStatus
  cueStarted: boolean
  actualValue?: number
  targetUnit?: string
  qualityRating?: number
  reflection?: string
}

export interface RhythmDay {
  date: string
  due: number
  completed: number
  partial: number
  skipped: number
  missed: number
  recoveries: number
  records: RhythmRecord[]
}

export interface SkillJourney {
  habitId: string
  habitName: string
  lifeAreaName: string
  stage: string
  eligible: number
  completed: number
  consistencyPercent?: number
  ageDays: number
  nextStageHint: string
}

export interface GrowthStudio {
  from: string
  to: string
  timeZone: string
  generatedAt: string
  counts: CountSummary
  signals: GrowthSignal[]
  lifeAreas: LifeAreaPulse[]
  rhythm: RhythmDay[]
  cueFlow: {
    cueReady: number
    cueStarts: number
    fullPracticesAfterStart: number
    reflections: number
    completedAfterStartPercent?: number
    ready: boolean
  }
  skillJourney: SkillJourney[]
  progressStory: {
    title: string
    evidence: string
    recovery: string
    strongestCue: string
    recurringBarrier: string
    nextExperiment: string
  }
}

export type FinanceTransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'SAVINGS'
  | 'REFUND'
  | 'TRANSFER'
export type PaymentMode =
  | 'CASH'
  | 'BANK'
  | 'CARD'
  | 'UPI'
  | 'DIGITAL_WALLET'
  | 'OTHER'
export type TransferDirection = 'CASH_IN' | 'CASH_OUT'
export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface FinanceBucket {
  id: string
  systemKey: 'NEEDS' | 'WANTS' | 'EXPERIENCES' | 'UNEXPECTED'
  name: string
  colorHex: string
  iconKey: string
  positionIndex: number
  active: boolean
}

export interface FinanceCategory {
  id: string
  bucketId: string
  name: string
  positionIndex: number
  active: boolean
}

export interface FinanceSetup {
  currencyCode: string
  buckets: FinanceBucket[]
  categories: FinanceCategory[]
}

export interface FinanceTransactionInput {
  type: FinanceTransactionType
  bucketId: string | null
  categoryId: string | null
  title: string
  amount: number
  occurredOn: string
  paymentMode: PaymentMode
  transferDirection: TransferDirection | null
  incomeSource: string
  note: string
  recurringFrequency: RecurringFrequency | null
  recurringUntil: string | null
}

export interface FinanceTransaction extends FinanceTransactionInput {
  id: string
  bucketName: string | null
  categoryName: string | null
}

export interface FinanceMonthPlan {
  monthStart: string
  expectedIncome: number
  savingsTarget: number
  intention: string | null
  wentWell: string | null
  learned: string | null
  nextMonthChange: string | null
  bucketBudgets: Record<string, number>
}

export interface FinanceBucketFlow {
  bucketId: string
  systemKey: string
  name: string
  colorHex: string
  iconKey: string
  budget: number
  spent: number
  refunded: number
  netSpent: number
  remaining: number
  usedPercent: number | null
}

export interface FinanceDashboard {
  currencyCode: string
  monthStart: string
  summary: {
    income: number
    expenses: number
    refunds: number
    netExpenses: number
    savings: number
    available: number
    savingsRatePercent: number | null
    cashBalance: number
  }
  plan: FinanceMonthPlan | null
  bucketFlows: FinanceBucketFlow[]
  rhythm: Array<{
    date: string
    income: number
    expenses: number
    savings: number
  }>
  transactions: FinanceTransaction[]
  cashAdjustments: Array<{
    id: string
    amount: number
    adjustedOn: string
    reason: string
    adjustmentKind: 'OPENING' | 'CORRECTION'
  }>
}

export interface FinanceInsights {
  currencyCode: string
  period: 'MONTH' | 'YEAR'
  from: string
  to: string
  summary: FinanceDashboard['summary']
  buckets: Array<{
    bucketId: string
    systemKey: FinanceBucket['systemKey']
    name: string
    colorHex: string
    netSpent: number
    percentOfIncome: number | null
    percentOfSpending: number | null
  }>
  timeline: Array<{
    periodStart: string
    label: string
    income: number
    savings: number
    needs: number
    wants: number
    experiences: number
    unexpected: number
    available: number
  }>
}

export type ReflectionType =
  | 'DAILY_NOTE'
  | 'HABIT_NOTE'
  | 'LIFE_AREA_NOTE'
  | 'WEEKLY_REVIEW'

export interface ReflectionTag {
  id: string
  name: string
  colorHex: string
}

export interface ReflectionInput {
  entryType: ReflectionType
  title: string
  content: string
  entryDate: string
  lifeAreaId: string | null
  habitId: string | null
  moodScore: number | null
  energyScore: number | null
  pinned: boolean
  periodStart: string | null
  periodEnd: string | null
  wins: string
  friction: string
  nextAdjustment: string
  smallCommitment: string
  tagIds: string[]
}

export interface ReflectionEntry extends ReflectionInput {
  id: string
  lifeAreaName: string | null
  habitName: string | null
  tags: ReflectionTag[]
  createdAt: string
  updatedAt: string
}

export interface SignalEvidence {
  date: string
  label: string
  detail: string
}

export interface ExplainableGrowthSignal {
  key: string
  kind: 'RHYTHM' | 'FRICTION' | 'REFLECTION' | 'ASSOCIATION'
  title: string
  summary: string
  evidence: string
  method: string
  sampleSize: number
  minimumSample: number
  ready: boolean
  tone: 'sage' | 'clay' | 'gold' | 'sky'
  evidenceItems: SignalEvidence[]
}

export interface GrowthSignalResponse {
  from: string
  to: string
  boundaryNote: string
  signals: ExplainableGrowthSignal[]
}
