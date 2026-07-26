import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import {
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
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api, ApiError } from '../shared/api'
import type { LifeArea, LifeAreaInput } from '../shared/types'

const iconOptions = ['growth', 'vitality', 'stillness', 'learning', 'finance', 'connection', 'craft', 'creative']
const backgroundOptions = ['meadow', 'sunrise', 'dusk', 'open-sky', 'golden-flow', 'warmth', 'horizon', 'aurora']

export function LifeAreaDialog({
  open,
  areas,
  initial,
  parentId = null,
  onClose,
  onSaved,
}: {
  open: boolean
  areas: LifeArea[]
  initial?: LifeArea | null
  parentId?: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAuth()
  const [form, setForm] = useState<LifeAreaInput>(() =>
    initial
      ? {
          parentId: initial.parentId,
          name: initial.name,
          description: initial.description ?? '',
          colorHex: initial.colorHex,
          iconKey: initial.iconKey,
          backgroundKey: initial.backgroundKey,
          backgroundImageUrl: initial.backgroundImageUrl ?? '',
          desiredImportance: initial.desiredImportance,
          positionIndex: initial.positionIndex,
        }
      : {
          parentId,
          name: '',
          description: '',
          colorHex: '#4E8669',
          iconKey: 'growth',
          backgroundKey: 'meadow',
          backgroundImageUrl: '',
          desiredImportance: 3,
          positionIndex: areas.length,
        },
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const suggest = async () => {
    if (!token || !form.name.trim()) return
    const theme = await api.suggestAreaTheme(token, form.name)
    setForm((value) => ({ ...value, ...theme }))
  }

  const save = async () => {
    if (!token || !form.name.trim()) {
      setError('Give this Life Area a meaningful name.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (initial) await api.updateLifeArea(token, initial.id, form)
      else await api.createLifeArea(token, form)
      onSaved()
      onClose()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save this Life Area.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Shape this Life Area' : parentId ? 'Add a subarea' : 'Create a Life Area'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.3} pt={1}>
          <TextField
            autoFocus
            label="What part of life are you nurturing?"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            helperText="Examples: Physical vitality, Creative expression, Family"
          />
          <Button variant="outlined" startIcon={<AutoAwesomeRounded />} onClick={suggest}>
            Suggest a visual identity
          </Button>
          <TextField
            label="What would growth here feel like?"
            multiline
            minRows={2}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          {!parentId && (
            <FormControl fullWidth>
              <InputLabel>Place inside another area (optional)</InputLabel>
              <Select
                label="Place inside another area (optional)"
                value={form.parentId ?? ''}
                onChange={(event) => setForm({ ...form, parentId: event.target.value || null })}
              >
                <MenuItem value="">Top-level Life Area</MenuItem>
                {areas.filter((area) => area.id !== initial?.id && area.status === 'ACTIVE').map((area) => (
                  <MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Color"
              type="color"
              value={form.colorHex}
              onChange={(event) => setForm({ ...form, colorHex: event.target.value })}
              sx={{ minWidth: 120 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth>
              <InputLabel>Symbol</InputLabel>
              <Select
                label="Symbol"
                value={form.iconKey}
                onChange={(event) => setForm({ ...form, iconKey: event.target.value })}
              >
                {iconOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Atmosphere</InputLabel>
              <Select
                label="Atmosphere"
                value={form.backgroundKey}
                onChange={(event) => setForm({ ...form, backgroundKey: event.target.value })}
              >
                {backgroundOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Box>
            <Typography gutterBottom>How important is this area right now? {form.desiredImportance}/5</Typography>
            <Slider
              min={1}
              max={5}
              marks
              value={form.desiredImportance}
              onChange={(_, value) => setForm({ ...form, desiredImportance: value as number })}
            />
          </Box>
          <TextField
            label="Optional background image URL"
            value={form.backgroundImageUrl}
            onChange={(event) => setForm({ ...form, backgroundImageUrl: event.target.value })}
          />
          {error && <Typography color="error">{error}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Not now</Button>
        <Button variant="contained" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create Life Area'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
