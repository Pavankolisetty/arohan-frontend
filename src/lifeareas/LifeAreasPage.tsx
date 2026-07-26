import AddRounded from '@mui/icons-material/AddRounded'
import ArchiveRounded from '@mui/icons-material/ArchiveRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import FavoriteRounded from '@mui/icons-material/FavoriteRounded'
import LocalFloristRounded from '@mui/icons-material/LocalFloristRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import PaletteRounded from '@mui/icons-material/PaletteRounded'
import PaymentsRounded from '@mui/icons-material/PaymentsRounded'
import PsychologyRounded from '@mui/icons-material/PsychologyRounded'
import RestoreRounded from '@mui/icons-material/RestoreRounded'
import WorkspacesRounded from '@mui/icons-material/WorkspacesRounded'
import {
  alpha,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ElementType } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../shared/api'
import type { LifeArea } from '../shared/types'
import { LifeAreaDialog } from './LifeAreaDialog'

const icons: Record<string, ElementType> = {
  growth: LocalFloristRounded,
  vitality: FavoriteRounded,
  stillness: PsychologyRounded,
  learning: MenuBookRounded,
  finance: PaymentsRounded,
  connection: WorkspacesRounded,
  craft: WorkspacesRounded,
  creative: PaletteRounded,
}

export function LifeAreasPage() {
  const { token } = useAuth()
  const client = useQueryClient()
  const [includeArchived, setIncludeArchived] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<LifeArea | null>(null)
  const [menu, setMenu] = useState<{ anchor: HTMLElement; area: LifeArea } | null>(null)
  const query = useQuery({
    queryKey: ['life-areas', includeArchived],
    queryFn: () => api.lifeAreas(token!, includeArchived),
    enabled: Boolean(token),
  })
  const refresh = () => client.invalidateQueries({ queryKey: ['life-areas'] })
  const action = useMutation({
    mutationFn: ({ area, next }: { area: LifeArea; next: 'archive' | 'restore' }) =>
      api.lifeAreaAction(token!, area.id, next),
    onSuccess: refresh,
  })
  const starters = useMutation({
    mutationFn: () => api.createStarterAreas(token!),
    onSuccess: refresh,
  })
  const areas = query.data ?? []

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 }, px: { xs: 2, md: 5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} mb={4}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight={800}>Your life, connected</Typography>
          <Typography variant="h1" fontSize={{ xs: 40, md: 56 }}>Life Areas</Typography>
          <Typography color="text.secondary" mt={1} maxWidth={650}>
            Give each meaningful part of life a visual home. Subareas keep detail connected without making your world feel fragmented.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => { setEditing(null); setDialog(true) }}>
          Create Life Area
        </Button>
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center">
          <Switch checked={includeArchived} onChange={(_, value) => setIncludeArchived(value)} />
          <Typography variant="body2">Show resting areas</Typography>
        </Stack>
        {areas.length === 0 && (
          <Button startIcon={<AutoAwesomeRounded />} onClick={() => starters.mutate()}>
            Grow from my starter inspirations
          </Button>
        )}
      </Stack>

      {query.isLoading ? (
        <Box minHeight={300} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
      ) : areas.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
          <LocalFloristRounded color="primary" sx={{ fontSize: 54 }} />
          <Typography variant="h3" mt={2}>Where would you like to feel more alive?</Typography>
          <Typography color="text.secondary" mt={1}>Begin with one area. Arohan will help the structure grow gently around you.</Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {areas.map((area) => {
            const Icon = icons[area.iconKey] ?? LocalFloristRounded
            return (
              <Card
                key={area.id}
                sx={{
                  overflow: 'hidden',
                  opacity: area.status === 'ARCHIVED' ? 0.65 : 1,
                  background: area.backgroundImageUrl
                    ? `linear-gradient(120deg, ${area.colorHex}EE, ${area.colorHex}99), url("${area.backgroundImageUrl}") center/cover`
                    : `radial-gradient(circle at 100% 0%, ${area.colorHex}38, transparent 42%), linear-gradient(145deg, ${area.colorHex}12, transparent 70%)`,
                }}
              >
                <CardActionArea component={Link} to={`/life-areas/${area.id}`}>
                  <CardContent sx={{ p: 3, minHeight: 235 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Box sx={{ width: 54, height: 54, borderRadius: 3.5, bgcolor: alpha(area.colorHex, 0.18), color: area.colorHex, display: 'grid', placeItems: 'center' }}>
                        <Icon />
                      </Box>
                      <IconButton
                        aria-label={`Options for ${area.name}`}
                        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setMenu({ anchor: event.currentTarget, area }) }}
                      >
                        <MoreHorizRounded />
                      </IconButton>
                    </Stack>
                    <Typography variant="h3" fontSize={25} mt={3}>{area.name}</Typography>
                    <Typography color="text.secondary" mt={1} sx={{ minHeight: 48 }}>{area.description || 'A space ready for your intention.'}</Typography>
                    <Stack direction="row" spacing={1} mt={2.5} flexWrap="wrap">
                      <Chip size="small" label={`${area.habitCount} Growth Habits`} />
                      <Chip size="small" label={`${area.subareas.length} subareas`} />
                      {area.status === 'ARCHIVED' && <Chip size="small" label="Resting" />}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            )
          })}
        </Box>
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setEditing(menu!.area); setDialog(true); setMenu(null) }}>
          <EditRounded fontSize="small" sx={{ mr: 1 }} /> Shape this area
        </MenuItem>
        <MenuItem onClick={() => { action.mutate({ area: menu!.area, next: menu!.area.status === 'ACTIVE' ? 'archive' : 'restore' }); setMenu(null) }}>
          {menu?.area.status === 'ACTIVE' ? <ArchiveRounded fontSize="small" sx={{ mr: 1 }} /> : <RestoreRounded fontSize="small" sx={{ mr: 1 }} />}
          {menu?.area.status === 'ACTIVE' ? 'Let this area rest' : 'Restore this area'}
        </MenuItem>
      </Menu>
      {dialog && <LifeAreaDialog open areas={areas} initial={editing} onClose={() => setDialog(false)} onSaved={refresh} />}
    </Container>
  )
}
