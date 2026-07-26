import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
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
  Step,
  StepLabel,
  Stepper,
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
  SELECTED_WEEKDAYS: 'Selected weekdays',
  ALTERNATE_DAYS: 'Alternate days',
  EVERY_N_DAYS: 'Every N days',
  TIMES_PER_WEEK: 'Flexible weekly target',
  TIMES_PER_MONTH: 'Times per month',
  ROTATION: 'Rotation',
  ONE_TIME: 'One time',
  CUSTOM: 'Custom rhythm',
}
const primaryScheduleTypes: ScheduleType[] = [
  'DAILY',
  'SELECTED_WEEKDAYS',
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
    type: 'DAILY',
    startDate: new Date().toISOString().slice(0, 10),
    weekdays: [],
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
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<GrowthHabitInput>(() =>
    initial
      ? fromHabit(initial)
      : blank(preferredAreaId || activeAreas[0]?.id || ''),
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
      ? [
          ...tracking,
          {
            value: form.trackingMethod,
            label: `${form.trackingMethod.toLowerCase().replace('_', ' ')} (existing)`,
          },
        ]
      : tracking

  const setKind = (kind: 'GROWTH_HABIT' | 'MILESTONE') => {
    setForm({
      ...form,
      kind,
      trackingMethod: kind === 'MILESTONE' ? 'MILESTONE' : 'CHECKBOX',
      schedule: {
        ...form.schedule,
        type: kind === 'MILESTONE' ? 'ONE_TIME' : 'DAILY',
      },
    })
  }
  const scheduleReady =
    Boolean(form.schedule.startDate) &&
    (form.schedule.type !== 'SELECTED_WEEKDAYS' || form.schedule.weekdays.length > 0) &&
    (!['ALTERNATE_DAYS', 'EVERY_N_DAYS', 'ROTATION'].includes(form.schedule.type) ||
      (form.schedule.intervalDays !== null && form.schedule.intervalDays >= 2)) &&
    (!['TIMES_PER_WEEK', 'TIMES_PER_MONTH'].includes(form.schedule.type) ||
      (form.schedule.targetCount !== null && form.schedule.targetCount >= 1)) &&
    (form.schedule.type !== 'ONE_TIME' || Boolean(form.schedule.dueDate)) &&
    (form.schedule.type !== 'CUSTOM' || Boolean(form.schedule.customDescription?.trim()))
  const canContinue =
    step === 0 ? Boolean(form.lifeAreaId && form.name.trim() && form.purpose.trim())
      : step === 1 ? scheduleReady
        : Boolean(form.cueNote.trim() && form.twoMinuteStarter.trim() && form.fallbackPlan.trim())

  const save = async () => {
    if (!token) return
    setSaving(true)
    setError('')
    try {
      const saved = initial
        ? await api.updateGrowthHabit(token, initial.id, form)
        : await api.createGrowthHabit(token, form)
      await onSaved(saved)
      onClose()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save this Growth Habit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initial ? 'Shape your Growth Habit' : 'Plant a new Growth Habit'}</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {['Direction', 'Rhythm', 'Easy Start Cue'].map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        {step === 0 && (
          <Stack spacing={2.3}>
            <ToggleButtonGroup exclusive fullWidth value={form.kind} onChange={(_, value) => value && setKind(value)}>
              <ToggleButton value="GROWTH_HABIT">Growth Habit</ToggleButton>
              <ToggleButton value="MILESTONE">Milestone</ToggleButton>
            </ToggleButtonGroup>
            <FormControl fullWidth>
              <InputLabel>Life Area</InputLabel>
              <Select label="Life Area" value={form.lifeAreaId} onChange={(event) => setForm({ ...form, lifeAreaId: event.target.value })}>
                {activeAreas.map((area) => <MenuItem value={area.id} key={area.id}>{area.parentId ? `↳ ${area.name}` : area.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label={form.kind === 'MILESTONE' ? 'Milestone name' : 'Growth Habit name'} autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <TextField label="Why does this matter—and who are you becoming?" multiline minRows={3} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} />
            {form.kind === 'GROWTH_HABIT' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>How will you recognize progress?</InputLabel>
                  <Select label="How will you recognize progress?" value={form.trackingMethod} onChange={(event) => setForm({ ...form, trackingMethod: event.target.value as TrackingMethod })}>
                    {visibleTracking.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </Select>
                </FormControl>
                {['DURATION', 'QUANTITY', 'VALUE'].includes(form.trackingMethod) && (
                  <Stack direction="row" spacing={2}>
                    <TextField label="Target" type="number" value={form.targetValue ?? ''} onChange={(event) => setForm({ ...form, targetValue: Number(event.target.value) || null })} />
                    <TextField label="Unit" placeholder="minutes, pages, glasses…" value={form.targetUnit} onChange={(event) => setForm({ ...form, targetUnit: event.target.value })} fullWidth />
                  </Stack>
                )}
              </>
            )}
          </Stack>
        )}
        {step === 1 && (
          <Stack spacing={2.3}>
            <Typography variant="h3" fontSize={24}>Choose a rhythm that can bend with real life.</Typography>
            <FormControl fullWidth>
              <InputLabel>Schedule</InputLabel>
              <Select disabled={form.kind === 'MILESTONE'} label="Schedule" value={form.schedule.type} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, type: event.target.value as ScheduleType } })}>
                {visibleScheduleTypes.map((value) => (
                  <MenuItem key={value} value={value}>
                    {scheduleLabels[value]}
                    {!primaryScheduleTypes.includes(value) && value !== 'ONE_TIME'
                      ? ' (existing)'
                      : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Begins" type="date" value={form.schedule.startDate} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, startDate: event.target.value } })} slotProps={{ inputLabel: { shrink: true } }} />
            {form.schedule.type === 'SELECTED_WEEKDAYS' && (
              <Box>
                <ToggleButtonGroup value={form.schedule.weekdays} onChange={(_, value) => setForm({ ...form, schedule: { ...form.schedule, weekdays: value } })} size="small" sx={{ flexWrap: 'wrap' }}>
                  {days.map((day) => <ToggleButton value={day} key={day}>{day.slice(0, 3)}</ToggleButton>)}
                </ToggleButtonGroup>
                {form.schedule.weekdays.length === 0 && (
                  <Typography color="error" variant="caption" display="block" mt={1}>
                    Choose at least one weekday to continue.
                  </Typography>
                )}
              </Box>
            )}
            {['ALTERNATE_DAYS', 'EVERY_N_DAYS', 'ROTATION'].includes(form.schedule.type) && (
              <TextField label="Repeat every how many days?" type="number" inputProps={{ min: 2, max: 365 }} value={form.schedule.intervalDays ?? 2} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, intervalDays: Number(event.target.value) } })} />
            )}
            {['TIMES_PER_WEEK', 'TIMES_PER_MONTH'].includes(form.schedule.type) && (
              <TextField label={form.schedule.type === 'TIMES_PER_WEEK' ? 'Times each week' : 'Times each month'} type="number" inputProps={{ min: 1, max: 31 }} value={form.schedule.targetCount ?? ''} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, targetCount: Number(event.target.value) } })} />
            )}
            {form.schedule.type === 'ONE_TIME' && (
              <TextField label="Meaningful date" type="date" value={form.schedule.dueDate ?? ''} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, dueDate: event.target.value } })} slotProps={{ inputLabel: { shrink: true } }} />
            )}
            {form.schedule.type === 'CUSTOM' && (
              <TextField label="Describe your custom rhythm" multiline minRows={3} value={form.schedule.customDescription ?? ''} onChange={(event) => setForm({ ...form, schedule: { ...form.schedule, customDescription: event.target.value } })} />
            )}
          </Stack>
        )}
        {step === 2 && (
          <Stack spacing={2.3}>
            <Alert icon={<AutoAwesomeRounded />} severity="success">
              Make beginning smaller than your resistance. The full habit can grow after you start.
            </Alert>
            <TextField label="Easy Start Cue" value={form.cueNote} onChange={(event) => setForm({ ...form, cueNote: event.target.value })} helperText="The tiny action that helps you begin—for example, open the book." />
            <TextField label="Two-minute starter" value={form.twoMinuteStarter} onChange={(event) => setForm({ ...form, twoMinuteStarter: event.target.value })} helperText="What version can you finish in about two minutes?" />
            <Typography fontWeight={800}>Give the cue a stable home</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Time (optional)" type="time" value={form.preferredTime ?? ''} onChange={(event) => setForm({ ...form, preferredTime: event.target.value || null })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Place (optional)" value={form.preferredPlace} onChange={(event) => setForm({ ...form, preferredPlace: event.target.value })} fullWidth />
            </Stack>
            <TextField label="After which activity?" placeholder="After I make morning tea…" value={form.precedingActivity} onChange={(event) => setForm({ ...form, precedingActivity: event.target.value })} />
            <TextField label="In which situation?" placeholder="When I close my laptop after work…" value={form.situation} onChange={(event) => setForm({ ...form, situation: event.target.value })} />
            <TextField label="If–then fallback plan" placeholder="If the planned moment passes, then I will do the two-minute version before bed." value={form.fallbackPlan} onChange={(event) => setForm({ ...form, fallbackPlan: event.target.value })} multiline minRows={2} />
          </Stack>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={step === 0 ? onClose : () => setStep(step - 1)} startIcon={step > 0 ? <ArrowBackRounded /> : undefined}>{step === 0 ? 'Not now' : 'Back'}</Button>
        <Box flex={1} />
        {step < 2 ? (
          <Button variant="contained" disabled={!canContinue} onClick={() => setStep(step + 1)} endIcon={<ArrowForwardRounded />}>Continue</Button>
        ) : (
          <Button variant="contained" disabled={!canContinue || saving} onClick={save}>{saving ? 'Planting…' : initial ? 'Save changes' : 'Plant Growth Habit'}</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
