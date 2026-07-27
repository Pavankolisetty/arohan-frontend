import AddRounded from '@mui/icons-material/AddRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CategoryRounded from '@mui/icons-material/CategoryRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import SpaRounded from '@mui/icons-material/SpaRounded'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../shared/api'

const areaSeeds = [
  { name: 'Wellbeing', color: '#D8907D', icon: '✦' },
  { name: 'Inner life', color: '#7E74B8', icon: '◌' },
  { name: 'Learning', color: '#4F89A5', icon: '⌁' },
]

export function HomePage() {
  const { user, token } = useAuth()
  const today = useQuery({
    queryKey: ['today-rhythm', 'home'],
    queryFn: () => api.todayRhythm(token!),
    enabled: Boolean(token),
  })
  const studio = useQuery({
    queryKey: ['growth-studio', 'home'],
    queryFn: () => api.growthStudio(token!),
    enabled: Boolean(token),
  })
  const lifeAreas = useQuery({
    queryKey: ['life-areas', false],
    queryFn: () => api.lifeAreas(token!),
    enabled: Boolean(token),
  })
  const now = new Date()
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const formattedDate =
    user?.dateFormat === 'ISO'
      ? now.toISOString().slice(0, 10)
      : now.toLocaleDateString(
          user?.dateFormat === 'DAY_FIRST'
            ? 'en-GB'
            : user?.dateFormat === 'MONTH_FIRST'
              ? 'en-US'
              : user?.locale,
          { weekday: 'long', month: 'long', day: 'numeric' },
        )
  const todayTotal = today.data?.habits.length ?? 0
  const todaySettled =
    (today.data?.completedCount ?? 0) + (today.data?.partialCount ?? 0)
  const todayProgress = todayTotal ? (todaySettled / todayTotal) * 100 : 0
  const consistency = studio.data?.counts.consistencyPercent
  const displayedAreas =
    lifeAreas.data?.slice(0, 3).map((area) => ({
      name: area.name,
      color: area.colorHex,
      icon: '✦',
      detail: `${area.habitCount} Growth Habits`,
    })) ?? areaSeeds.map((area) => ({ ...area, detail: 'Starter inspiration' }))

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 5 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography color="text.secondary" mb={0.5}>
            {formattedDate}
          </Typography>
          <Typography variant="h1" fontSize={{ xs: 38, md: 52 }}>
            {greeting}, {user?.displayName.split(' ')[0]}.
          </Typography>
          <Typography color="text.secondary" mt={1}>
            There is no need to rush. Let’s find one meaningful next step.
          </Typography>
        </Box>
        <Button component={Link} to="/growth-habits" variant="contained" startIcon={<AddRounded />}>
          Add a Growth Habit
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.4fr .8fr' },
          gap: 2.5,
        }}
      >
        <Card
          sx={{
            color: '#F5FBF7',
            bgcolor: '#315C4C',
            minHeight: 270,
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: '50%',
              border: '45px solid rgba(255,255,255,.06)',
              right: -55,
              top: -75,
            },
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Chip
                icon={<AutoAwesomeRounded />}
                label="Growth Pulse"
                sx={{ bgcolor: 'rgba(255,255,255,.12)', color: 'inherit' }}
              />
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {studio.data ? `${studio.data.from} — ${studio.data.to}` : 'YOUR BEGINNING'}
              </Typography>
            </Stack>
            <Typography variant="h2" fontSize={{ xs: 30, md: 38 }} mt={4} maxWidth={600}>
              {consistency === undefined
                ? 'Your growth story begins with real moments—not made-up scores.'
                : `${consistency}% consistency across ${studio.data?.counts.eligible} real opportunities.`}
            </Typography>
            <Typography sx={{ opacity: 0.75, mt: 2, maxWidth: 570 }}>
              {studio.data?.progressStory.nextExperiment ??
                'Record practice in Today’s Rhythm and this space will reflect consistency, recovery and momentum with evidence you can open.'}
            </Typography>
            <Button
              component={Link}
              to="/growth-studio"
              color="inherit"
              endIcon={<ArrowForwardRounded />}
              sx={{ mt: 2.5, px: 0 }}
            >
              Open Growth Studio
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="overline" color="primary" fontWeight={800}>
                  Today’s Rhythm
                </Typography>
                <Typography variant="h3" fontSize={24} mt={0.5}>
                  {todayTotal
                    ? `${todaySettled} of ${todayTotal} moments met`
                    : 'A blank day can be a beginning.'}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  display: 'grid',
                  placeItems: 'center',
                  color: 'primary.main',
                }}
              >
                <CalendarMonthRounded />
              </Box>
            </Stack>
            <Typography color="text.secondary" mt={2}>
              Only Growth Habits that are genuinely due or available by a flexible
              rhythm appear here.
            </Typography>
            <LinearProgress
              variant="determinate"
              value={todayProgress}
              sx={{ mt: 3, height: 8, borderRadius: 9 }}
            />
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              {todayTotal
                ? `${today.data?.remainingCount ?? 0} remaining today`
                : 'No scheduled opportunities today'}
            </Typography>
            <Button component={Link} to="/today" sx={{ mt: 1, px: 0 }}>
              Open Today’s Rhythm
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ gridColumn: { lg: '1 / -1' } }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={1}
              mb={3}
            >
              <Box>
                <Typography variant="overline" color="primary" fontWeight={800}>
                  Life Areas
                </Typography>
                <Typography variant="h3" fontSize={25}>
                  The parts of life you want to nurture
                </Typography>
              </Box>
              <Button component={Link} to="/life-areas" endIcon={<ArrowForwardRounded />}>
                Explore Life Areas
              </Button>
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              {displayedAreas.map((area) => (
                <Box
                  key={area.name}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    border: '1px dashed',
                    borderColor: 'divider',
                    bgcolor: `${area.color}0D`,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3,
                        bgcolor: `${area.color}22`,
                        color: area.color,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 22,
                      }}
                    >
                      {area.icon}
                    </Box>
                    <Box>
                      <Typography fontWeight={800}>{area.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {area.detail}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <MenuBookRounded color="primary" />
              <Box>
                <Typography variant="overline">REFLECTION SPACE</Typography>
                <Typography variant="h5">Hold today in a few words.</Typography>
              </Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              A sentence, feeling, or energy check-in is enough. Your reflections stay connected to their real date.
            </Typography>
            <Button component={Link} to="/reflection-space" sx={{ mt: 1.5, px: 0 }}>
              Add a reflection
            </Button>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AccountBalanceWalletRounded color="primary" />
              <Box>
                <Typography variant="overline">FINANCIAL FLOW</Typography>
                <Typography variant="h5">Give money a clear, calm direction.</Typography>
              </Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Record income, spending and savings, then see how the month is taking shape.
            </Typography>
            <Button component={Link} to="/financial-flow" sx={{ mt: 1.5, px: 0 }}>
              Open Financial Flow
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Stack direction="row" spacing={1} mt={3} alignItems="center">
        <CategoryRounded color="primary" fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          Every insight is based on your own dated evidence and shows its method.
        </Typography>
        <IconButton size="small" component={Link} to="/growth-habits" aria-label="Learn about Growth Habits">
          <SpaRounded fontSize="small" />
        </IconButton>
      </Stack>
    </Container>
  )
}
