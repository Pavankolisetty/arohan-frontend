import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import {
  alpha,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api, ApiError } from '../shared/api'
import type { PracticeInput, TodayHabit } from '../shared/types'
import { PracticeDialog } from './PracticeDialog'

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function statusLabel(habit: TodayHabit) {
  if (habit.entry?.status === 'COMPLETED') return 'Completed'
  if (habit.entry?.status === 'PARTIAL') return 'Partial practice'
  if (habit.entry?.status === 'SKIPPED') return 'Consciously skipped'
  return habit.opportunityType === 'FLEXIBLE'
    ? 'Available this week'
    : habit.opportunityType === 'CUSTOM'
      ? 'Available by your rhythm'
      : 'Ready today'
}

export function TodayPage() {
  const { token } = useAuth()
  const client = useQueryClient()
  const browserToday = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(browserToday)
  const [detail, setDetail] = useState<TodayHabit | null>(null)
  const [error, setError] = useState('')
  const query = useQuery({
    queryKey: ['today-rhythm', date],
    queryFn: () => api.todayRhythm(token!, date),
    enabled: Boolean(token),
  })
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['today-rhythm'] })
    client.invalidateQueries({ queryKey: ['growth-studio'] })
  }
  const record = useMutation({
    mutationFn: ({ habit, input }: { habit: TodayHabit; input: PracticeInput }) =>
      api.recordPractice(token!, habit.habitId, date, input),
    onSuccess: () => {
      setDetail(null)
      setError('')
      refresh()
    },
    onError: (caught) =>
      setError(caught instanceof ApiError ? caught.message : 'Could not save this moment.'),
  })
  const clear = useMutation({
    mutationFn: (habit: TodayHabit) => api.clearPractice(token!, habit.habitId, date),
    onSuccess: refresh,
  })
  const data = query.data
  const total = data?.habits.length ?? 0
  const completed = data?.completedCount ?? 0
  const progress = total === 0 ? 0 : (completed / total) * 100

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} mb={4}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight={800}>Meet the day gently</Typography>
          <Typography variant="h1" fontSize={{ xs: 40, md: 56 }}>Today’s Rhythm</Typography>
          <Typography color="text.secondary" mt={1}>
            Only genuine opportunities appear. An unscheduled day is never a failure.
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center">
          <IconButton aria-label="Previous day" onClick={() => setDate(shiftDate(date, -1))}><ArrowBackRounded /></IconButton>
          <Button onClick={() => setDate(browserToday)}>
            {data ? new Date(`${data.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : date}
          </Button>
          <IconButton aria-label="Next day" disabled={date >= browserToday} onClick={() => setDate(shiftDate(date, 1))}><ArrowForwardRounded /></IconButton>
        </Stack>
      </Stack>

      {error && !detail && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {query.isLoading ? (
        <Box minHeight={350} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
      ) : total === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
          <AutoAwesomeRounded color="primary" sx={{ fontSize: 52 }} />
          <Typography variant="h3" mt={2}>This day has room to breathe.</Typography>
          <Typography color="text.secondary" mt={1}>
            There are no scheduled Growth Habits here. Rest is part of a sustainable rhythm.
          </Typography>
          <Button component={Link} to="/growth-habits" sx={{ mt: 2 }}>Explore Growth Habits</Button>
        </Card>
      ) : (
        <>
          <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent sx={{ p: { xs: 2.25, md: 2.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="end">
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.75 }}>Today’s gentle progress</Typography>
                  <Typography variant="h2" fontSize={{ xs: 25, md: 28 }}>{completed} of {total} moments completed</Typography>
                  {(data?.partialCount ?? 0) > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.78 }}>
                      {data?.partialCount} partial {(data?.partialCount ?? 0) === 1 ? 'practice' : 'practices'} also acknowledged
                    </Typography>
                  )}
                </Box>
                <Typography fontWeight={800}>{Math.round(progress)}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ mt: 1.5, height: 7, borderRadius: 9, bgcolor: 'rgba(255,255,255,.16)', '& .MuiLinearProgress-bar': { bgcolor: '#F3C96B' } }} />
            </CardContent>
          </Card>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
              alignItems: 'stretch',
            }}
          >
            {data?.habits.map((habit) => {
              const resolved = Boolean(habit.entry?.status)
              return (
                <Card
                  key={habit.habitId}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    minHeight: 245,
                    opacity: habit.entry?.status === 'SKIPPED' ? 0.72 : 1,
                    borderTop: '4px solid',
                    borderTopColor: habit.lifeAreaColor,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: 92,
                      height: 92,
                      right: -32,
                      top: -34,
                      borderRadius: '60% 12% 60% 12%',
                      bgcolor: alpha(habit.lifeAreaColor, 0.1),
                      transform: 'rotate(18deg)',
                      pointerEvents: 'none',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.25, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                    <Stack direction="row" spacing={0.75} mb={1.25} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={habit.lifeAreaName} sx={{ color: habit.lifeAreaColor, bgcolor: alpha(habit.lifeAreaColor, 0.12) }} />
                      <Chip size="small" label={habit.rhythmLabel} variant="outlined" />
                      <Chip size="small" label={statusLabel(habit)} color={resolved ? 'success' : 'default'} />
                    </Stack>
                    <Typography variant="h3" fontSize={22}>{habit.name}</Typography>
                    <Typography color="text.secondary" variant="body2" mt={0.4}>{habit.purpose}</Typography>
                    <Box flex={1} minHeight={14} />
                    <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap mt={1.5}>
                        {!resolved && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckRounded />}
                            onClick={() => record.mutate({ habit, input: { status: 'COMPLETED', actualValue: null, qualityRating: null, reflection: '', frictionNote: '' } })}
                          >
                            Complete
                          </Button>
                        )}
                        <Button size="small" startIcon={<EditRounded />} onClick={() => { setError(''); setDetail(habit) }}>
                          {resolved ? 'Reflect' : 'Details'}
                        </Button>
                        {resolved && <Button size="small" color="inherit" startIcon={<ReplayRounded />} onClick={() => clear.mutate(habit)}>Undo</Button>}
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </>
      )}
      {detail && (
        <PracticeDialog
          habit={detail}
          saving={record.isPending}
          error={error}
          onClose={() => { setDetail(null); setError('') }}
          onSave={(input) => record.mutate({ habit: detail, input })}
        />
      )}
    </Container>
  )
}
