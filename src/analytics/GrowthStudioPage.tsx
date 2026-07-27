import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import KeyboardReturnRounded from '@mui/icons-material/KeyboardReturnRounded'
import SpaRounded from '@mui/icons-material/SpaRounded'
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
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../auth/AuthContext'
import { api } from '../shared/api'
import type { GrowthSignal, RhythmDay } from '../shared/types'

function dateBefore(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

type LifeAreaLensRange = 'WEEK' | 'MONTH' | 'YEAR'

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function lifeAreaLensPeriod(range: LifeAreaLensRange) {
  const end = new Date()
  const start = new Date(end)
  if (range === 'WEEK') {
    start.setDate(end.getDate() - 6)
  } else if (range === 'MONTH') {
    start.setDate(1)
  } else {
    start.setMonth(0, 1)
  }
  return {
    from: localDateValue(start),
    to: localDateValue(end),
    label: range === 'WEEK' ? 'Last 7 days' : range === 'MONTH' ? 'This month' : 'This year',
  }
}

function signalText(signal: GrowthSignal) {
  if (!signal.ready) {
    if (signal.key === 'MOMENTUM') return 'Building a comparison'
    if (signal.key === 'RECOVERY') return 'Learning your returns'
    return 'Gathering'
  }
  if (signal.direction) return signal.direction.toLowerCase()
  return signal.value === undefined ? 'Gathering' : `${signal.value}${signal.unit === '%' ? '%' : ` ${signal.unit}`}`
}

function evidenceText(signal: GrowthSignal) {
  if (signal.ready) {
    if (signal.key === 'CONSISTENCY') return `${signal.sampleSize} scheduled ${signal.sampleSize === 1 ? 'moment' : 'moments'} counted`
    if (signal.key === 'MOMENTUM') return 'Compared with the previous equal period'
    return `${signal.sampleSize} return opportunities observed`
  }
  if (signal.key === 'MOMENTUM') return `${signal.sampleSize} of ${signal.minimumSample} comparable moments`
  if (signal.key === 'RECOVERY') return `${signal.sampleSize} of ${signal.minimumSample} missed-then-return moments`
  return `${signal.sampleSize} of ${signal.minimumSample} moments`
}

function dayStatus(day: RhythmDay) {
  if (day.completed) return { label: 'Completed', mark: '✓', color: '#4E8669', strength: Math.min(1, day.completed / Math.max(day.due, 1)) }
  if (day.partial) return { label: 'Partial', mark: '◐', color: '#D9A94E', strength: 0.7 }
  if (day.skipped) return { label: 'Skipped', mark: '↷', color: '#7A8790', strength: 0.55 }
  if (day.missed) return { label: 'Missed', mark: '○', color: '#B76B5B', strength: 0.35 }
  if (day.due) return { label: 'Due', mark: '✦', color: '#397E9A', strength: 0.25 }
  return { label: 'No opportunity', mark: '—', color: '#8A948F', strength: 0.08 }
}

export function GrowthStudioPage() {
  const { token } = useAuth()
  const [range, setRange] = useState<7 | 14 | 30>(7)
  const [areaId, setAreaId] = useState('')
  const [day, setDay] = useState<RhythmDay | null>(null)
  const [pulseHelpOpen, setPulseHelpOpen] = useState(false)
  const [studioHelp, setStudioHelp] = useState<'compass' | 'journey' | null>(null)
  const [lensRange, setLensRange] = useState<LifeAreaLensRange>('MONTH')
  const to = new Date().toISOString().slice(0, 10)
  const from = dateBefore(range - 1)
  const query = useQuery({
    queryKey: ['growth-studio', from, to, areaId],
    queryFn: () => api.growthStudio(token!, { from, to, lifeAreaId: areaId || undefined }),
    enabled: Boolean(token),
  })
  const allAreas = useQuery({
    queryKey: ['life-areas', false],
    queryFn: () => api.lifeAreas(token!),
    enabled: Boolean(token),
  })
  const lensPeriod = useMemo(() => lifeAreaLensPeriod(lensRange), [lensRange])
  const lensQuery = useQuery({
    queryKey: ['growth-studio-life-area-lens', lensRange, lensPeriod.from, lensPeriod.to],
    queryFn: () => api.growthStudio(token!, {
      from: lensPeriod.from,
      to: lensPeriod.to,
    }),
    enabled: Boolean(token),
  })
  const data = query.data
  const lensAreas = useMemo(
    () => (lensQuery.data?.lifeAreas ?? []).map((area) => ({
      ...area,
      displayName: area.name.length > 16 ? `${area.name.slice(0, 15)}…` : area.name,
      rhythm: area.eligible ? Math.round(area.consistencyPercent ?? 0) : 0,
      attention: Math.round(area.actualAttentionShare ?? 0),
    })),
    [lensQuery.data?.lifeAreas],
  )
  const attentionAreas = useMemo(
    () => lensAreas.filter((area) => area.attention > 0),
    [lensAreas],
  )
  const radarData = useMemo(
    () => (data?.lifeAreas ?? []).map((area) => ({
      area: area.name.length > 14 ? `${area.name.slice(0, 13)}…` : area.name,
      consistency: area.consistencyPercent ?? 0,
      desired: area.desiredImportance * 20,
    })),
    [data?.lifeAreas],
  )

  if (query.isLoading) {
    return <Box minHeight="80vh" display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 5 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={4}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight={800}>Evidence, not judgment</Typography>
          <Typography variant="h1" fontSize={{ xs: 40, md: 56 }}>Growth Studio</Typography>
          <Typography color="text.secondary" mt={1} maxWidth={760}>
            See consistency, recovery and starting friction while keeping every number connected to the moments behind it.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <ToggleButtonGroup exclusive value={range} onChange={(_, value) => value && setRange(value)}>
            <ToggleButton value={7}>7 days</ToggleButton>
            <ToggleButton value={14}>14 days</ToggleButton>
            <ToggleButton value={30}>30 days</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Life Area</InputLabel>
            <Select label="Life Area" value={areaId} onChange={(event) => setAreaId(event.target.value)}>
              <MenuItem value="">All Life Areas</MenuItem>
              {(allAreas.data ?? []).flatMap((area) => [area, ...area.subareas]).map((area) => (
                <MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Card sx={{ color: '#F7FBF8', bgcolor: '#315C4C', mb: 3, overflow: 'hidden', position: 'relative' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AutoAwesomeRounded />
              <Typography variant="overline" fontWeight={800}>Growth Pulse</Typography>
            </Stack>
            <Button
              color="inherit"
              size="small"
              startIcon={<HelpOutlineRounded />}
              onClick={() => setPulseHelpOpen(true)}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' }, opacity: 0.9 }}
            >
              How is this calculated?
            </Button>
          </Stack>
          <Typography variant="h2" fontSize={{ xs: 26, md: 34 }} mt={0.75}>
            {data?.counts.eligible
              ? `${data.counts.completed} of ${data.counts.eligible} scheduled moments completed`
              : 'Your Growth Pulse begins with a scheduled moment'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.76, mt: 0.5 }}>
            Every update in Today’s Rhythm becomes dated evidence here.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mt: 2.5 }}>
            {data?.signals.map((signal) => (
              <Box key={signal.key} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.09)', minHeight: 108 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" fontWeight={800}>{signal.label}</Typography>
                  <Tooltip title={signal.explanation}><InfoOutlined sx={{ fontSize: 17, opacity: 0.7 }} /></Tooltip>
                </Stack>
                <Typography variant="h3" fontSize={signal.ready ? 23 : 18} mt={1} sx={{ textTransform: signal.direction ? 'capitalize' : 'none' }}>
                  {signalText(signal)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>{evidenceText(signal)}</Typography>
              </Box>
            ))}
          </Box>
          <Stack direction="row" spacing={2} mt={2} flexWrap="wrap" useFlexGap>
            {[
              ['Completed', data?.counts.completed ?? 0],
              ['Partial', data?.counts.partial ?? 0],
              ['Skipped', data?.counts.skipped ?? 0],
              ['Missed', data?.counts.missed ?? 0],
            ].map(([label, value]) => (
              <Typography key={String(label)} variant="body2" sx={{ opacity: 0.76 }}><strong>{value}</strong> {label}</Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr .9fr' }, gap: 3 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box>
                <Typography variant="overline" color="primary" fontWeight={800}>Life Compass</Typography>
                <Typography variant="h3" fontSize={25}>Attention across your life</Typography>
              </Box>
              <IconButton aria-label="How Life Compass works" onClick={() => setStudioHelp('compass')}><HelpOutlineRounded /></IconButton>
            </Stack>
            <Typography color="text.secondary" variant="body2">
              Each direction is one Life Area. Distance from the centre shows 0–100%.
            </Typography>
            <Stack direction="row" spacing={2.5} mt={2} flexWrap="wrap" useFlexGap>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box sx={{ width: 25, borderTop: '3px solid #315C4C' }} />
                <Typography variant="caption" fontWeight={750}>Actual rhythm</Typography>
              </Stack>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box sx={{ width: 25, borderTop: '2px dashed #D9A94E' }} />
                <Typography variant="caption" fontWeight={750}>Desired focus</Typography>
              </Stack>
            </Stack>
            {radarData.length >= 2 ? (
              <Box height={330}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="70%" accessibilityLayer>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <ChartTooltip />
                    <Radar name="Desired focus" dataKey="desired" stroke="#D9A94E" strokeDasharray="6 4" strokeWidth={2} fill="#D9A94E" fillOpacity={0.1} dot />
                    <Radar name="Actual rhythm" dataKey="consistency" stroke="#315C4C" strokeWidth={2.5} fill="#4E8669" fillOpacity={0.28} dot />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box minHeight={260} display="grid" sx={{ placeItems: 'center', textAlign: 'center' }}>
                <Typography color="text.secondary">Two Life Areas make comparison meaningful. Your individual area remains valid on its own.</Typography>
              </Box>
            )}
            <Stack spacing={1}>
              {data?.lifeAreas.map((area) => (
                <CardActionArea key={area.lifeAreaId} onClick={() => setAreaId(area.lifeAreaId)} sx={{ borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 1.1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ width: 11, height: 11, borderRadius: '50% 16% 50% 16%', bgcolor: area.colorHex, flex: '0 0 auto' }} />
                    <Typography fontWeight={800} flex={1}>{area.name}</Typography>
                    <Box textAlign="right">
                      <Typography variant="caption" display="block">
                        Actual: <strong>{area.eligible ? `${Math.round(area.consistencyPercent ?? 0)}%` : 'No moments yet'}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Desired: {area.desiredImportance}/5
                      </Typography>
                    </Box>
                  </Stack>
                </CardActionArea>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="primary" fontWeight={800}>Momentum Rings</Typography>
            <Typography variant="h3" fontSize={25}>Each rhythm keeps its own pace</Typography>
            <Stack spacing={2.2} mt={3}>
              {data?.lifeAreas.slice(0, 4).map((area) => (
                <CardActionArea key={area.lifeAreaId} onClick={() => setAreaId(area.lifeAreaId)} sx={{ borderRadius: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} p={1}>
                    <Box position="relative" display="inline-flex">
                      <CircularProgress variant="determinate" value={area.consistencyPercent ?? 0} size={58} sx={{ color: area.colorHex }} />
                      <Box position="absolute" display="grid" sx={{ inset: 0, placeItems: 'center' }}><Typography variant="caption" fontWeight={800}>{area.eligible ? `${Math.round(area.consistencyPercent ?? 0)}%` : '—'}</Typography></Box>
                    </Box>
                    <Box>
                      <Typography fontWeight={800}>{area.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {area.eligible ? `${area.completed}/${area.eligible} completed opportunities` : 'No scheduled moments in this range'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardActionArea>
              ))}
              {!data?.lifeAreas.length && <Typography color="text.secondary">Create a Life Area and record practice to begin a ring.</Typography>}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{
          gridColumn: { lg: '1 / -1' },
          overflow: 'hidden',
          background: 'linear-gradient(140deg, rgba(255,255,255,.98), rgba(234,242,235,.88))',
        }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ md: 'flex-start' }}
              spacing={2}
            >
              <Box>
                <Typography variant="overline" color="primary" fontWeight={800}>Life Area Lens</Typography>
                <Typography variant="h3" fontSize={{ xs: 25, md: 29 }}>See where your rhythm is taking root</Typography>
                <Typography color="text.secondary" variant="body2" mt={0.5} maxWidth={720}>
                  Compare each Life Area fairly by its own scheduled opportunities, then see where your recorded attention flowed.
                </Typography>
              </Box>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={lensRange}
                onChange={(_, value) => value && setLensRange(value)}
                aria-label="Life Area chart period"
              >
                <ToggleButton value="WEEK">Week</ToggleButton>
                <ToggleButton value="MONTH">Month</ToggleButton>
                <ToggleButton value="YEAR">Year</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" mt={2} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={lensPeriod.label} color="primary" variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                Through {new Date(`${lensPeriod.to}T12:00:00`).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: lensRange === 'YEAR' ? 'numeric' : undefined,
                })}
              </Typography>
            </Stack>

            {lensQuery.isLoading ? (
              <Box minHeight={320} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
            ) : lensQuery.isError ? (
              <Alert severity="error" sx={{ mt: 3 }}>Life Area charts could not be gathered just now.</Alert>
            ) : lensAreas.length === 0 ? (
              <Box minHeight={260} display="grid" sx={{ placeItems: 'center', textAlign: 'center' }}>
                <Box>
                  <SpaRounded color="primary" sx={{ fontSize: 42 }} />
                  <Typography fontWeight={800}>Your Life Area view is ready to grow.</Typography>
                  <Typography color="text.secondary">Add a scheduled Growth Habit to create comparable evidence.</Typography>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.35fr) minmax(300px, .65fr)' },
                  gap: 3,
                  mt: 2.5,
                }}>
                  <Box sx={{
                    p: { xs: 1.5, sm: 2.25 },
                    borderRadius: 2.5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}>
                    <Typography fontWeight={850}>Rhythm by Life Area</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Completed moments ÷ genuine scheduled opportunities
                    </Typography>
                    <Stack spacing={2} mt={2.5} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                      {lensAreas.map((area) => (
                        <Box key={area.lifeAreaId}>
                          <Stack direction="row" justifyContent="space-between" spacing={1} mb={0.65}>
                            <Typography variant="body2" fontWeight={800}>{area.name}</Typography>
                            <Typography variant="body2" fontWeight={850}>
                              {area.eligible ? `${area.rhythm}%` : 'No moments'}
                            </Typography>
                          </Stack>
                          <Box sx={{
                            height: 12,
                            overflow: 'hidden',
                            borderRadius: 8,
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}>
                            <Box sx={{
                              height: '100%',
                              width: `${area.eligible ? area.rhythm : 0}%`,
                              minWidth: area.eligible && area.rhythm ? 6 : 0,
                              borderRadius: 8,
                              bgcolor: area.colorHex,
                              transition: 'width .45s ease',
                            }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {area.eligible
                              ? `${area.completed} of ${area.eligible} scheduled moments`
                              : 'No scheduled opportunities in this period'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Box
                      height={Math.max(240, lensAreas.length * 44)}
                      mt={1.5}
                      sx={{ display: { xs: 'none', sm: 'block' } }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={lensAreas}
                          layout="vertical"
                          margin={{ top: 6, right: 48, bottom: 6, left: 16 }}
                          accessibilityLayer
                        >
                          <CartesianGrid strokeDasharray="3 5" horizontal={false} opacity={0.45} />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="displayName"
                            width={132}
                            tick={{ fontSize: 12, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ChartTooltip />
                          <Bar
                            dataKey="rhythm"
                            name="Rhythm met"
                            unit="%"
                            radius={[0, 12, 12, 0]}
                            maxBarSize={24}
                            isAnimationActive
                          >
                            {lensAreas.map((area) => <Cell key={area.lifeAreaId} fill={area.colorHex} />)}
                            <LabelList dataKey="rhythm" position="right" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>

                  <Box sx={{
                    p: { xs: 1.5, sm: 2.25 },
                    borderRadius: 2.5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}>
                    <Typography fontWeight={850}>Attention in motion</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Share of completed and partial practices
                    </Typography>
                    {attentionAreas.length ? (
                      <>
                        <Box height={220} position="relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart accessibilityLayer>
                              <ChartTooltip />
                              <Pie
                                data={attentionAreas}
                                dataKey="attention"
                                nameKey="name"
                                innerRadius={58}
                                outerRadius={86}
                                paddingAngle={3}
                                stroke="none"
                                isAnimationActive
                              >
                                {attentionAreas.map((area) => <Cell key={area.lifeAreaId} fill={area.colorHex} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <Box
                            aria-hidden
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'grid',
                              placeContent: 'center',
                              textAlign: 'center',
                              pointerEvents: 'none',
                            }}
                          >
                            <Typography variant="h4" fontSize={22}>Your</Typography>
                            <Typography variant="caption" color="text.secondary">attention</Typography>
                          </Box>
                        </Box>
                        <Stack spacing={0.8}>
                          {attentionAreas.map((area) => (
                            <Stack key={area.lifeAreaId} direction="row" spacing={1} alignItems="center">
                              <Box sx={{
                                width: 10,
                                height: 10,
                                flex: '0 0 auto',
                                borderRadius: '50% 15% 50% 15%',
                                bgcolor: area.colorHex,
                              }} />
                              <Typography variant="caption" fontWeight={750} flex={1}>{area.name}</Typography>
                              <Typography variant="caption">{area.attention}%</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </>
                    ) : (
                      <Box minHeight={260} display="grid" sx={{ placeItems: 'center', textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          Record a completed or partial practice to reveal how attention is distributed.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 1.25,
                  mt: 2,
                }}>
                  {lensAreas.map((area) => (
                    <CardActionArea
                      key={area.lifeAreaId}
                      onClick={() => setAreaId(area.lifeAreaId)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderLeft: `4px solid ${area.colorHex}`,
                        bgcolor: (theme) => alpha(area.colorHex, theme.palette.mode === 'dark' ? 0.12 : 0.055),
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography fontWeight={850} noWrap>{area.name}</Typography>
                        <Typography fontWeight={850}>
                          {area.eligible ? `${area.rhythm}%` : '—'}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {area.eligible
                          ? `${area.completed} of ${area.eligible} scheduled moments completed`
                          : 'No scheduled opportunities in this period'}
                      </Typography>
                    </CardActionArea>
                  ))}
                </Box>

                <Box sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.07),
                }}>
                  <Typography variant="caption" color="text.secondary">
                    A larger slice means more of your recorded practice happened in that Life Area—not that it is more important.
                    Rhythm percentages compare every area against its own schedule, so a weekly habit is not unfairly compared with a daily habit.
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        <Card sx={{ gridColumn: { lg: '1 / -1' } }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="primary" fontWeight={800}>Rhythm Map</Typography>
            <Typography variant="h3" fontSize={25}>The shape of your recent days</Typography>
            <Typography color="text.secondary" variant="body2">Select any cell to see the habits and reflections behind it.</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: range === 7
                  ? { xs: 'repeat(4, minmax(54px, 1fr))', sm: 'repeat(7, minmax(58px, 1fr))' }
                  : 'repeat(auto-fill, minmax(58px, 1fr))',
                gap: { xs: 1.25, md: 1.75 },
                mt: 3,
              }}
            >
              {data?.rhythm.map((item) => {
                const status = dayStatus(item)
                const dateValue = new Date(`${item.date}T12:00:00`)
                return (
                  <Tooltip key={item.date} title={`${item.date}: ${status.label}`}>
                    <CardActionArea
                      onClick={() => setDay(item)}
                      aria-label={`${item.date}, ${status.label}`}
                      sx={{
                        aspectRatio: '1 / 1',
                        width: '100%',
                        maxWidth: 76,
                        justifySelf: 'center',
                        borderRadius: '52% 16% 52% 16%',
                        bgcolor: alpha(status.color, status.strength),
                        border: '1px solid',
                        borderColor: alpha(status.color, 0.38),
                        display: 'flex',
                        flexDirection: 'column',
                        placeItems: 'center',
                        transition: 'transform .18s ease, box-shadow .18s ease',
                        '&:hover': { transform: 'translateY(-3px) rotate(-1deg)', boxShadow: `0 8px 18px ${alpha(status.color, 0.2)}` },
                      }}
                    >
                      <Typography variant="caption" fontSize={9} sx={{ opacity: 0.72 }}>
                        {dateValue.toLocaleDateString(undefined, { weekday: 'short' })}
                      </Typography>
                      <Typography fontWeight={850} fontSize={16} lineHeight={1.15}>{dateValue.getDate()}</Typography>
                      <Typography aria-hidden fontWeight={800} fontSize={12} sx={{ color: status.color }}>{status.mark}</Typography>
                    </CardActionArea>
                  </Tooltip>
                )
              })}
            </Box>
            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
              {['Completed', 'Partial', 'Skipped', 'Missed', 'Due', 'No opportunity'].map((label) => <Chip key={label} size="small" label={label} />)}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ gridColumn: { lg: '1 / -1' } }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box>
                <Typography variant="overline" color="primary" fontWeight={800}>Skill Journey</Typography>
                <Typography variant="h3" fontSize={25}>Growth without streak pressure</Typography>
              </Box>
              <IconButton aria-label="How Skill Journey works" onClick={() => setStudioHelp('journey')}><HelpOutlineRounded /></IconButton>
            </Stack>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              A stage for each habit based on evidence in this selected period.
            </Typography>
            <Stack mt={2.25} spacing={1}>
              {data?.skillJourney.slice(0, 4).map((habit) => (
                <Box
                  key={habit.habitId}
                  sx={{
                    px: 1.75,
                    py: 1.4,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.025),
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                    <Box minWidth={0}>
                      <Typography fontWeight={850} noWrap title={habit.habitName}>{habit.habitName}</Typography>
                      <Typography variant="caption" color="text.secondary">{habit.lifeAreaName}</Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={0.55}
                      alignItems="center"
                      sx={{ px: 1, py: 0.45, borderRadius: 1.25, bgcolor: 'action.hover', flex: '0 0 auto' }}
                    >
                      <SpaRounded sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="caption" fontWeight={800}>{habit.stage}</Typography>
                    </Stack>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.25} mt={0.9}>
                    <Typography variant="caption">{habit.completed} of {habit.eligible} moments completed</Typography>
                    <Typography variant="caption" fontWeight={800}>
                      {habit.eligible ? `${Math.round(habit.consistencyPercent ?? 0)}% rhythm` : 'Gathering evidence'}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.35} mt={0.65}>
                    Next: {habit.nextStageHint}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ gridColumn: { lg: '1 / -1' }, background: 'linear-gradient(125deg, rgba(169,201,184,.2), rgba(243,201,174,.18))' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction="row" spacing={1} alignItems="center"><AutoAwesomeRounded color="primary" /><Typography variant="overline" color="primary" fontWeight={800}>Progress Story</Typography></Stack>
            <Typography variant="h2" fontSize={30} mt={1}>{data?.progressStory.title}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mt: 2 }}>
              <Story icon={<CheckCircleRounded />} title="Evidence" text={data?.progressStory.evidence} />
              <Story icon={<KeyboardReturnRounded />} title="Recovery" text={data?.progressStory.recovery} />
              <Story icon={<AutoAwesomeRounded />} title="Next experiment" text={data?.progressStory.nextExperiment} />
            </Box>
            <Typography variant="body2" color="text.secondary" mt={2}>Recurring barrier: {data?.progressStory.recurringBarrier}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={Boolean(studioHelp)} onClose={() => setStudioHelp(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {studioHelp === 'compass' && 'Reading your Life Compass'}
          {studioHelp === 'journey' && 'Reading your Skill Journey'}
        </DialogTitle>
        <DialogContent>
          {studioHelp === 'compass' && (
            <Stack spacing={1.5}>
              <Typography color="text.secondary">
                Every Life Area becomes one direction from the centre. Two areas form a line, three form a triangle, four form a diamond, and additional areas add more directions.
              </Typography>
              <Typography>
                <strong>Actual rhythm</strong> uses completed ÷ scheduled moments. <strong>Desired focus</strong> comes from the 1–5 importance value you chose for that Life Area.
              </Typography>
              <Typography>
                A shape stretching toward one area means that area currently has a higher value. It is not a recommendation to neglect the other areas.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                “No moments yet” means the selected period contained no eligible schedule—it is different from 0% completion.
              </Typography>
            </Stack>
          )}
          {studioHelp === 'journey' && (
            <Stack spacing={1.5}>
              <Typography color="text.secondary">
                Skill Journey describes how established each Growth Habit currently looks. It is not a streak, rank or judgment.
              </Typography>
              {[
                ['Seed', 'Fewer than 3 eligible opportunities.'],
                ['Starting', 'Early repetition, or rhythm below 40%.'],
                ['Building Rhythm', 'More evidence is forming; working toward 14 opportunities and 65% rhythm.'],
                ['Becoming Consistent', 'Working toward 30 opportunities, 42 days of age and 80% rhythm.'],
                ['Integrated', 'Enough duration, opportunity and consistency evidence has accumulated.'],
              ].map(([stage, meaning]) => (
                <Box key={stage}>
                  <Typography fontWeight={850}>{stage}</Typography>
                  <Typography variant="body2" color="text.secondary">{meaning}</Typography>
                </Box>
              ))}
              <Typography variant="body2" color="text.secondary">
                Changing the 7/30-day selector can change the current evidence because the journey respects the selected Growth Studio period.
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={pulseHelpOpen} onClose={() => setPulseHelpOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>How Today’s Rhythm becomes Growth Pulse</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={2}>
            Arohan saves one dated entry when you complete, partially practise, skip, or add detail to a scheduled habit. Growth Studio reads those entries for the selected 7- or 30-day window.
          </Typography>
          <Stack spacing={1.5}>
            {[
              ['Rhythm met', 'Completed scheduled moments ÷ all genuine opportunities. Partial and skipped moments remain visible, but do not increase this percentage.'],
              ['Momentum', 'Compares this window with the previous window of the same length. It waits for at least two opportunities in each window so one day cannot create a misleading trend.'],
              ['Recovery', 'Looks for a missed opportunity followed by the next scheduled opportunity. Completing or partially practising that next moment counts as a return. It waits for two such chances.'],
            ].map(([title, description], index) => (
              <Stack key={title} direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    flex: '0 0 auto',
                    borderRadius: '50% 16% 50% 16%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 850,
                  }}
                >
                  {index + 1}
                </Box>
                <Box>
                  <Typography fontWeight={850}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">{description}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
          <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) }}>
            <Typography variant="body2">
              “Building a comparison” or “Learning your returns” means Arohan is waiting for enough evidence—it is not a low score.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(day)} onClose={() => setDay(null)} fullWidth maxWidth="sm">
        <DialogTitle>{day && new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            {day?.records.map((record) => (
              <Box key={record.habitId} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between"><Typography fontWeight={800}>{record.habitName}</Typography><Chip size="small" label={record.status?.toLowerCase() ?? 'due'} /></Stack>
                <Typography variant="caption" color="text.secondary">{record.lifeAreaName}{record.cueStarted ? ' · Cue started' : ''}</Typography>
                {record.reflection && <Typography mt={1}>“{record.reflection}”</Typography>}
              </Box>
            ))}
            {day?.records.length === 0 && <Typography color="text.secondary">No eligible opportunities on this day.</Typography>}
          </Stack>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

function Story({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <IconButton size="small" color="primary" tabIndex={-1}>{icon}</IconButton>
      <Box><Typography fontWeight={800}>{title}</Typography><Typography color="text.secondary">{text}</Typography></Box>
    </Stack>
  )
}
