import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AutoStoriesRounded from '@mui/icons-material/AutoStoriesRounded'
import FavoriteRounded from '@mui/icons-material/FavoriteRounded'
import LightbulbRounded from '@mui/icons-material/LightbulbRounded'
import PaletteRounded from '@mui/icons-material/PaletteRounded'
import SelfImprovementRounded from '@mui/icons-material/SelfImprovementRounded'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '../shared/BrandMark'
import type { ThemePreference, WeekStart } from '../shared/types'
import { useAuth } from '../auth/AuthContext'

const templates = [
  {
    key: 'WELLBEING',
    name: 'Everyday wellbeing',
    note: 'Gentle movement, hydration and rest',
    icon: FavoriteRounded,
    color: '#D8907D',
  },
  {
    key: 'MINDFULNESS',
    name: 'Inner stillness',
    note: 'Mindfulness, prayer and reflection',
    icon: SelfImprovementRounded,
    color: '#7E74B8',
  },
  {
    key: 'LEARNING',
    name: 'Curious mind',
    note: 'Reading and deliberate learning',
    icon: AutoStoriesRounded,
    color: '#4F89A5',
  },
  {
    key: 'FINANCIAL',
    name: 'Financial clarity',
    note: 'Mindful spending and saving',
    icon: AccountBalanceWalletRounded,
    color: '#B8872F',
  },
  {
    key: 'RELATIONSHIPS',
    name: 'Meaningful connection',
    note: 'Presence with people who matter',
    icon: LightbulbRounded,
    color: '#4E8669',
  },
  {
    key: 'CREATIVE',
    name: 'Creative expression',
    note: 'Make, play and explore ideas',
    icon: PaletteRounded,
    color: '#AD6686',
  },
] as const

export function OnboardingPage() {
  const { user, updatePreferences } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [timeZone, setTimeZone] = useState(
    user?.timeZone === 'UTC'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : (user?.timeZone ?? 'UTC'),
  )
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    user?.themePreference ?? 'SYSTEM',
  )
  const [weekStart, setWeekStart] = useState<WeekStart>(
    user?.weekStart ?? 'MONDAY',
  )
  const [selected, setSelected] = useState<string[]>(
    user?.starterTemplateKeys ?? [],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const title = useMemo(
    () =>
      [
        'Make Arohan feel like yours',
        'What would you like to nurture?',
        'Your space is ready to rise',
      ][step],
    [step],
  )

  if (!user) return null

  const finish = async () => {
    setSaving(true)
    setError('')
    try {
      await updatePreferences({
        displayName: displayName.trim(),
        timeZone,
        locale: user.locale,
        themePreference,
        weekStart,
        dateFormat: user.dateFormat,
        timeFormat: user.timeFormat,
        reducedMotion: user.reducedMotion,
        enhancedContrast: user.enhancedContrast,
        onboardingComplete: true,
        starterTemplateKeys: selected,
      })
      navigate('/', { replace: true })
    } catch {
      setError('Your choices could not be saved. Please check them and try again.')
      setSaving(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <BrandMark />
      <Box sx={{ mt: { xs: 5, md: 8 }, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" mb={1.5}>
          <Typography variant="overline" color="primary" fontWeight={800}>
            A gentle beginning
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step + 1} of 3
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={((step + 1) / 3) * 100}
          sx={{ height: 8, borderRadius: 8 }}
        />
      </Box>
      <Stack spacing={1} mb={4}>
        <Typography variant="h1" fontSize={{ xs: 38, md: 54 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" fontSize={17}>
          {step === 1
            ? 'Choose any starting points that feel useful. Nothing is required, and you can reshape them later.'
            : step === 2
              ? 'Arohan will begin quietly. Your first real Life Areas and Growth Habits are always yours to shape.'
              : 'A few preferences help your daily rhythm feel natural from the start.'}
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {step === 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <TextField
                label="Your name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                inputProps={{ maxLength: 80 }}
              />
              <TextField
                label="Time zone"
                value={timeZone}
                onChange={(event) => setTimeZone(event.target.value)}
                helperText="Use an IANA zone such as Asia/Kolkata"
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    label="Theme"
                    value={themePreference}
                    onChange={(event) =>
                      setThemePreference(event.target.value as ThemePreference)
                    }
                  >
                    <MenuItem value="SYSTEM">Follow my device</MenuItem>
                    <MenuItem value="LIGHT">Light</MenuItem>
                    <MenuItem value="DARK">Dark</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Week begins</InputLabel>
                  <Select
                    label="Week begins"
                    value={weekStart}
                    onChange={(event) =>
                      setWeekStart(event.target.value as WeekStart)
                    }
                  >
                    <MenuItem value="MONDAY">Monday</MenuItem>
                    <MenuItem value="SUNDAY">Sunday</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          {templates.map((template) => {
            const chosen = selected.includes(template.key)
            const Icon = template.icon
            return (
              <Card
                key={template.key}
                sx={{
                  borderColor: chosen ? template.color : 'divider',
                  borderWidth: chosen ? 2 : 1,
                }}
              >
                <CardActionArea
                  onClick={() =>
                    setSelected((current) =>
                      chosen
                        ? current.filter((key) => key !== template.key)
                        : [...current, template.key],
                    )
                  }
                  aria-pressed={chosen}
                  sx={{ height: '100%', p: 1 }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          bgcolor: `${template.color}20`,
                          color: template.color,
                          p: 1.25,
                          borderRadius: 3,
                          display: 'flex',
                        }}
                      >
                        <Icon />
                      </Box>
                      <Box flex={1}>
                        <Typography fontWeight={800}>{template.name}</Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {template.note}
                        </Typography>
                      </Box>
                      {chosen && <Chip size="small" label="Chosen" color="primary" />}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            )
          })}
        </Box>
      )}

      {step === 2 && (
        <Card
          sx={{
            overflow: 'hidden',
            background:
              'linear-gradient(135deg, rgba(169,201,184,.24), rgba(243,201,174,.18))',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={3}>
              <Typography variant="h3">A calm foundation, not a rigid plan.</Typography>
              <Typography color="text.secondary">
                You chose {selected.length || 'no'} starter
                {selected.length === 1 ? '' : 's'}. These are saved as inspiration;
                no habits will be created without you. Next, your Home will give you
                an honest starting view while Phase 2 opens Life Areas and Easy Start
                Cues.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selected.length ? (
                  selected.map((key) => (
                    <Chip
                      key={key}
                      label={templates.find((item) => item.key === key)?.name}
                    />
                  ))
                ) : (
                  <Chip label="Starting with a blank canvas" />
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack direction="row" justifyContent="space-between" mt={4}>
        <Button
          color="inherit"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          sx={{ visibility: step === 0 ? 'hidden' : 'visible' }}
        >
          Back
        </Button>
        {step < 2 ? (
          <Button
            variant="contained"
            onClick={() => setStep((current) => current + 1)}
            disabled={step === 0 && displayName.trim().length < 2}
          >
            Continue
          </Button>
        ) : (
          <Button variant="contained" onClick={finish} disabled={saving}>
            {saving ? 'Preparing your space…' : 'Enter Arohan'}
          </Button>
        )}
      </Stack>
    </Container>
  )
}
