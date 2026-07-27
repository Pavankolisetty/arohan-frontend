import {
  Box,
  Button,
  Dialog,
  DialogContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import AutoStoriesRounded from '@mui/icons-material/AutoStoriesRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CategoryRounded from '@mui/icons-material/CategoryRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import SpaRounded from '@mui/icons-material/SpaRounded'
import { useState } from 'react'

const pages = [
  {
    eyebrow: 'Your everyday starting point',
    title: 'Meet today without planning it again.',
    items: [
      { icon: HomeRounded, name: 'Home', note: 'See the next useful place to begin.' },
      { icon: CalendarMonthRounded, name: 'Today’s Rhythm', note: 'Mark each weekday habit done, partial or skipped.' },
    ],
  },
  {
    eyebrow: 'Shape what matters',
    title: 'Your starting structure is ready—and always editable.',
    items: [
      { icon: CategoryRounded, name: 'Life Areas', note: 'Add directions such as career, family or health.' },
      { icon: SpaRounded, name: 'Growth Habits', note: 'Create or adjust a simple repeating practice.' },
    ],
  },
  {
    eyebrow: 'Notice the bigger picture',
    title: 'Turn small updates into understandable patterns.',
    items: [
      { icon: AutoAwesomeRounded, name: 'Growth Studio', note: 'Compare rhythms across days and Life Areas.' },
      { icon: AccountBalanceWalletRounded, name: 'Financial Flow', note: 'Record money moments and review the month.' },
    ],
  },
  {
    eyebrow: 'Keep it personal',
    title: 'Reflect when useful. Change the atmosphere anytime.',
    items: [
      { icon: AutoStoriesRounded, name: 'Reflection Space', note: 'Keep short notes, lessons and weekly reviews.' },
      { icon: SettingsRounded, name: 'Settings', note: 'Adjust appearance, accessibility and preferences.' },
    ],
  },
] as const

export function QuickTour({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [page, setPage] = useState(0)
  const current = pages[page]

  const finish = () => {
    setPage(0)
    onClose()
  }

  return (
    <Dialog open={open} onClose={finish} fullWidth maxWidth="sm">
      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="overline" color="primary" fontWeight={800}>
                {current.eyebrow}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {page + 1} / {pages.length}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={((page + 1) / pages.length) * 100}
              sx={{ height: 6, borderRadius: 8 }}
            />
          </Stack>
          <Typography variant="h3">{current.title}</Typography>
          <Stack spacing={1.5}>
            {current.items.map(({ icon: Icon, name, note }) => (
              <Stack
                key={name}
                direction="row"
                spacing={2}
                sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 3 }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2.5,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'action.hover',
                    color: 'primary.main',
                    flexShrink: 0,
                  }}
                >
                  <Icon />
                </Box>
                <Box>
                  <Typography fontWeight={800}>{name}</Typography>
                  <Typography variant="body2" color="text.secondary">{note}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Button onClick={finish}>Skip tour</Button>
            <Button
              variant="contained"
              onClick={() => page === pages.length - 1 ? finish() : setPage(page + 1)}
            >
              {page === pages.length - 1 ? 'Start my rhythm' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
