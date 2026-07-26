import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import AutoGraphRounded from '@mui/icons-material/AutoGraphRounded'
import SavingsRounded from '@mui/icons-material/SavingsRounded'
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../auth/AuthContext'
import { api } from '../shared/api'
import type { FinanceInsights } from '../shared/types'

type InsightPeriod = 'MONTH' | 'YEAR'
type FlowView = 'OUTFLOW' | 'INCOME'

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function moveAnchor(current: Date, period: InsightPeriod, offset: number) {
  return period === 'YEAR'
    ? new Date(current.getFullYear() + offset, 0, 1)
    : new Date(current.getFullYear(), current.getMonth() + offset, 1)
}

const bucketDataKeys: Record<string, keyof FinanceInsights['timeline'][number]> = {
  NEEDS: 'needs',
  WANTS: 'wants',
  EXPERIENCES: 'experiences',
  UNEXPECTED: 'unexpected',
}

export function FinancialInsightsPage() {
  const { token, user } = useAuth()
  const [period, setPeriod] = useState<InsightPeriod>('MONTH')
  const [anchor, setAnchor] = useState(() => new Date())
  const [flowView, setFlowView] = useState<FlowView>('OUTFLOW')
  const query = useQuery({
    queryKey: ['finance-insights', period, localDateValue(anchor)],
    queryFn: () => api.financeInsights(token!, period, localDateValue(anchor)),
    enabled: Boolean(token),
  })
  const data = query.data
  const currency = useMemo(
    () => new Intl.NumberFormat(user?.locale ?? 'en-IN', {
      style: 'currency',
      currency: data?.currencyCode ?? 'INR',
      maximumFractionDigits: 0,
    }),
    [data?.currencyCode, user?.locale],
  )
  const periodLabel = period === 'YEAR'
    ? anchor.toLocaleDateString(user?.locale ?? 'en-IN', { year: 'numeric' })
    : anchor.toLocaleDateString(user?.locale ?? 'en-IN', { month: 'long', year: 'numeric' })
  const kpis = useMemo(() => {
    if (!data) return []
    return [
      {
        key: 'INCOME',
        label: 'Income',
        amount: data.summary.income,
        percent: data.summary.income > 0 ? 100 : null,
        color: '#315C4C',
      },
      {
        key: 'SAVINGS',
        label: 'Savings',
        amount: data.summary.savings,
        percent: data.summary.savingsRatePercent,
        color: '#527DA1',
      },
      ...data.buckets.map((bucket) => ({
        key: bucket.systemKey,
        label: bucket.name,
        amount: bucket.netSpent,
        percent: bucket.percentOfIncome,
        color: bucket.colorHex,
      })),
    ]
  }, [data])
  const allocation = useMemo(() => {
    if (!data) return []
    const values = [
      ...data.buckets.map((bucket) => ({
        name: bucket.name,
        value: bucket.netSpent,
        color: bucket.colorHex,
      })),
      { name: 'Savings', value: data.summary.savings, color: '#527DA1' },
      {
        name: data.summary.available >= 0 ? 'Available' : 'Shortfall',
        value: Math.abs(data.summary.available),
        color: data.summary.available >= 0 ? '#D3B45E' : '#B85D4A',
      },
    ]
    return values.filter((item) => item.value > 0)
  }, [data])

  if (query.isLoading) {
    return <Box minHeight="80vh" display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
  }
  if (query.isError || !data) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">Financial insights could not open. Confirm the updated backend is running and refresh.</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 5 } }}>
      <Button component={RouterLink} to="/financial-flow" startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
        Back to Financial Flow
      </Button>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight={800}>Financial perspective</Typography>
          <Typography variant="h1" fontSize={{ xs: 38, md: 54 }}>Flow Insights</Typography>
          <Typography color="text.secondary" mt={1} maxWidth={740}>
            See how income became saving, support and experience—without losing the transactions behind the story.
          </Typography>
        </Box>
        <Stack spacing={1.25} alignItems={{ md: 'flex-end' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={period}
            onChange={(_, value) => {
              if (!value) return
              setPeriod(value)
              setAnchor(new Date())
            }}
            aria-label="Financial insight period"
          >
            <ToggleButton value="MONTH">Month</ToggleButton>
            <ToggleButton value="YEAR">Year</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" alignItems="center">
            <Tooltip title={`Previous ${period.toLowerCase()}`}>
              <IconButton onClick={() => setAnchor((value) => moveAnchor(value, period, -1))}>
                <ArrowBackRounded />
              </IconButton>
            </Tooltip>
            <Typography minWidth={150} textAlign="center" fontWeight={850}>{periodLabel}</Typography>
            <Tooltip title={`Next ${period.toLowerCase()}`}>
              <IconButton onClick={() => setAnchor((value) => moveAnchor(value, period, 1))}>
                <ArrowForwardRounded />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      <Card sx={{
        mb: 3,
        color: '#F8FBF9',
        overflow: 'hidden',
        background: 'linear-gradient(125deg, #244D40, #356957)',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          right: -90,
          top: -150,
          background: 'radial-gradient(circle, rgba(232,196,99,.34), transparent 68%)',
        },
      }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, position: 'relative', zIndex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoGraphRounded />
            <Typography variant="overline" fontWeight={850}>Period at a glance</Typography>
          </Stack>
          <Typography variant="h2" fontSize={{ xs: 27, md: 38 }} mt={1}>
            {data.summary.available >= 0
              ? `${currency.format(data.summary.available)} remains available`
              : `${currency.format(Math.abs(data.summary.available))} beyond recorded income`}
          </Typography>
          <Typography sx={{ opacity: 0.76 }} mt={0.5}>
            Income − net spending − savings
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        gap: 1.5,
        mb: 3,
      }}>
        {kpis.map((kpi) => {
          const visualPercent = Math.min(100, Math.max(0, kpi.percent ?? 0))
          return (
            <Card key={kpi.key} variant="outlined" sx={{ borderRadius: 3, borderTop: `4px solid ${kpi.color}` }}>
              <CardContent sx={{ p: 2.2 }}>
                <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                  <Box>
                    <Typography variant="overline" color="text.secondary">{kpi.label}</Typography>
                    <Typography variant="h3" fontSize={25}>{currency.format(kpi.amount)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {kpi.percent == null
                        ? 'Add income to calculate a percentage'
                        : kpi.key === 'INCOME' ? 'Income baseline' : `${kpi.percent.toFixed(1)}% of income`}
                    </Typography>
                  </Box>
                  <Box sx={{
                    width: 54,
                    height: 54,
                    flex: '0 0 auto',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: `conic-gradient(${kpi.color} ${visualPercent}%, ${alpha(kpi.color, 0.12)} 0)`,
                    '&::before': {
                      content: '""',
                      width: 39,
                      height: 39,
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                    },
                  }} />
                </Stack>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.35fr .65fr' }, gap: 3 }}>
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              gap={2}
            >
              <Box>
                <Typography variant="overline" color="primary" fontWeight={850}>Flow timeline</Typography>
                <Typography variant="h3" fontSize={25}>
                  {period === 'YEAR' ? 'The year, month by month' : 'The month, week by week'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {flowView === 'INCOME'
                    ? 'Recorded income in each period, without spending competing for attention.'
                    : 'Net bucket spending and savings, kept separate from income.'}
                </Typography>
              </Box>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={flowView}
                onChange={(_, value: FlowView | null) => value && setFlowView(value)}
                aria-label="Financial flow chart view"
                sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, flexShrink: 0 }}
              >
                <ToggleButton value="OUTFLOW" sx={{ flex: { xs: 1, sm: 'initial' } }}>
                  Spending &amp; savings
                </ToggleButton>
                <ToggleButton value="INCOME" sx={{ flex: { xs: 1, sm: 'initial' } }}>
                  Income
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <Box height={{ xs: 320, md: 390 }} mt={2}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeline} margin={{ top: 12, right: 12, left: 0, bottom: 8 }} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} opacity={0.55} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis width={56} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    formatter={(value) => currency.format(Number(value))}
                    cursor={{ fill: alpha('#315C4C', 0.06) }}
                  />
                  {flowView === 'INCOME' ? (
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#315C4C"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={48}
                    />
                  ) : (
                    <>
                      {data.buckets.map((bucket) => (
                        <Bar
                          key={bucket.bucketId}
                          dataKey={bucketDataKeys[bucket.systemKey]}
                          name={bucket.name}
                          stackId="outflow"
                          fill={bucket.colorHex}
                          maxBarSize={48}
                        />
                      ))}
                      <Bar
                        dataKey="savings"
                        name="Savings"
                        stackId="outflow"
                        fill="#527DA1"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={48}
                      />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              gap={1.5}
              mt={1}
              aria-label={`${flowView === 'INCOME' ? 'Income' : 'Spending and savings'} chart legend`}
            >
              {(flowView === 'INCOME'
                ? [{ name: 'Income', color: '#315C4C' }]
                : [
                    ...data.buckets.map((bucket) => ({ name: bucket.name, color: bucket.colorHex })),
                    { name: 'Savings', color: '#527DA1' },
                  ]
              ).map((item) => (
                <Stack key={item.name} direction="row" alignItems="center" gap={0.75}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: item.color }} />
                  <Typography variant="caption" color="text.secondary">{item.name}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="overline" color="primary" fontWeight={850}>Money composition</Typography>
            <Typography variant="h3" fontSize={25}>How recorded money moved</Typography>
            <Box height={250} position="relative" mt={1}>
              {allocation.length ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart accessibilityLayer>
                      <ChartTooltip />
                      <Pie
                        data={allocation}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={91}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {allocation.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <Box aria-hidden sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeContent: 'center',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}>
                    <AccountBalanceWalletRounded color="primary" />
                    <Typography variant="caption">Flow</Typography>
                  </Box>
                </>
              ) : (
                <Box height="100%" display="grid" sx={{ placeItems: 'center', textAlign: 'center' }}>
                  <Typography color="text.secondary">Record income or spending to begin this view.</Typography>
                </Box>
              )}
            </Box>
            <Stack spacing={1}>
              {allocation.map((item) => (
                <Stack key={item.name} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 11, height: 11, borderRadius: '50% 15% 50% 15%', bgcolor: item.color }} />
                  <Typography variant="body2" fontWeight={750} flex={1}>{item.name}</Typography>
                  <Typography variant="body2">{currency.format(item.value)}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card variant="outlined" sx={{ mt: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 2.25 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <SavingsRounded color="primary" />
            <Typography variant="body2" color="text.secondary">
              Percentages use recorded income as the baseline. Refunds reduce the original bucket’s spending.
              Transfers only move money between locations, so they are excluded from income, spending and savings KPIs.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}
