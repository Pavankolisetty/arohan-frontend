import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import EnergySavingsLeafRounded from '@mui/icons-material/EnergySavingsLeafRounded'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import OpenInFullRounded from '@mui/icons-material/OpenInFullRounded'
import PushPinOutlined from '@mui/icons-material/PushPinOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  Alert,
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
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError, api } from '../shared/api'
import type {
  ReflectionEntry,
  ReflectionInput,
  ReflectionTag,
  ReflectionType,
} from '../shared/types'

const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const typeMeta: Record<ReflectionType, { label: string; prompt: string }> = {
  DAILY_NOTE: {
    label: 'Daily note',
    prompt: 'What feels worth remembering from today?',
  },
  HABIT_NOTE: {
    label: 'Habit reflection',
    prompt: 'What helped this practice begin—or made it harder?',
  },
  LIFE_AREA_NOTE: {
    label: 'Life Area note',
    prompt: 'What is changing in this part of your life?',
  },
  WEEKLY_REVIEW: {
    label: 'Weekly review',
    prompt: 'Notice the week without judging it.',
  },
}

const moodWords = ['Heavy', 'Tender', 'Even', 'Good', 'Bright']
const energyWords = ['Empty', 'Low', 'Steady', 'Ready', 'Full']
const memoryPaper = ['#FFF8E9', '#F7E5DC', '#EDF2E8', '#F2EAF4']
const memoryRotation = [-0.7, 0.5, -0.3, 0.4]

function emptyInput(): ReflectionInput {
  return {
    entryType: 'DAILY_NOTE',
    title: '',
    content: '',
    entryDate: today(),
    lifeAreaId: null,
    habitId: null,
    moodScore: null,
    energyScore: null,
    pinned: false,
    periodStart: daysAgo(6),
    periodEnd: today(),
    wins: '',
    friction: '',
    nextAdjustment: '',
    smallCommitment: '',
    tagIds: [],
  }
}

function fromEntry(entry: ReflectionEntry): ReflectionInput {
  return {
    entryType: entry.entryType,
    title: entry.title ?? '',
    content: entry.content ?? '',
    entryDate: entry.entryDate,
    lifeAreaId: entry.lifeAreaId,
    habitId: entry.habitId,
    moodScore: entry.moodScore,
    energyScore: entry.energyScore,
    pinned: entry.pinned,
    periodStart: entry.periodStart,
    periodEnd: entry.periodEnd,
    wins: entry.wins ?? '',
    friction: entry.friction ?? '',
    nextAdjustment: entry.nextAdjustment ?? '',
    smallCommitment: entry.smallCommitment ?? '',
    tagIds: entry.tags.map((tag) => tag.id),
  }
}

function CheckScale({
  label,
  words,
  value,
  onChange,
}: {
  label: string
  words: string[]
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label} <Typography component="span" color="text.secondary">(optional)</Typography>
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        {words.map((word, index) => {
          const score = index + 1
          return (
            <Chip
              key={word}
              label={word}
              clickable
              color={value === score ? 'primary' : 'default'}
              variant={value === score ? 'filled' : 'outlined'}
              onClick={() => onChange(value === score ? null : score)}
            />
          )
        })}
      </Stack>
    </Box>
  )
}

