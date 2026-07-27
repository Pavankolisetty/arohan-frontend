import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api, ApiError } from '../shared/api'
import type {
  GrowthHabit,
  GrowthHabitInput,
  LifeArea,
  ScheduleType,
  TrackingMethod,
} from '../shared/types'

const scheduleLabels: Record<ScheduleType, string> = {
  DAILY: 'Every day',
  SELECTED_WEEKDAYS: 'Chosen weekdays',
  ALTERNATE_DAYS: 'Alternate days',
  EVERY_N_DAYS: 'Every N days',
  TIMES_PER_WEEK: 'Flexible weekly target',
  TIMES_PER_MONTH: 'Times per month',
  ROTATION: 'Rotation',
  ONE_TIME: 'One time',
  CUSTOM: 'Custom rhythm',
}
const primaryScheduleTypes: ScheduleType[] = [
  'SELECTED_WEEKDAYS',
  'DAILY',
  'TIMES_PER_WEEK',
  'CUSTOM',
]
const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const tracking: { value: TrackingMethod; label: string }[] = [
  { value: 'CHECKBOX', label: 'Done / not done' },
  { value: 'DURATION', label: 'Duration' },
  { value: 'QUANTITY', label: 'Quantity' },
]

const blank = (areaId: string): GrowthHabitInput => ({
  clientRequestId: crypto.randomUUID(),
  kind: 'GROWTH_HABIT',
  lifeAreaId: areaId,
  name: '',
  purpose: '',
  trackingMethod: 'CHECKBOX',
  targetValue: null,
  targetUnit: '',
  cueNote: '',
  twoMinuteStarter: '',
  preferredTime: null,
  preferredPlace: '',
  precedingActivity: '',
  situation: '',
  fallbackPlan: '',
  positionIndex: 0,
  schedule: {
    type: 'SELECTED_WEEKDAYS',
    startDate: new Date().toISOString().slice(0, 10),
    weekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    intervalDays: null,
    targetCount: null,
    dueDate: null,
    customDescription: '',
  },
})

function fromHabit(habit: GrowthHabit): GrowthHabitInput {
  return {
    clientRequestId: crypto.randomUUID(),
    kind: habit.kind,
    lifeAreaId: habit.lifeAreaId,
    name: habit.name,
    purpose: habit.purpose,
    trackingMethod: habit.trackingMethod,
    targetValue: habit.targetValue,
    targetUnit: habit.targetUnit ?? '',
    cueNote: habit.cueNote,
    twoMinuteStarter: habit.twoMinuteStarter,
    preferredTime: habit.preferredTime,
    preferredPlace: habit.preferredPlace ?? '',
    precedingActivity: habit.precedingActivity ?? '',
    situation: habit.situation ?? '',
    fallbackPlan: habit.fallbackPlan,
    positionIndex: habit.positionIndex,
    schedule: habit.schedule,
  }
}

