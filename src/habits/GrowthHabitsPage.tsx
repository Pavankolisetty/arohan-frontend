import AddRounded from '@mui/icons-material/AddRounded'
import ArchiveRounded from '@mui/icons-material/ArchiveRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import SpaRounded from '@mui/icons-material/SpaRounded'
import DeleteForeverRounded from '@mui/icons-material/DeleteForeverRounded'
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../shared/api'
import type { GrowthHabit, HabitStatus } from '../shared/types'
import { GrowthHabitDialog } from './GrowthHabitDialog'

const rhythmNames: Record<string, string> = {
  DAILY: 'Every day',
  SELECTED_WEEKDAYS: 'Chosen weekdays',
  ALTERNATE_DAYS: 'Alternate days',
  EVERY_N_DAYS: 'Every few days',
  TIMES_PER_WEEK: 'Flexible weekly target',
  TIMES_PER_MONTH: 'Flexible monthly rhythm',
  ROTATION: 'Rotating rhythm',
  ONE_TIME: 'One meaningful date',
  CUSTOM: 'Custom rhythm',
}

const shortDayNames: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
}

function rhythmLabel(habit: GrowthHabit) {
  if (habit.schedule.type === 'SELECTED_WEEKDAYS') {
    return habit.schedule.weekdays.map((day) => shortDayNames[day] ?? day).join(' · ')
  }
  if (habit.schedule.type === 'TIMES_PER_WEEK') {
    return `${habit.schedule.targetCount}× each week`
  }
  if (habit.schedule.type === 'CUSTOM') {
    return habit.schedule.customDescription || rhythmNames[habit.schedule.type]
  }
  return rhythmNames[habit.schedule.type]
}

