import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import EnergySavingsLeafRounded from '@mui/icons-material/EnergySavingsLeafRounded'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import PsychologyAltOutlined from '@mui/icons-material/PsychologyAltOutlined'
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../shared/api'
import type { ExplainableGrowthSignal } from '../shared/types'

const toneColors = {
  sage: '#39745E',
  clay: '#B35F4D',
  gold: '#A87728',
  sky: '#477D9B',
}

const kindIcons = {
  RHYTHM: <AccessTimeRounded />,
  FRICTION: <PsychologyAltOutlined />,
  REFLECTION: <LocalOfferOutlined />,
  ASSOCIATION: <EnergySavingsLeafRounded />,
}

function fromDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days + 1)
  return date.toISOString().slice(0, 10)
}

function SignalDialog({
  signal,
  onClose,
}: {
  signal: ExplainableGrowthSignal | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(signal)} onClose={onClose} fullWidth maxWidth="sm">
      {signal && (
        <>
          <DialogTitle sx={{ pr: 7 }}>
            How this signal was noticed
            <IconButton onClick={onClose} sx={{ position: 'absolute', top: 10, right: 12 }}>
              <CloseRounded />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5}>
              <Box>
                <Chip label={signal.ready ? 'Pattern ready' : 'Still gathering'}
                  color={signal.ready ? 'success' : 'default'} size="small" />
                <Typography variant="h4" sx={{ mt: 1 }}>{signal.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>{signal.summary}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                <Typography variant="overline">EVIDENCE INCLUDED</Typography>
                <Typography>{signal.evidence}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {signal.sampleSize} observed · {signal.minimumSample} needed
                </Typography>
              </Box>
              <Box>
                <Typography variant="overline">THE RULE</Typography>
                <Typography>{signal.method}</Typography>
              </Box>
              {signal.evidenceItems.length > 0 && (
                <Box>
                  <Typography variant="overline">DATED MOMENTS</Typography>
                  <Stack spacing={1} sx={{ mt: 0.75 }}>
                    {signal.evidenceItems.map((item, index) => (
                      <Stack key={`${item.date}-${index}`} direction="row"
                        justifyContent="space-between" gap={2}
                        sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box>
                          <Typography variant="subtitle2">{item.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.date}</Typography>
                        </Box>
                        <Typography variant="body2">{item.detail}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
              {signal.kind === 'ASSOCIATION' && (
                <Alert severity="info">
                  This comparison shows two things appearing together. It does not mean one caused the other.
                </Alert>
              )}
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
  )
}

export function GrowthSignalsPage() {
  const { token } = useAuth()
  const [range, setRange] = useState(30)
  const [selected, setSelected] = useState<ExplainableGrowthSignal | null>(null)
  const query = useQuery({
    queryKey: ['growth-signals', range],
    queryFn: () =>
      api.explainableGrowthSignals(token!, {
        from: fromDate(range),
        to: new Date().toISOString().slice(0, 10),
      }),
    enabled: Boolean(token),
  })
  const readyCount = query.data?.signals.filter((signal) => signal.ready).length ?? 0

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 7 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between"
        alignItems={{ md: 'end' }} gap={3} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="overline">EVIDENCE, MADE UNDERSTANDABLE</Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '5rem' } }}>
            Growth Signals
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720, fontSize: '1.1rem' }}>
            Gentle observations drawn from your own moments—with the evidence and method always visible.
          </Typography>
        </Box>
        <ToggleButtonGroup exclusive value={range}
          onChange={(_, value) => value && setRange(value)} aria-label="Signal time range">
          <ToggleButton value={14}>14 days</ToggleButton>
          <ToggleButton value={30}>30 days</ToggleButton>
          <ToggleButton value={90}>90 days</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 6,
        p: { xs: 3, md: 4 },
        mb: 3,
        bgcolor: '#173F35',
        color: '#FFF9ED',
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          borderRadius: '50%',
          filter: 'blur(2px)',
          animation: 'signalGlow 5s ease-in-out infinite alternate',
        },
        '&::before': { width: 9, height: 9, bgcolor: '#F5C85D', right: '14%', top: '27%' },
        '&::after': { width: 6, height: 6, bgcolor: '#85C7B2', right: '25%', bottom: '24%', animationDelay: '1.2s' },
        '@keyframes signalGlow': {
          from: { opacity: 0.35, transform: 'scale(.8)' },
          to: { opacity: 1, transform: 'scale(1.7)' },
        },
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeRounded />
          <Typography variant="overline">SIGNAL LANTERN</Typography>
        </Stack>
        <Typography variant="h3" sx={{ mt: 1, maxWidth: 820 }}>
          {readyCount
            ? `${readyCount} ${readyCount === 1 ? 'pattern is' : 'patterns are'} ready to explore.`
            : 'Small moments are gathering into patterns.'}
        </Typography>
        <Typography sx={{ opacity: 0.75, mt: 1, maxWidth: 770 }}>
          Arohan waits for enough comparable evidence before lighting a signal. “Still gathering” is healthy—not a failure.
        </Typography>
      </Box>

      {query.isLoading ? (
        <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>
      ) : query.isError ? (
        <Alert severity="error">Growth Signals could not be gathered just now.</Alert>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { sm: 'repeat(2, 1fr)' },
            gap: 2.5,
          }}>
            {query.data?.signals.map((signal, index) => {
              const color = toneColors[signal.tone]
              const progress = Math.min(100, (signal.sampleSize / signal.minimumSample) * 100)
              return (
                <Card key={signal.key} variant="outlined" sx={{
                  minHeight: 250,
                  borderTop: `5px solid ${color}`,
                  transform: index % 2 ? 'translateY(14px)' : undefined,
                  transition: 'transform 240ms ease, box-shadow 240ms ease',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
                }}>
                  <CardActionArea onClick={() => setSelected(signal)} sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 3.5, height: '100%' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="start">
                        <Box sx={{
                          width: 46, height: 46, borderRadius: '50%', display: 'grid',
                          placeItems: 'center', color, bgcolor: alpha(color, 0.12),
                        }}>{kindIcons[signal.kind]}</Box>
                        <Chip size="small"
                          label={signal.ready ? 'Pattern ready' : `${signal.sampleSize}/${signal.minimumSample} gathered`}
                          sx={{ bgcolor: alpha(color, 0.1), color }} />
                      </Stack>
                      <Typography variant="h4" sx={{ mt: 2 }}>{signal.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>{signal.summary}</Typography>
                      {!signal.ready && (
                        <LinearProgress variant="determinate" value={progress} sx={{
                          mt: 2, height: 5, borderRadius: 4,
                          bgcolor: alpha(color, 0.1),
                          '& .MuiLinearProgress-bar': { bgcolor: color },
                        }} />
                      )}
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 2, color }}>
                        <HelpOutlineRounded fontSize="small" />
                        <Typography variant="subtitle2">See evidence and method</Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              )
            })}
          </Box>
          <Alert severity="info" icon={<EnergySavingsLeafRounded />} sx={{ mt: 5 }}>
            {query.data?.boundaryNote}
          </Alert>
          <Card variant="outlined" sx={{
            mt: 3, p: { xs: 3, md: 4 },
            background: (theme) => `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.09)}, transparent)`,
          }}>
            <Typography variant="overline">GIVE PATTERNS CONTEXT</Typography>
            <Typography variant="h4">A signal becomes more useful beside your own words.</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Add a short friction note, energy check-in, or tag in Reflection Space. Arohan counts only what you choose to record.
            </Typography>
            <Button component={RouterLink} to="/reflection-space" variant="outlined">
              Visit Reflection Space
            </Button>
          </Card>
        </>
      )}
      <SignalDialog signal={selected} onClose={() => setSelected(null)} />
    </Container>
  )
}
