import AccessibilityNewRounded from '@mui/icons-material/AccessibilityNewRounded'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import ContactSupportRounded from '@mui/icons-material/ContactSupportRounded'
import LanguageRounded from '@mui/icons-material/LanguageRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import PaletteRounded from '@mui/icons-material/PaletteRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type {
  DateFormatPreference,
  ThemePreference,
  TimeFormatPreference,
  WeekStart,
} from '../shared/types'

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          p: 1,
          borderRadius: 2.5,
          bgcolor: 'action.hover',
          color: 'primary.main',
          display: 'flex',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h3" fontSize={21}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.4}>
          {description}
        </Typography>
      </Box>
    </Stack>
  )
}

export function SettingsPage() {
  const { user, updatePreferences } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [timeZone, setTimeZone] = useState(user?.timeZone ?? 'UTC')
  const [locale, setLocale] = useState(user?.locale ?? 'en-IN')
  const [theme, setTheme] = useState<ThemePreference>(
    user?.themePreference ?? 'SYSTEM',
  )
  const [weekStart, setWeekStart] = useState<WeekStart>(
    user?.weekStart ?? 'MONDAY',
  )
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>(
    user?.dateFormat ?? 'AUTO',
  )
  const [timeFormat, setTimeFormat] = useState<TimeFormatPreference>(
    user?.timeFormat ?? 'SYSTEM',
  )
  const [reducedMotion, setReducedMotion] = useState(
    user?.reducedMotion ?? false,
  )
  const [enhancedContrast, setEnhancedContrast] = useState(
    user?.enhancedContrast ?? false,
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const formatPreview = useMemo(() => {
    const sample = new Date(2026, 6, 23, 18, 30)
    const date =
      dateFormat === 'ISO'
        ? '2026-07-23'
        : sample.toLocaleDateString(
            dateFormat === 'DAY_FIRST'
              ? 'en-GB'
              : dateFormat === 'MONTH_FIRST'
                ? 'en-US'
                : locale,
            { dateStyle: 'medium' },
          )
    const time = sample.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      ...(timeFormat === 'TWELVE_HOUR'
        ? { hour12: true }
        : timeFormat === 'TWENTY_FOUR_HOUR'
          ? { hour12: false }
          : {}),
    })
    return `${date} · ${time}`
  }, [dateFormat, locale, timeFormat])

  if (!user) return null

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await updatePreferences({
        displayName,
        timeZone,
        locale,
        themePreference: theme,
        weekStart,
        dateFormat,
        timeFormat,
        reducedMotion,
        enhancedContrast,
        onboardingComplete: true,
        starterTemplateKeys: user.starterTemplateKeys,
      })
      setSaved(true)
    } catch {
      setError(
        'We could not save these preferences. Check the time zone and try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container
      maxWidth="md"
      sx={{ py: { xs: 4, md: 7 }, px: { xs: 2, md: 5 } }}
    >
      <Typography variant="h1" fontSize={{ xs: 42, md: 58 }}>
        Settings
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Shape how Arohan fits your place, time and preferred atmosphere.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mt: 4 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={4}>
            <SectionTitle
              icon={<AccountCircleRounded />}
              title="Your account"
              description="The name Arohan uses when welcoming you."
            />
            <Stack spacing={2.5}>
              <TextField
                label="Display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                inputProps={{ maxLength: 80 }}
              />
              <TextField
                label="Email"
                value={user.email}
                disabled
                helperText="Email changes are not available in Phase 1."
              />
            </Stack>

            <Divider />

            <SectionTitle
              icon={<LanguageRounded />}
              title="Region and time"
              description="Make dates and daily boundaries feel familiar."
            />
            <Stack spacing={2.5}>
              <TextField
                label="Time zone"
                value={timeZone}
                onChange={(event) => setTimeZone(event.target.value)}
                helperText="IANA format, for example Asia/Kolkata"
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Language and region</InputLabel>
                  <Select
                    label="Language and region"
                    value={locale}
                    onChange={(event) => setLocale(event.target.value)}
                  >
                    <MenuItem value="en-IN">English (India)</MenuItem>
                    <MenuItem value="en-GB">English (United Kingdom)</MenuItem>
                    <MenuItem value="en-US">English (United States)</MenuItem>
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Date format</InputLabel>
                  <Select
                    label="Date format"
                    value={dateFormat}
                    onChange={(event) =>
                      setDateFormat(event.target.value as DateFormatPreference)
                    }
                  >
                    <MenuItem value="AUTO">Follow region</MenuItem>
                    <MenuItem value="DAY_FIRST">Day first</MenuItem>
                    <MenuItem value="MONTH_FIRST">Month first</MenuItem>
                    <MenuItem value="ISO">ISO · YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Time format</InputLabel>
                  <Select
                    label="Time format"
                    value={timeFormat}
                    onChange={(event) =>
                      setTimeFormat(event.target.value as TimeFormatPreference)
                    }
                  >
                    <MenuItem value="SYSTEM">Follow region</MenuItem>
                    <MenuItem value="TWELVE_HOUR">12-hour</MenuItem>
                    <MenuItem value="TWENTY_FOUR_HOUR">24-hour</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  FORMAT PREVIEW
                </Typography>
                <Typography fontWeight={750} mt={0.5}>
                  {formatPreview}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            <SectionTitle
              icon={<PaletteRounded />}
              title="Appearance"
              description="Choose a calm atmosphere that is comfortable to read."
            />
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                label="Theme"
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as ThemePreference)
                }
              >
                <MenuItem value="SYSTEM">Follow my device</MenuItem>
                <MenuItem value="LIGHT">Light</MenuItem>
                <MenuItem value="DARK">Dark</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <SectionTitle
              icon={<AccessibilityNewRounded />}
              title="Comfort and accessibility"
              description="Adjust visual movement and separation throughout Arohan."
            />
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={reducedMotion}
                    onChange={(event) => setReducedMotion(event.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={750}>Reduce motion</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Minimize transitions and non-essential movement.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={enhancedContrast}
                    onChange={(event) =>
                      setEnhancedContrast(event.target.checked)
                    }
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={750}>Stronger contrast</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Increase text clarity and visible card boundaries.
                    </Typography>
                  </Box>
                }
              />
            </Stack>

            <Divider />

            <SectionTitle
              icon={<AutoAwesomeRounded />}
              title="Your starting direction"
              description="Review the inspirations you chose when beginning Arohan."
            />
            <Box>
              <Button
                variant="outlined"
                onClick={() => navigate('/onboarding')}
              >
                Review starter inspirations
              </Button>
            </Box>

            <Divider />

            <SectionTitle
              icon={<ContactSupportRounded />}
              title="Support"
              description="A trusted path to help when something interrupts your growth."
            />
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                p: { xs: 2.5, sm: 3 },
                borderRadius: 4,
                border: 1,
                borderColor: 'divider',
                background:
                  'linear-gradient(135deg, rgba(47, 101, 80, 0.12), rgba(245, 201, 99, 0.16))',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  right: -55,
                  bottom: -85,
                  border: '24px solid',
                  borderColor: 'rgba(47, 101, 80, 0.08)',
                },
              }}
            >
              <Stack spacing={1.5} position="relative" zIndex={1}>
                <Chip
                  label="COMING SOON"
                  size="small"
                  color="primary"
                  sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
                />
                <Typography variant="h3" fontSize={{ xs: 24, sm: 28 }}>
                  Help, with a human heartbeat.
                </Typography>
                <Typography color="text.secondary" maxWidth={600}>
                  We are preparing a verified Arohan support address and a
                  simple help space. Until they are ready, no unofficial email
                  or contact link will be shown here.
                </Typography>
                <Button
                  disabled
                  startIcon={<MailOutlineRounded />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Support desk is growing
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Button
              variant="contained"
              onClick={save}
              disabled={saving || displayName.trim().length < 2}
              sx={{ alignSelf: 'flex-start' }}
            >
              {saving ? 'Saving…' : 'Save preferences'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message="Your Arohan preferences are saved."
      />
    </Container>
  )
}
