import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import ConstructionRounded from '@mui/icons-material/ConstructionRounded'
import SpaRounded from '@mui/icons-material/SpaRounded'
import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material'

const copy: Record<string, { eyebrow: string; description: string; phase: string }> = {
  'Today’s Rhythm': {
    eyebrow: 'A focused daily space',
    description:
      'Only the Growth Habits relevant to today will appear here, with gentle one- or two-tap updates.',
    phase: 'Daily tracking arrives in Phase 3',
  },
  'Life Areas': {
    eyebrow: 'Organize what matters',
    description:
      'Create your own connected areas of life, each with a meaningful color, icon and evolving rhythm.',
    phase: 'Life Areas arrive in Phase 2',
  },
  'Growth Habits': {
    eyebrow: 'Practices that shape identity',
    description:
      'Build flexible Growth Habits with a rhythm that fits your real week.',
    phase: 'Growth Habits arrive in Phase 2',
  },
  'Growth Studio': {
    eyebrow: 'See the story behind your effort',
    description:
      'Growth Pulse, Life Compass, Rhythm Map, Progress Story and Year in Bloom will turn real practice into transparent, useful perspective.',
    phase: 'Core visuals arrive in Phase 3',
  },
  'Financial Flow': {
    eyebrow: 'Kakeibo with reflection',
    description:
      'Understand income, Needs, Wants, Unexpected moments, Experiences, cash and savings without turning money into shame.',
    phase: 'Financial Flow arrives in Phase 4',
  },
  'Reflection Space': {
    eyebrow: 'Pause, notice and learn',
    description:
      'Keep quick notes and thoughtful reflections close to the Life Areas and Growth Habits they illuminate.',
    phase: 'Reflection Space arrives in Phase 5',
  },
  'Growth Signals': {
    eyebrow: 'Evidence you can understand',
    description:
      'See explainable patterns such as common completion times, recovery and recurring friction—with every insight linked to its evidence.',
    phase: 'Growth Signals mature in Phases 3 and 5',
  },
}

export function PlaceholderPage({ title }: { title: string }) {
  const content = copy[title]
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, px: { xs: 2, md: 5 } }}>
      <Chip icon={<ConstructionRounded />} label={content.phase} />
      <Typography variant="h1" fontSize={{ xs: 42, md: 64 }} mt={3}>
        {title}
      </Typography>
      <Typography variant="h5" color="primary" mt={1.5} fontWeight={700}>
        {content.eyebrow}
      </Typography>
      <Card sx={{ mt: 5, maxWidth: 820, overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
            <Box
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                display: 'flex',
              }}
            >
              {title === 'Growth Studio' ? <AutoAwesomeRounded /> : <SpaRounded />}
            </Box>
            <Box>
              <Typography fontSize={21} lineHeight={1.55}>
                {content.description}
              </Typography>
              <Typography color="text.secondary" mt={2}>
                This is a purposeful preview, not a screen filled with sample data.
                Arohan will show progress only when your own records can support it.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}