function ReflectionDialog({
  open,
  entry,
  tags,
  onClose,
}: {
  open: boolean
  entry: ReflectionEntry | null
  tags: ReflectionTag[]
  onClose: () => void
}) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ReflectionInput>(() =>
    entry ? fromEntry(entry) : emptyInput(),
  )
  const [tagName, setTagName] = useState('')
  const [error, setError] = useState('')
  const areas = useQuery({
    queryKey: ['life-areas'],
    queryFn: () => api.lifeAreas(token!),
    enabled: open && Boolean(token),
  })
  const habits = useQuery({
    queryKey: ['growth-habits'],
    queryFn: () => api.growthHabits(token!, { status: 'ACTIVE' }),
    enabled: open && Boolean(token),
  })
  const save = useMutation({
    mutationFn: () =>
      entry
        ? api.updateReflection(token!, entry.id, form)
        : api.createReflection(token!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] })
      onClose()
    },
    onError: (reason) =>
      setError(reason instanceof ApiError ? reason.message : 'Please try again.'),
  })
  const createTag = useMutation({
    mutationFn: () =>
      api.createReflectionTag(token!, {
        name: tagName,
        colorHex: '#9B6F8E',
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['reflection-tags'] })
      setForm((current) => ({
        ...current,
        tagIds: [...new Set([...current.tagIds, created.id])],
      }))
      setTagName('')
    },
  })
  const set = <K extends keyof ReflectionInput>(
    key: K,
    value: ReflectionInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 7 }}>
        {entry ? 'Shape this reflection' : 'Capture a quiet moment'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 12 }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            select
            label="Reflection style"
            value={form.entryType}
            onChange={(event) => set('entryType', event.target.value as ReflectionType)}
          >
            {Object.entries(typeMeta).map(([value, meta]) => (
              <MenuItem key={value} value={value}>{meta.label}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 190px' }, gap: 2 }}>
            <TextField label="Title (optional)" value={form.title}
              onChange={(event) => set('title', event.target.value)} />
            <TextField type="date" label="Date" value={form.entryDate}
              onChange={(event) => set('entryDate', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          {form.entryType !== 'WEEKLY_REVIEW' ? (
            <TextField
              multiline
              minRows={5}
              label={typeMeta[form.entryType].prompt}
              value={form.content}
              onChange={(event) => set('content', event.target.value)}
            />
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField type="date" label="Week begins" value={form.periodStart ?? ''}
                  onChange={(event) => set('periodStart', event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
                <TextField type="date" label="Week ends" value={form.periodEnd ?? ''}
                  onChange={(event) => set('periodEnd', event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <TextField multiline minRows={2} label="A win I want to remember"
                value={form.wins} onChange={(event) => set('wins', event.target.value)} />
              <TextField multiline minRows={2} label="Where did I meet friction?"
                value={form.friction} onChange={(event) => set('friction', event.target.value)} />
              <TextField multiline minRows={2} label="One adjustment for next week"
                value={form.nextAdjustment}
                onChange={(event) => set('nextAdjustment', event.target.value)} />
              <TextField label="One small commitment" value={form.smallCommitment}
                onChange={(event) => set('smallCommitment', event.target.value)} />
            </>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 2.5 }}>
            <CheckScale label="How did the day feel?" words={moodWords}
              value={form.moodScore} onChange={(value) => set('moodScore', value)} />
            <CheckScale label="Available energy" words={energyWords}
              value={form.energyScore} onChange={(value) => set('energyScore', value)} />
          </Box>
          {(form.entryType === 'LIFE_AREA_NOTE' || form.entryType === 'WEEKLY_REVIEW') && (
            <TextField select label="Life Area" value={form.lifeAreaId ?? ''}
              onChange={(event) => set('lifeAreaId', event.target.value || null)}>
              <MenuItem value="">No single Life Area</MenuItem>
              {(areas.data ?? []).map((area) => (
                <MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>
              ))}
            </TextField>
          )}
          {form.entryType === 'HABIT_NOTE' && (
            <TextField select label="Growth Habit" value={form.habitId ?? ''}
              onChange={(event) => {
                const habit = habits.data?.find((item) => item.id === event.target.value)
                setForm((current) => ({
                  ...current,
                  habitId: event.target.value || null,
                  lifeAreaId: habit?.lifeAreaId ?? null,
                }))
              }}>
              {(habits.data ?? []).map((habit) => (
                <MenuItem key={habit.id} value={habit.id}>{habit.name}</MenuItem>
              ))}
            </TextField>
          )}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Gentle tags</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {tags.map((tag) => (
                <Chip key={tag.id} label={tag.name} clickable
                  icon={<LocalOfferOutlined />}
                  variant={form.tagIds.includes(tag.id) ? 'filled' : 'outlined'}
                  sx={form.tagIds.includes(tag.id) ? {
                    bgcolor: alpha(tag.colorHex, 0.18),
                    color: 'text.primary',
                  } : undefined}
                  onClick={() => set('tagIds', form.tagIds.includes(tag.id)
                    ? form.tagIds.filter((id) => id !== tag.id)
                    : [...form.tagIds, tag.id])} />
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <TextField size="small" label="New tag" value={tagName}
                onChange={(event) => setTagName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && tagName.trim()) {
                    event.preventDefault()
                    createTag.mutate()
                  }
                }} />
              <Button variant="outlined" disabled={!tagName.trim() || createTag.isPending}
                onClick={() => createTag.mutate()}>Add tag</Button>
            </Stack>
          </Box>
          <FormControlLabel control={
            <Switch checked={form.pinned}
              onChange={(event) => set('pinned', event.target.checked)} />
          } label="Keep this reflection near the top" />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Not now</Button>
        <Button variant="contained" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? 'Saving…' : 'Save reflection'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function ReflectionSpacePage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [composer, setComposer] = useState<ReflectionEntry | 'new' | null>(null)
  const [viewing, setViewing] = useState<ReflectionEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReflectionEntry | null>(null)
  const entries = useQuery({
    queryKey: ['reflections', query, type],
    queryFn: () =>
      api.reflections(token!, {
        from: daysAgo(179),
        to: today(),
        query: query || undefined,
        type: type || undefined,
      }),
    enabled: Boolean(token),
  })
  const tags = useQuery({
    queryKey: ['reflection-tags'],
    queryFn: () => api.reflectionTags(token!),
    enabled: Boolean(token),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteReflection(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] })
      setDeleteTarget(null)
    },
  })
  const grouped = useMemo(() => {
    const result: Array<[string, ReflectionEntry[]]> = []
    const reflections = entries.data ?? []
    for (let index = 0; index < reflections.length; index += 3) {
      result.push([`memory-line-${index / 3 + 1}`, reflections.slice(index, index + 3)])
    }
    return result
  }, [entries.data])

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 7 } }}>
      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 5, md: 6 },
        p: { xs: 3, md: 4 },
        mb: 3,
        color: '#F8F2E7',
        bgcolor: '#234F42',
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '42% 58% 64% 36%',
          right: -32,
          top: -62,
          bgcolor: alpha('#E7BC66', 0.2),
          animation: 'reflectionDrift 8s ease-in-out infinite alternate',
        },
        '@keyframes reflectionDrift': {
          from: { transform: 'rotate(-6deg) translateY(0)' },
          to: { transform: 'rotate(10deg) translateY(16px)' },
        },
      }}>
        <Typography variant="overline">REFLECTION SPACE · PRIVATE BY DESIGN</Typography>
        <Typography variant="h1" sx={{
          fontSize: 'clamp(2.8rem, 5.2vw, 4.35rem)',
          lineHeight: 0.98,
          maxWidth: { xs: '100%', md: 'calc(100% - 280px)' },
          mt: 0.5,
        }}>
          A quiet place to notice.
        </Typography>
        <Typography sx={{ opacity: 0.82, maxWidth: 680, mt: 1.5, fontSize: '1.05rem' }}>
          Capture one honest moment now, or stay longer when the week has something to teach you.
        </Typography>
        <Button variant="contained" startIcon={<AddRounded />}
          onClick={() => setComposer('new')}
          sx={{ mt: 2.5, bgcolor: '#F3C968', color: '#173A31', '&:hover': { bgcolor: '#FFDA7B' } }}>
          Add a reflection
        </Button>
        <Box aria-hidden sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          width: 245,
          height: 170,
          right: 36,
          top: 70,
          zIndex: 1,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 17,
            left: 0,
            right: 0,
            borderTop: '2px solid rgba(248,242,231,.48)',
            transform: 'rotate(-3deg)',
          },
        }}>
          {['A small win', 'What felt true', 'Tomorrow, gently'].map((label, index) => (
            <Box key={label} sx={{
              position: 'absolute',
              width: 112,
              minHeight: 82,
              p: 1.25,
              top: 35 + (index % 2) * 42,
              left: index * 59,
              bgcolor: index === 1 ? '#F3D6C8' : '#F7EEDB',
              color: '#234238',
              borderRadius: index === 1 ? '4px 16px 5px 12px' : '5px 6px 15px 4px',
              boxShadow: '0 12px 22px rgba(6,28,22,.25)',
              transform: `rotate(${[-5, 4, -2][index]}deg)`,
              transformOrigin: '50% -14px',
              animation: `heroNoteSway ${5.5 + index}s ease-in-out ${index * 0.6}s infinite alternate`,
              '&::before': {
                content: '""',
                position: 'absolute',
                width: 8,
                height: 24,
                borderRadius: 5,
                bgcolor: '#D6AB58',
                top: -17,
                left: '50%',
                boxShadow: '0 1px 2px rgba(0,0,0,.25)',
              },
            }}>
              <Typography variant="overline" sx={{ fontSize: 8 }}>MEMORY</Typography>
              <Typography fontFamily="serif" fontWeight={700} lineHeight={1.12}>{label}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{
          '@keyframes heroNoteSway': {
            from: { translate: '0 0' },
            to: { translate: '0 6px' },
          },
        }} />
      </Box>

      <Box>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="overline">FIND A MOMENT</Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { md: 'minmax(260px, 1fr) 240px minmax(260px, .8fr)' },
                gap: 2,
                alignItems: 'center',
                mt: 1,
              }}>
                <TextField value={query} onChange={(event) => setQuery(event.target.value)}
                  label="Search your reflection cards" size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }} />
                <TextField select size="small" label="Reflection style" value={type}
                  onChange={(event) => setType(event.target.value)}>
                  <MenuItem value="">All reflections</MenuItem>
                  {Object.entries(typeMeta).map(([value, meta]) => (
                    <MenuItem key={value} value={value}>{meta.label}</MenuItem>
                  ))}
                </TextField>
                <Typography variant="body2" color="text.secondary">
                  Search stays inside your own reflections, so your private notes remain easy to revisit.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="overline">MEMORY LINE</Typography>
              <Typography variant="h4">Moments worth keeping close</Typography>
              <Typography color="text.secondary">
                Each reflection becomes a dated note on your growing line.
              </Typography>
            </Box>
            <Typography color="text.secondary">{entries.data?.length ?? 0} reflections</Typography>
          </Stack>
          {entries.isLoading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
          ) : entries.isError ? (
            <Alert severity="error">Your reflections could not be gathered just now.</Alert>
          ) : grouped.length === 0 ? (
            <Card variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
              <EnergySavingsLeafRounded color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h5" sx={{ mt: 1 }}>Your first thought can be very small.</Typography>
              <Typography color="text.secondary">A sentence, mood, or energy check-in is enough.</Typography>
            </Card>
          ) : (
            <Stack spacing={0.5}>
              {grouped.map(([date, dateEntries], lineIndex) => (
                <Box key={date} sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 2,
                  position: 'relative',
                  pt: 1,
                  pb: 1,
                }}>
                  <Typography variant="subtitle2" color="primary.main" sx={{
                    position: 'relative',
                    zIndex: 2,
                    justifySelf: 'start',
                    px: 1.25,
                    py: 0.35,
                    ml: 1,
                    borderRadius: 5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 3px 10px rgba(35,66,55,.08)',
                  }}>
                    Memory line {String(lineIndex + 1).padStart(2, '0')}
                  </Typography>
                  <Box component="svg" viewBox="0 0 1200 58"
                    preserveAspectRatio="none" aria-hidden sx={{
                      position: 'absolute',
                      zIndex: 0,
                      top: 35,
                      left: 5,
                      width: 'calc(100% - 10px)',
                      height: 58,
                      overflow: 'visible',
                    }}>
                    <path
                      d={lineIndex % 2
                        ? 'M4 17 C230 27 410 10 600 18 S970 29 1196 16'
                        : 'M4 20 C230 9 410 29 600 17 S970 9 1196 21'}
                      fill="none"
                      stroke="rgba(28,66,55,.12)"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    <path
                      d={lineIndex % 2
                        ? 'M4 17 C230 27 410 10 600 18 S970 29 1196 16'
                        : 'M4 20 C230 9 410 29 600 17 S970 9 1196 21'}
                      fill="none"
                      stroke="rgba(41,91,75,.62)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </Box>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr))',
                      lg: 'repeat(3, minmax(0, 1fr))',
                    },
                    gap: 2.25,
                    pt: 5.5,
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {dateEntries.map((entry, cardIndex) => {
                      const noteIndex = lineIndex * 3 + cardIndex
                      const baseRotation = memoryRotation[noteIndex % memoryRotation.length]
                      const paper = memoryPaper[noteIndex % memoryPaper.length]
                      const accent = entry.tags[0]?.colorHex ?? '#4E806A'
                      const hangOffset = [0, 12, 5][cardIndex % 3]
                      return (
                      <Card key={entry.id} variant="outlined" sx={{
                        position: 'relative',
                        overflow: 'visible',
                        height: 190,
                        mt: `${hangOffset}px`,
                        bgcolor: paper,
                        color: '#173B31',
                        border: 'none',
                        borderRadius: noteIndex % 3 === 0
                          ? '6px 22px 8px 15px'
                          : noteIndex % 3 === 1
                            ? '18px 5px 16px 7px'
                            : '5px 15px 5px 20px',
                        borderTop: `4px solid ${accent}`,
                        boxShadow: '0 13px 28px rgba(35,66,55,.14)',
                        transformOrigin: `50% -${48 + hangOffset}px`,
                        animation: `memorySway ${4.6 + (noteIndex % 3) * 0.5}s ease-in-out ${noteIndex * 0.28}s infinite alternate`,
                        transition: 'translate 220ms ease, box-shadow 220ms ease',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          width: 1.5,
                          height: 45 + hangOffset,
                          bgcolor: 'primary.main',
                          opacity: 0.5,
                          top: -(48 + hangOffset),
                          left: '50%',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          zIndex: 3,
                          width: 13,
                          height: 28,
                          borderRadius: '5px 5px 3px 3px',
                          bgcolor: '#C79B4B',
                          top: -13,
                          left: 'calc(50% - 6px)',
                          boxShadow: '0 2px 4px rgba(35,48,42,.28)',
                          border: '1px solid rgba(79,55,20,.2)',
                        },
                        '@keyframes memorySway': {
                          from: { rotate: `${baseRotation - 0.85}deg` },
                          to: { rotate: `${baseRotation + 0.85}deg` },
                        },
                        '&:hover': {
                          translate: '0 -7px',
                          boxShadow: '0 20px 34px rgba(35,66,55,.2)',
                        },
                      }}>
                        <CardContent sx={{
                          p: 2,
                          height: '100%',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          '& .MuiChip-root': { height: 25 },
                          '& .MuiTypography-body1': { fontSize: '0.9rem' },
                        }}>
                          <Typography variant="caption" sx={{
                            display: 'block',
                            mb: 0.75,
                            color: alpha('#173B31', 0.68),
                          }}>
                            {new Date(`${entry.entryDate}T12:00:00`).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short',
                            })}
                          </Typography>
                          <Stack direction="row" justifyContent="space-between" gap={2}>
                            <Box>
                              <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
                                <Chip size="small" label={typeMeta[entry.entryType].label}
                                  sx={{ bgcolor: alpha(accent, 0.13) }} />
                                {entry.lifeAreaName && <Chip size="small" variant="outlined" label={entry.lifeAreaName} />}
                                {entry.habitName && <Chip size="small" variant="outlined" label={entry.habitName} />}
                                {entry.pinned && <Tooltip title="Pinned reflection"><PushPinOutlined fontSize="small" /></Tooltip>}
                              </Stack>
                              {entry.title && <Typography variant="h5" sx={{
                                mt: 0.75,
                                fontFamily: 'serif',
                                fontSize: '1.35rem',
                                lineHeight: 1.1,
                              }}>{entry.title}</Typography>}
                            </Box>
                            <Stack direction="row" sx={{ mt: -1, mr: -1 }}>
                              <IconButton size="small" aria-label="Edit reflection" onClick={() => setComposer(entry)}>
                                <EditRounded />
                              </IconButton>
                              <IconButton size="small" aria-label="Delete reflection" onClick={() => setDeleteTarget(entry)}>
                                <DeleteOutlineRounded />
                              </IconButton>
                            </Stack>
                          </Stack>
                          {entry.content && <Typography sx={{
                            mt: 1,
                            whiteSpace: 'pre-wrap',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>{entry.content}</Typography>}
                          {entry.entryType === 'WEEKLY_REVIEW' && (
                            <Box sx={{
                              display: 'grid',
                              gridTemplateColumns: { md: '1fr 1fr' },
                              columnGap: 1.25,
                              rowGap: 0.25,
                              mt: 1,
                              maxHeight: 74,
                              overflow: 'hidden',
                              '& .MuiTypography-overline': { fontSize: '0.62rem', lineHeight: 1.2 },
                              '& .MuiTypography-body1': {
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                            }}>
                              {entry.wins && <Box><Typography variant="overline">WIN</Typography><Typography>{entry.wins}</Typography></Box>}
                              {entry.friction && <Box><Typography variant="overline">FRICTION</Typography><Typography>{entry.friction}</Typography></Box>}
                              {entry.nextAdjustment && <Box><Typography variant="overline">NEXT ADJUSTMENT</Typography><Typography>{entry.nextAdjustment}</Typography></Box>}
                              {entry.smallCommitment && <Box><Typography variant="overline">SMALL COMMITMENT</Typography><Typography>{entry.smallCommitment}</Typography></Box>}
                            </Box>
                          )}
                          <Stack direction="row" gap={0.6} sx={{
                            mt: 'auto',
                            pt: 0.75,
                            flexShrink: 0,
                            alignItems: 'center',
                            overflow: 'hidden',
                          }}>
                            {entry.moodScore && <Chip size="small" label={`Feel · ${moodWords[entry.moodScore - 1]}`} />}
                            {entry.energyScore && <Chip size="small" label={`Energy · ${energyWords[entry.energyScore - 1]}`} />}
                            {entry.tags.slice(0, 1).map((tag) => <Chip key={tag.id} size="small" label={`#${tag.name}`}
                              sx={{ bgcolor: alpha(tag.colorHex, 0.14) }} />)}
                            {entry.tags.length > 1 && <Chip size="small" label={`+${entry.tags.length - 1}`} />}
                            <Button size="small" startIcon={<OpenInFullRounded />}
                              onClick={() => setViewing(entry)}
                              sx={{ ml: 'auto', minWidth: 'fit-content', flexShrink: 0 }}>
                              Read
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                      )
                    })}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)}
        fullWidth maxWidth="md">
        {viewing && (
          <>
            <DialogTitle sx={{ pr: 7 }}>
              <Typography variant="overline">A MOMENT FROM YOUR MEMORY LINE</Typography>
              <Typography variant="h4" sx={{ fontFamily: 'serif' }}>
                {viewing.title || typeMeta[viewing.entryType].label}
              </Typography>
              <IconButton onClick={() => setViewing(null)}
                aria-label="Close reflection"
                sx={{ position: 'absolute', right: 14, top: 14 }}>
                <CloseRounded />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2.5}>
                <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
                  <Chip size="small" label={new Date(`${viewing.entryDate}T12:00:00`)
                    .toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                      year: 'numeric',
                    })} />
                  <Chip size="small" label={typeMeta[viewing.entryType].label} />
                  {viewing.lifeAreaName && <Chip size="small" variant="outlined"
                    label={viewing.lifeAreaName} />}
                  {viewing.habitName && <Chip size="small" variant="outlined"
                    label={viewing.habitName} />}
                  {viewing.pinned && <Chip size="small"
                    icon={<PushPinOutlined />} label="Pinned" />}
                </Stack>

                {viewing.content && (
                  <Typography sx={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '1.08rem',
                    lineHeight: 1.75,
                  }}>
                    {viewing.content}
                  </Typography>
                )}

                {viewing.entryType === 'WEEKLY_REVIEW' && (
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { sm: '1fr 1fr' },
                    gap: 2,
                  }}>
                    {viewing.wins && <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
                      <Typography variant="overline">WIN</Typography>
                      <Typography>{viewing.wins}</Typography>
                    </Box>}
                    {viewing.friction && <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
                      <Typography variant="overline">FRICTION</Typography>
                      <Typography>{viewing.friction}</Typography>
                    </Box>}
                    {viewing.nextAdjustment && <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
                      <Typography variant="overline">NEXT ADJUSTMENT</Typography>
                      <Typography>{viewing.nextAdjustment}</Typography>
                    </Box>}
                    {viewing.smallCommitment && <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
                      <Typography variant="overline">SMALL COMMITMENT</Typography>
                      <Typography>{viewing.smallCommitment}</Typography>
                    </Box>}
                  </Box>
                )}

                <Stack direction="row" gap={0.75} flexWrap="wrap">
                  {viewing.moodScore && <Chip
                    label={`Feeling · ${moodWords[viewing.moodScore - 1]}`} />}
                  {viewing.energyScore && <Chip
                    label={`Energy · ${energyWords[viewing.energyScore - 1]}`} />}
                  {viewing.tags.map((tag) => (
                    <Chip key={tag.id} label={`#${tag.name}`}
                      sx={{ bgcolor: alpha(tag.colorHex, 0.14) }} />
                  ))}
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setViewing(null)}>Close</Button>
              <Button variant="contained" startIcon={<EditRounded />}
                onClick={() => {
                  setComposer(viewing)
                  setViewing(null)
                }}>
                Edit reflection
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {composer && (
        <ReflectionDialog
          key={composer === 'new' ? 'new' : composer.id}
          open
          entry={composer === 'new' ? null : composer}
          tags={tags.data ?? []}
          onClose={() => setComposer(null)}
        />
      )}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Release this reflection?</DialogTitle>
        <DialogContent>
          <Typography>This permanently removes the reflection from your private timeline and future signals.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Keep it</Button>
          <Button color="error" disabled={remove.isPending}
            onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}>Delete reflection</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
