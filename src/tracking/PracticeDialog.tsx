import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { PracticeInput, TodayHabit, TrackingStatus } from '../shared/types'

export function PracticeDialog({
  habit,
  saving,
  error,
  onClose,
  onSave,
}: {
  habit: TodayHabit
  saving: boolean
  error: string
  onClose: () => void
  onSave: (input: PracticeInput) => void
}) {
  const [form, setForm] = useState<PracticeInput>({
    status: habit.entry?.status ?? 'COMPLETED',
    actualValue: habit.entry?.actualValue ?? null,
    qualityRating: habit.entry?.qualityRating ?? null,
    reflection: habit.entry?.reflection ?? '',
    frictionNote: habit.entry?.frictionNote ?? '',
  })
  const measured = ['DURATION', 'QUANTITY', 'VALUE'].includes(habit.trackingMethod)

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Reflect on {habit.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={form.status}
            onChange={(_, value: TrackingStatus | null) =>
              value && setForm({ ...form, status: value })
            }
          >
            <ToggleButton value="COMPLETED">Completed</ToggleButton>
            <ToggleButton value="PARTIAL">Partial</ToggleButton>
            <ToggleButton value="SKIPPED">Skipped</ToggleButton>
          </ToggleButtonGroup>
          {measured && form.status !== 'SKIPPED' && (
            <TextField
              label={`Actual ${habit.targetUnit ?? 'value'}`}
              type="number"
              value={form.actualValue ?? ''}
              onChange={(event) =>
                setForm({
                  ...form,
                  actualValue:
                    event.target.value === '' ? null : Number(event.target.value),
                })
              }
              helperText={
                habit.targetValue
                  ? `Your intended practice is ${habit.targetValue} ${habit.targetUnit ?? ''}.`
                  : undefined
              }
            />
          )}
          {form.status !== 'SKIPPED' && (
            <Stack>
              <Typography fontWeight={750}>How did the practice feel? (optional)</Typography>
              <Rating
                value={form.qualityRating}
                onChange={(_, value) => setForm({ ...form, qualityRating: value })}
                size="large"
              />
              <Typography variant="caption" color="text.secondary">
                This describes the practice—not you.
              </Typography>
            </Stack>
          )}
          <TextField
            label="A small reflection (optional)"
            multiline
            minRows={3}
            value={form.reflection}
            onChange={(event) => setForm({ ...form, reflection: event.target.value })}
            placeholder="What helped, changed or felt meaningful?"
          />
          {(form.status === 'PARTIAL' || form.status === 'SKIPPED') && (
            <TextField
              label="What created friction? (optional)"
              value={form.frictionNote}
              onChange={(event) => setForm({ ...form, frictionNote: event.target.value })}
              placeholder="For example: low time, changed location, interruption"
            />
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={saving}>Not now</Button>
        <Button variant="contained" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save this moment'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