export function GrowthHabitDialog({
  open,
  areas,
  preferredAreaId = '',
  initial,
  onClose,
  onSaved,
}: {
  open: boolean
  areas: LifeArea[]
  preferredAreaId?: string
  initial?: GrowthHabit | null
  onClose: () => void
  onSaved: (habit: GrowthHabit) => Promise<void> | void
}) {
  const { token } = useAuth()
  const activeAreas = useMemo(
    () => areas.flatMap((area) => [area, ...area.subareas]).filter((area) => area.status === 'ACTIVE'),
    [areas],
  )
  const [form, setForm] = useState<GrowthHabitInput>(() =>
    initial ? fromHabit(initial) : blank(preferredAreaId || activeAreas[0]?.id || ''),
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const visibleScheduleTypes =
    form.kind === 'MILESTONE'
      ? (['ONE_TIME'] as ScheduleType[])
      : initial && !primaryScheduleTypes.includes(form.schedule.type)
        ? [...primaryScheduleTypes, form.schedule.type]
        : primaryScheduleTypes
  const visibleTracking =
    initial &&
    !tracking.some((option) => option.value === form.trackingMethod) &&
    form.trackingMethod !== 'MILESTONE'
      ? [...tracking, {
          value: form.trackingMethod,
          label: `${form.trackingMethod.toLowerCase().replace('_', ' ')} (existing)`,
        }]
      : tracking

  const setKind = (kind: 'GROWTH_HABIT' | 'MILESTONE') => {
    setForm({
      ...form,
      kind,
      trackingMethod: kind === 'MILESTONE' ? 'MILESTONE' : 'CHECKBOX',
      schedule: {
        ...form.schedule,
        type: kind === 'MILESTONE' ? 'ONE_TIME' : 'SELECTED_WEEKDAYS',
        weekdays: kind === 'MILESTONE' ? [] : form.schedule.weekdays,
      },
    })
  }

  const scheduleReady =
    Boolean(form.schedule.startDate) &&
    (form.schedule.type !== 'SELECTED_WEEKDAYS' || form.schedule.weekdays.length > 0) &&
    (!['TIMES_PER_WEEK', 'TIMES_PER_MONTH'].includes(form.schedule.type) ||
      (form.schedule.targetCount !== null && form.schedule.targetCount >= 1)) &&
    (form.schedule.type !== 'ONE_TIME' || Boolean(form.schedule.dueDate)) &&
    (form.schedule.type !== 'CUSTOM' || Boolean(form.schedule.customDescription?.trim()))
  const ready =
    Boolean(form.lifeAreaId && form.name.trim() && form.purpose.trim()) &&
    scheduleReady &&
    (!['DURATION', 'QUANTITY', 'VALUE'].includes(form.trackingMethod) ||
      Boolean(form.targetValue && form.targetUnit.trim()))

  const save = async () => {
    if (!token || !ready) return
    setSaving(true)
    setError('')
    const name = form.name.trim()
    const payload: GrowthHabitInput = {
      ...form,
      cueNote: form.cueNote.trim() || `Begin ${name.toLowerCase()} with one small action.`,
      twoMinuteStarter: form.twoMinuteStarter.trim() || `Do the smallest useful version of ${name.toLowerCase()}.`,
      fallbackPlan: form.fallbackPlan.trim() || 'If today becomes busy, continue at the next scheduled moment.',
    }
    try {
      const saved = initial
        ? await api.updateGrowthHabit(token, initial.id, payload)
        : await api.createGrowthHabit(token, payload)
      await onSaved(saved)
      onClose()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save this Growth Habit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Shape your Growth Habit' : 'Create a Growth Habit'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} pt={0.5}>
          <Typography color="text.secondary">
            Name what matters and choose when it belongs. Arohan handles the rest.
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={form.kind}
            onChange={(_, value) => value && setKind(value)}
          >
            <ToggleButton value="GROWTH_HABIT">Growth Habit</ToggleButton>
            <ToggleButton value="MILESTONE">Milestone</ToggleButton>
          </ToggleButtonGroup>
          <FormControl fullWidth>
            <InputLabel>Life Area</InputLabel>
            <Select
              label="Life Area"
              value={form.lifeAreaId}
              onChange={(event) => setForm({ ...form, lifeAreaId: event.target.value })}
            >
              {activeAreas.map((area) => (
                <MenuItem value={area.id} key={area.id}>
                  {area.parentId ? `↳ ${area.name}` : area.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={form.kind === 'MILESTONE' ? 'Milestone name' : 'Growth Habit name'}
            autoFocus
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <TextField
            label="Why does this matter?"
            multiline
            minRows={2}
            value={form.purpose}
            onChange={(event) => setForm({ ...form, purpose: event.target.value })}
          />
          {form.kind === 'GROWTH_HABIT' && (
            <FormControl fullWidth>
              <InputLabel>How will you recognize progress?</InputLabel>
              <Select
                label="How will you recognize progress?"
                value={form.trackingMethod}
                onChange={(event) => setForm({ ...form, trackingMethod: event.target.value as TrackingMethod })}
              >
                {visibleTracking.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {['DURATION', 'QUANTITY', 'VALUE'].includes(form.trackingMethod) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Target"
                type="number"
                value={form.targetValue ?? ''}
                onChange={(event) => setForm({ ...form, targetValue: Number(event.target.value) || null })}
              />
              <TextField
                label="Unit"
                placeholder="minutes, pages, glasses…"
                value={form.targetUnit}
                onChange={(event) => setForm({ ...form, targetUnit: event.target.value })}
                fullWidth
              />
            </Stack>
          )}
          <FormControl fullWidth>
            <InputLabel>Rhythm</InputLabel>
            <Select
              disabled={form.kind === 'MILESTONE'}
              label="Rhythm"
              value={form.schedule.type}
              onChange={(event) => setForm({
                ...form,
                schedule: { ...form.schedule, type: event.target.value as ScheduleType },
              })}
            >
              {visibleScheduleTypes.map((value) => (
                <MenuItem key={value} value={value}>{scheduleLabels[value]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {form.schedule.type === 'SELECTED_WEEKDAYS' && (
            <Box>
              <ToggleButtonGroup
                value={form.schedule.weekdays}
                onChange={(_, value) => setForm({ ...form, schedule: { ...form.schedule, weekdays: value } })}
                size="small"
                sx={{ flexWrap: 'wrap' }}
              >
                {days.map((day) => (
                  <ToggleButton value={day} key={day}>{day.slice(0, 3)}</ToggleButton>
                ))}
              </ToggleButtonGroup>
              {form.schedule.weekdays.length === 0 && (
                <Typography color="error" variant="caption">Choose at least one weekday.</Typography>
              )}
            </Box>
          )}
          {form.schedule.type === 'TIMES_PER_WEEK' && (
            <TextField
              label="Times each week"
              type="number"
              inputProps={{ min: 1, max: 7 }}
              value={form.schedule.targetCount ?? ''}
              onChange={(event) => setForm({
                ...form,
                schedule: { ...form.schedule, targetCount: Number(event.target.value) },
              })}
            />
          )}
          {form.schedule.type === 'ONE_TIME' && (
            <TextField
              label="Meaningful date"
              type="date"
              value={form.schedule.dueDate ?? ''}
              onChange={(event) => setForm({
                ...form,
                schedule: { ...form.schedule, dueDate: event.target.value },
              })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
          {form.schedule.type === 'CUSTOM' && (
            <TextField
              label="Describe your custom rhythm"
              multiline
              minRows={2}
              value={form.schedule.customDescription ?? ''}
              onChange={(event) => setForm({
                ...form,
                schedule: { ...form.schedule, customDescription: event.target.value },
              })}
            />
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Not now</Button>
        <Button variant="contained" disabled={!ready || saving} onClick={save}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create habit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
