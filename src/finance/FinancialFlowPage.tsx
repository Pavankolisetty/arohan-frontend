import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import AutoGraphRounded from '@mui/icons-material/AutoGraphRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import EventNoteRounded from '@mui/icons-material/EventNoteRounded'
import SettingsSuggestRounded from '@mui/icons-material/SettingsSuggestRounded'
import SavingsRounded from '@mui/icons-material/SavingsRounded'
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded'
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded'
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../auth/AuthContext'
import { ApiError, api } from '../shared/api'
import type {
  FinanceBucket,
  FinanceMonthPlan,
  FinanceTransaction,
  FinanceTransactionInput,
  FinanceTransactionType,
} from '../shared/types'
import {
  BucketSettingsDialog,
  CashDialog,
  PlanDialog,
  TransactionDialog,
} from './FinanceDialogs'

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const typeMeta: Record<
  FinanceTransactionType,
  { label: string; color: string; sign: string }
> = {
  INCOME: { label: 'Money in', color: '#3D7A63', sign: '+' },
  EXPENSE: { label: 'Spent', color: '#B85D4A', sign: '−' },
  SAVINGS: { label: 'Set aside', color: '#547CA0', sign: '−' },
  REFUND: { label: 'Refund', color: '#7B6AA8', sign: '+' },
  TRANSFER: { label: 'Transfer', color: '#7A8790', sign: '↔' },
}