export function GrowthHabitsPage() {
  const { token } = useAuth()
  const client = useQueryClient()
  const [params] = useSearchParams()
  const [status, setStatus] = useState<HabitStatus | 'ALL'>('ALL')
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<GrowthHabit | null>(null)
  const [menu, setMenu] = useState<{ anchor: HTMLElement; habit: GrowthHabit } | null>(null)
  const [deleting, setDeleting] = useState<GrowthHabit | null>(null)
  const areaId = params.get('area') ?? ''
  const areas = useQuery({ queryKey: ['life-areas', false], queryFn: () => api.lifeAreas(token!), enabled: Boolean(token) })
  const habits = useQuery({
    queryKey: ['growth-habits', status, areaId],
    queryFn: () => api.growthHabits(token!, { status: status === 'ALL' ? undefined : status, lifeAreaId: areaId || undefined }),
    enabled: Boolean(token),
  })
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['growth-habits'] }),
      client.invalidateQueries({ queryKey: ['life-areas'] }),
      client.invalidateQueries({ queryKey: ['today-rhythm'] }),
      client.invalidateQueries({ queryKey: ['growth-studio'] }),
    ])
  }
  const action = useMutation({
    mutationFn: ({ habit, next }: { habit: GrowthHabit; next: 'pause' | 'restart' | 'archive' }) => api.growthHabitAction(token!, habit.id, next),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (habit: GrowthHabit) => api.deleteGrowthHabit(token!, habit.id),
    onSuccess: () => {
      setDeleting(null)
      refresh()
    },
  })
  const allAreas = areas.data ?? []
  const canCreate = allAreas.some((area) => area.status === 'ACTIVE')

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} mb={4}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight={800}>Intentions made begin-able</Typography>
          <Typography variant="h1" fontSize={{ xs: 40, md: 56 }}>Growth Habits</Typography>
          <Typography color="text.secondary" mt={1} maxWidth={700}>Keep each practice connected to a Life Area and a rhythm that fits real life.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} disabled={!canCreate} onClick={() => { setEditing(null); setDialog(true) }}>Plant a Growth Habit</Button>
      </Stack>
      {!canCreate && (
        <Card sx={{ p: 3, mb: 3, borderStyle: 'dashed' }}>
          <Typography fontWeight={800}>Every Growth Habit needs a home.</Typography>
          <Button component={Link} to="/life-areas" sx={{ mt: 1 }}>Create your first Life Area</Button>
        </Card>
      )}
      <FormControl size="small" sx={{ minWidth: 190, mb: 3 }}>
        <InputLabel>View</InputLabel>
        <Select label="View" value={status} onChange={(event) => setStatus(event.target.value as HabitStatus | 'ALL')}>
          <MenuItem value="ALL">All Growth Habits</MenuItem>
          <MenuItem value="ACTIVE">In rhythm</MenuItem>
          <MenuItem value="PAUSED">Resting</MenuItem>
          <MenuItem value="ARCHIVED">Archived</MenuItem>
        </Select>
      </FormControl>
      {habits.isLoading ? <Box minHeight={300} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box> : habits.data?.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
          <SpaRounded color="primary" sx={{ fontSize: 55 }} />
          <Typography variant="h3" mt={2}>Start with an action too small to avoid.</Typography>
          <Typography color="text.secondary" mt={1}>Your first Growth Habit can be as simple as opening a notebook.</Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2.5 }}>
          {habits.data?.map((habit) => (
            <Card key={habit.id} sx={{ opacity: habit.status === 'ARCHIVED' ? 0.65 : 1, overflow: 'hidden' }}>
              <Box sx={{ height: 6, bgcolor: habit.lifeAreaColor }} />
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Stack direction="row" spacing={1} mb={1}>
                      <Chip size="small" label={habit.lifeAreaName} sx={{ bgcolor: alpha(habit.lifeAreaColor, 0.14), color: habit.lifeAreaColor }} />
                      {habit.kind === 'MILESTONE' && <Chip size="small" label="Milestone" />}
                    </Stack>
                    <Typography variant="h3" fontSize={24}>{habit.name}</Typography>
                  </Box>
                  <IconButton onClick={(event) => setMenu({ anchor: event.currentTarget, habit })} aria-label={`Options for ${habit.name}`}><MoreHorizRounded /></IconButton>
                </Stack>
                <Typography color="text.secondary" mt={1}>{habit.purpose}</Typography>
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                  <Chip size="small" label={rhythmLabel(habit)} />
                  <Chip size="small" label={habit.status === 'ACTIVE' ? 'In rhythm' : habit.status === 'PAUSED' ? 'Resting' : 'Archived'} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setEditing(menu!.habit); setDialog(true); setMenu(null) }} disabled={menu?.habit.status === 'ARCHIVED'}><EditRounded fontSize="small" sx={{ mr: 1 }} />Shape habit</MenuItem>
        {menu?.habit.status === 'ACTIVE' && <MenuItem onClick={() => { action.mutate({ habit: menu!.habit, next: 'pause' }); setMenu(null) }}><PauseRounded fontSize="small" sx={{ mr: 1 }} />Let it rest</MenuItem>}
        {menu?.habit.status === 'PAUSED' && <MenuItem onClick={() => { action.mutate({ habit: menu!.habit, next: 'restart' }); setMenu(null) }}><PlayArrowRounded fontSize="small" sx={{ mr: 1 }} />Return to rhythm</MenuItem>}
        {menu?.habit.status !== 'ARCHIVED' && <MenuItem onClick={() => { action.mutate({ habit: menu!.habit, next: 'archive' }); setMenu(null) }}><ArchiveRounded fontSize="small" sx={{ mr: 1 }} />Archive</MenuItem>}
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleting(menu!.habit); setMenu(null) }}><DeleteForeverRounded fontSize="small" sx={{ mr: 1 }} />Delete permanently</MenuItem>
      </Menu>
      <Dialog open={Boolean(deleting)} onClose={() => !remove.isPending && setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this Growth Habit?</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleting?.name}</strong> and its schedule will be permanently removed.
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Choose Archive instead when you want to keep the habit available as part of your growth story.
          </Typography>
          {remove.isError && <Typography color="error" mt={2}>The habit could not be deleted. Please try again.</Typography>}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleting(null)} disabled={remove.isPending}>Keep habit</Button>
          <Button color="error" variant="contained" startIcon={<DeleteForeverRounded />} disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting)}>
            {remove.isPending ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
      {dialog && <GrowthHabitDialog open areas={allAreas} preferredAreaId={areaId} initial={editing} onClose={() => setDialog(false)} onSaved={refresh} />}
    </Container>
  )
}