export function FinancialFlowPage() {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const [month, setMonth] = useState(() => new Date())
  const monthId = monthKey(month)
  const [transactionOpen, setTransactionOpen] = useState(false)
  const [editing, setEditing] = useState<FinanceTransaction | null>(null)
  const [planOpen, setPlanOpen] = useState(false)
  const [cashOpen, setCashOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'ALL' | FinanceTransactionType>(
    'ALL',
  )
  const [bucketFilter, setBucketFilter] = useState('')
  const [actionError, setActionError] = useState('')

  const setup = useQuery({
    queryKey: ['finance-setup'],
    queryFn: () => api.financeSetup(token!),
    enabled: Boolean(token),
  })
  const dashboard = useQuery({
    queryKey: ['finance-dashboard', monthId],
    queryFn: () => api.financeDashboard(token!, monthId),
    enabled: Boolean(token),
  })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['finance-setup'] }),
    ])
  }
  const action = useMutation({
    mutationFn: async (work: () => Promise<unknown>) => work(),
    onSuccess: async () => {
      setActionError('')
      setTransactionOpen(false)
      setEditing(null)
      setPlanOpen(false)
      setCashOpen(false)
      await refresh()
    },
    onError: (error) =>
      setActionError(
        error instanceof ApiError ? error.message : 'Please try that again.',
      ),
  })
  const data = dashboard.data
  const monthLabel = month.toLocaleDateString(user?.locale ?? 'en-IN', {
    month: 'long',
    year: 'numeric',
  })
  const currency = useMemo(
    () =>
      new Intl.NumberFormat(user?.locale ?? 'en-IN', {
        style: 'currency',
        currency: data?.currencyCode ?? setup.data?.currencyCode ?? 'INR',
        maximumFractionDigits: 0,
      }),
    [data?.currencyCode, setup.data?.currencyCode, user?.locale],
  )
  const currencySymbol =
    currency
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? '₹'
  const filteredTransactions = (data?.transactions ?? []).filter(
    (entry) =>
      (typeFilter === 'ALL' || entry.type === typeFilter) &&
      (!bucketFilter || entry.bucketId === bucketFilter),
  )
  const activeRhythm = (data?.rhythm ?? []).filter(
    (day) => day.income || day.expenses || day.savings,
  )

  function moveMonth(offset: number) {
    setMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    )
  }
  function saveTransaction(value: FinanceTransactionInput) {
    action.mutate(() =>
      editing
        ? api.updateFinanceTransaction(token!, editing.id, value)
        : api.createFinanceTransaction(token!, value),
    )
  }

  if (setup.isLoading || dashboard.isLoading) {
    return (
      <Box minHeight="80vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress aria-label="Preparing Financial Flow" />
      </Box>
    )
  }
  if (setup.isError || dashboard.isError) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">
          Financial Flow could not open. Confirm the backend is running and
          refresh this page.
        </Alert>
      </Container>
    )
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2, md: 5 },
        px: { xs: 2, md: 5 },
        '@keyframes riseIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '& .finance-rise': {
          animation: 'riseIn .42s ease-out both',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="overline" color="primary" fontWeight={800}>
            Kakeibo, made gently visible
          </Typography>
          <Typography variant="h1" fontSize={{ xs: 40, md: 56 }}>
            Financial Flow
          </Typography>
          <Typography color="text.secondary" mt={1} maxWidth={720}>
            Notice where money arrives, where it supports life, and what you want
            the next month to feel like.
          </Typography>
        </Box>
        <Stack spacing={1.5} alignItems={{ md: 'flex-end' }}>
          <Stack direction="row" alignItems="center">
            <Tooltip title="Previous month">
              <IconButton onClick={() => moveMonth(-1)}>
                <ArrowBackRounded />
              </IconButton>
            </Tooltip>
            <Typography fontWeight={800} minWidth={150} textAlign="center">
              {monthLabel}
            </Typography>
            <Tooltip title="Next month">
              <IconButton onClick={() => moveMonth(1)}>
                <ArrowForwardRounded />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ md: 'flex-end' }}>
            <Button
              component={RouterLink}
              to="/financial-flow/insights"
              variant="outlined"
              startIcon={<AutoGraphRounded />}
            >
              Flow Insights
            </Button>
            <Button
              startIcon={<SettingsSuggestRounded />}
              onClick={() => setSettingsOpen(true)}
            >
              Buckets
            </Button>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => {
                setEditing(null)
                setActionError('')
                setTransactionOpen(true)
              }}
            >
              Record a flow
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <Card
        className="finance-rise"
        sx={{
          color: '#F8FBF9',
          bgcolor: '#284F42',
          mb: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: '50%',
            right: -70,
            top: -120,
            background:
              'radial-gradient(circle, rgba(244,195,93,.28), transparent 68%)',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, position: 'relative', zIndex: 1 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={3}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeRounded fontSize="small" />
                <Typography variant="overline" fontWeight={800}>
                  Month at a glance
                </Typography>
              </Stack>
              <Typography variant="h2" fontSize={{ xs: 28, md: 38 }} mt={0.5}>
                {data?.summary.available !== undefined
                  ? `${currency.format(data.summary.available)} remains available`
                  : 'Your month is ready for its first money moment'}
              </Typography>
              <Typography sx={{ opacity: 0.78 }} mt={0.5}>
                Income − net spending − money set aside
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<EventNoteRounded />}
              onClick={() => {
                setActionError('')
                setPlanOpen(true)
              }}
              sx={{ alignSelf: { md: 'center' } }}
            >
              {data?.plan ? 'Shape monthly intention' : 'Plan this month'}
            </Button>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr 1fr',
                md: 'repeat(4, minmax(130px, 1fr))',
              },
              gap: 1.5,
              mt: 3,
            }}
          >
            <PulseMetric
              icon={<TrendingUpRounded />}
              label="Arrived"
              value={currency.format(data?.summary.income ?? 0)}
            />
            <PulseMetric
              icon={<TrendingDownRounded />}
              label="Spent"
              value={currency.format(data?.summary.netExpenses ?? 0)}
              detail={
                data?.summary.refunds
                  ? `${currency.format(data.summary.refunds)} returned`
                  : undefined
              }
            />
            <PulseMetric
              icon={<SavingsRounded />}
              label="Set aside"
              value={currency.format(data?.summary.savings ?? 0)}
              detail={
                data?.summary.savingsRatePercent != null
                  ? `${data.summary.savingsRatePercent}% of income`
                  : 'Rate appears after income'
              }
            />
            <PulseMetric
              icon={<AccountBalanceWalletRounded />}
              label="Cash wallet"
              value={currency.format(data?.summary.cashBalance ?? 0)}
              action={() => {
                setActionError('')
                setCashOpen(true)
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {!data?.transactions.length && !data?.plan ? (
        <Card
          className="finance-rise"
          sx={{
            mb: 3,
            background: (theme) =>
              `linear-gradient(130deg, ${alpha(
                theme.palette.primary.main,
                0.11,
              )}, ${alpha('#EAB85E', 0.09)})`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
            <Typography variant="h2" fontSize={{ xs: 28, md: 34 }}>
              Begin with one honest number.
            </Typography>
            <Typography color="text.secondary" maxWidth={600} mx="auto" my={1.5}>
              Add income, an expense, or your opening cash. Arohan will grow the
              dashboard only from real entries.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => setTransactionOpen(true)}
            >
              Record the first flow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={3}
            mb={3}
            alignItems="stretch"
          >
            <Card className="finance-rise" sx={{ flex: 1.15 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Typography variant="overline" color="primary" fontWeight={800}>
                  Kakeibo Flow
                </Typography>
                <Typography variant="h2" fontSize={30}>
                  Where the month is being supported
                </Typography>
                <Typography color="text.secondary" mb={2.5}>
                  Select a bucket to reveal the money moments behind it.
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 1.5,
                  }}
                >
                  {data?.bucketFlows.map((bucket) => (
                    <CardActionArea
                      key={bucket.bucketId}
                      onClick={() =>
                        setBucketFilter((current) =>
                          current === bucket.bucketId ? '' : bucket.bucketId,
                        )
                      }
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor:
                          bucketFilter === bucket.bucketId
                            ? bucket.colorHex
                            : 'divider',
                        borderLeft: `5px solid ${bucket.colorHex}`,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between">
                        <Typography fontWeight={800}>{bucket.name}</Typography>
                        <Typography fontWeight={800}>
                          {currency.format(bucket.netSpent)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {bucket.budget
                          ? `${currency.format(bucket.remaining)} ${
                              bucket.remaining < 0 ? 'over guide' : 'remaining'
                            }`
                          : 'Add a monthly guide when useful'}
                      </Typography>
                      {bucket.budget > 0 && (
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(bucket.usedPercent ?? 0, 100)}
                          aria-label={`${bucket.name} used ${
                            bucket.usedPercent ?? 0
                          } percent of its guide`}
                          sx={{
                            mt: 1.3,
                            height: 7,
                            borderRadius: 4,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: bucket.colorHex,
                            },
                          }}
                        />
                      )}
                    </CardActionArea>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card className="finance-rise" sx={{ flex: 0.85 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Typography variant="overline" color="primary" fontWeight={800}>
                  Intention vs reality
                </Typography>
                <Typography variant="h2" fontSize={30}>
                  The promise of this month
                </Typography>
                {data?.plan ? (
                  <Stack spacing={2.2} mt={2.5}>
                    <ComparisonRow
                      label="Income"
                      planned={data.plan.expectedIncome}
                      actual={data.summary.income}
                      format={currency.format}
                    />
                    <ComparisonRow
                      label="Savings"
                      planned={data.plan.savingsTarget}
                      actual={data.summary.savings}
                      format={currency.format}
                    />
                    {data.plan.intention && (
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'action.hover',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="caption" fontWeight={800}>
                          YOUR INTENTION
                        </Typography>
                        <Typography>{data.plan.intention}</Typography>
                      </Box>
                    )}
                    <Button
                      startIcon={<EditRounded />}
                      onClick={() => setPlanOpen(true)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Reflect or adjust
                    </Button>
                  </Stack>
                ) : (
                  <Box mt={3}>
                    <Typography color="text.secondary" mb={2}>
                      A plan is optional. Add one when a little direction would
                      make the month feel lighter.
                    </Typography>
                    <Button variant="outlined" onClick={() => setPlanOpen(true)}>
                      Create an intention
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>

          <Card className="finance-rise" sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Typography variant="overline" color="primary" fontWeight={800}>
                Financial Rhythm
              </Typography>
              <Typography variant="h2" fontSize={30}>
                The movement behind the totals
              </Typography>
              <Typography color="text.secondary">
                Hover or focus a point to see a dated amount.
              </Typography>
              {activeRhythm.length ? (
                <>
                  <Stack
                    direction="row"
                    spacing={{ xs: 1.5, sm: 3 }}
                    useFlexGap
                    flexWrap="wrap"
                    mt={2}
                    aria-label="Financial Rhythm legend"
                  >
                    <ChartLegend color="#236B4E" label="Income" />
                    <ChartLegend color="#C5523A" label="Spending" />
                    <ChartLegend color="#2E6FA8" label="Savings" />
                  </Stack>
                  <Box height={280} mt={1.5}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.rhythm}>
                      <defs>
                        <linearGradient id="incomeFlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#236B4E" stopOpacity={0.52} />
                          <stop offset="95%" stopColor="#236B4E" stopOpacity={0.04} />
                        </linearGradient>
                        <linearGradient id="spendFlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C5523A" stopOpacity={0.46} />
                          <stop offset="95%" stopColor="#C5523A" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 6"
                        vertical={false}
                        stroke="#A6B2AC"
                        strokeOpacity={0.7}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => String(Number(value.slice(-2)))}
                      />
                      <YAxis
                        width={64}
                        tickFormatter={(value) =>
                          Intl.NumberFormat(user?.locale ?? 'en-IN', {
                            notation: 'compact',
                          }).format(value)
                        }
                      />
                      <ChartTooltip
                        formatter={(value, name) => [
                          currency.format(Number(value)),
                          String(name),
                        ]}
                        labelFormatter={(label) =>
                          new Date(`${label}T00:00:00`).toLocaleDateString(
                            user?.locale ?? 'en-IN',
                            { day: 'numeric', month: 'short' },
                          )
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#236B4E"
                        strokeWidth={3}
                        fill="url(#incomeFlow)"
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="Spending"
                        stroke="#C5523A"
                        strokeWidth={3}
                        fill="url(#spendFlow)"
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        name="Savings"
                        stroke="#2E6FA8"
                        strokeWidth={3}
                        fill="#2E6FA8"
                        fillOpacity={0.1}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary" py={6} textAlign="center">
                  Dated movement will appear after the first entry this month.
                </Typography>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card className="finance-rise">
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={2}
            mb={2}
          >
            <Box>
              <Typography variant="overline" color="primary" fontWeight={800}>
                Money moments
              </Typography>
              <Typography variant="h2" fontSize={30}>
                The ledger beneath the story
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Select
                size="small"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as 'ALL' | FinanceTransactionType,
                  )
                }
                aria-label="Filter money moments by type"
              >
                <MenuItem value="ALL">All flows</MenuItem>
                {Object.entries(typeMeta).map(([type, meta]) => (
                  <MenuItem value={type} key={type}>
                    {meta.label}
                  </MenuItem>
                ))}
              </Select>
              {(bucketFilter || typeFilter !== 'ALL') && (
                <Button
                  onClick={() => {
                    setBucketFilter('')
                    setTypeFilter('ALL')
                  }}
                >
                  Clear
                </Button>
              )}
            </Stack>
          </Stack>
          {!filteredTransactions.length ? (
            <Typography color="text.secondary" py={4} textAlign="center">
              {data?.transactions.length
                ? 'No money moments match this view.'
                : 'Your recorded money moments will gather here.'}
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {filteredTransactions.map((entry) => {
                const meta = typeMeta[entry.type]
                return (
                  <Button
                    key={entry.id}
                    color="inherit"
                    onClick={() => {
                      setEditing(entry)
                      setActionError('')
                      setTransactionOpen(true)
                    }}
                    sx={{
                      py: 1.5,
                      px: 1,
                      textAlign: 'left',
                      justifyContent: 'stretch',
                      textTransform: 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: entry.bucketId
                          ? data?.bucketFlows.find(
                              (bucket) => bucket.bucketId === entry.bucketId,
                            )?.colorHex
                          : meta.color,
                        mr: 1.5,
                      }}
                    />
                    <Box flex={1} minWidth={0}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                      >
                        <Typography fontWeight={800} noWrap>
                          {entry.title}
                        </Typography>
                        <Typography fontWeight={800} color={meta.color}>
                          {meta.sign === '↔'
                            ? meta.sign
                            : meta.sign + currency.format(entry.amount)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(
                            `${entry.occurredOn}T00:00:00`,
                          ).toLocaleDateString(user?.locale ?? 'en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Typography>
                        <Chip
                          size="small"
                          label={entry.bucketName ?? meta.label}
                          sx={{ height: 22 }}
                        />
                        {entry.recurringFrequency && (
                          <Chip size="small" label="Recurring" sx={{ height: 22 }} />
                        )}
                      </Stack>
                    </Box>
                  </Button>
                )
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {transactionOpen && <TransactionDialog
        open={transactionOpen}
        setup={setup.data}
        transaction={editing}
        currencySymbol={currencySymbol}
        busy={action.isPending}
        error={actionError}
        onClose={() => {
          setTransactionOpen(false)
          setEditing(null)
        }}
        onSave={saveTransaction}
        onDelete={(id) => {
          if (window.confirm('Delete this money moment? This cannot be undone.')) {
            action.mutate(() => api.deleteFinanceTransaction(token!, id))
          }
        }}
      />}
      {planOpen && <PlanDialog
        open={planOpen}
        monthLabel={monthLabel}
        buckets={setup.data?.buckets ?? []}
        plan={data?.plan}
        currencySymbol={currencySymbol}
        busy={action.isPending}
        error={actionError}
        onClose={() => setPlanOpen(false)}
        onSave={(value: Omit<FinanceMonthPlan, 'monthStart'>) =>
          action.mutate(() => api.saveFinancePlan(token!, monthId, value))
        }
      />}
      {cashOpen && <CashDialog
        open={cashOpen}
        currentBalance={data?.summary.cashBalance ?? 0}
        currencySymbol={currencySymbol}
        busy={action.isPending}
        error={actionError}
        onClose={() => setCashOpen(false)}
        onSave={(value) => action.mutate(() => api.adjustCash(token!, value))}
      />}
      {settingsOpen && <BucketSettingsDialog
        open={settingsOpen}
        setup={setup.data}
        busy={action.isPending}
        error={actionError}
        onClose={() => setSettingsOpen(false)}
        onUpdateBucket={(bucket: FinanceBucket) =>
          action.mutate(() =>
            api.updateFinanceBucket(token!, bucket.id, {
              name: bucket.name,
              colorHex: bucket.colorHex,
              iconKey: bucket.iconKey,
              positionIndex: bucket.positionIndex,
            }),
          )
        }
        onAddCategory={(bucketId, name) =>
          action.mutate(() =>
            api.createFinanceCategory(token!, {
              bucketId,
              name,
              positionIndex:
                setup.data?.categories.filter(
                  (category) => category.bucketId === bucketId,
                ).length ?? 0,
              active: true,
            }),
          )
        }
      />}
    </Container>
  )
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box
        aria-hidden="true"
        sx={{ width: 24, height: 4, borderRadius: 2, bgcolor: color }}
      />
      <Typography variant="caption" fontWeight={800}>
        {label}
      </Typography>
    </Stack>
  )
}

function PulseMetric({
  icon,
  label,
  value,
  detail,
  action,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail?: string
  action?: () => void
}) {
  const content = (
    <Box
      sx={{
        p: 1.8,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,.08)',
        border: '1px solid rgba(255,255,255,.1)',
        minHeight: 108,
      }}
    >
      <Stack direction="row" spacing={0.8} alignItems="center" sx={{ opacity: 0.82 }}>
        {icon}
        <Typography variant="caption" fontWeight={800}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h3" fontSize={{ xs: 21, md: 26 }} mt={1}>
        {value}
      </Typography>
      {detail && (
        <Typography variant="caption" sx={{ opacity: 0.72 }}>
          {detail}
        </Typography>
      )}
    </Box>
  )
  return action ? (
    <CardActionArea
      onClick={action}
      sx={{ borderRadius: 2, color: 'inherit' }}
      aria-label="Reconcile cash wallet"
    >
      {content}
    </CardActionArea>
  ) : (
    content
  )
}

function ComparisonRow({
  label,
  planned,
  actual,
  format,
}: {
  label: string
  planned: number
  actual: number
  format: (value: number) => string
}) {
  const percent = planned ? Math.min((actual / planned) * 100, 100) : 0
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between">
        <Typography fontWeight={800}>{label}</Typography>
        <Typography variant="body2">
          {format(actual)} <Typography component="span" color="text.secondary">of {format(planned)}</Typography>
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={`${label}: ${format(actual)} of ${format(planned)}`}
        sx={{ mt: 1, height: 7, borderRadius: 4 }}
      />
    </Box>
  )
}
