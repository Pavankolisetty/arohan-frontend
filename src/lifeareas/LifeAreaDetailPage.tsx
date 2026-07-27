import AddRounded from '@mui/icons-material/AddRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import LocalFloristRounded from '@mui/icons-material/LocalFloristRounded'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../shared/api'
import { LifeAreaDialog } from './LifeAreaDialog'

export function LifeAreaDetailPage() {
  const { id = '' } = useParams()
  const { token } = useAuth()
  const client = useQueryClient()
  const [areaDialog, setAreaDialog] = useState(false)
  const [subareaDialog, setSubareaDialog] = useState(false)
  const query = useQuery({ queryKey: ['life-area', id], queryFn: () => api.lifeArea(token!, id), enabled: Boolean(token && id) })
  const habits = useQuery({ queryKey: ['growth-habits', id], queryFn: () => api.growthHabits(token!, { lifeAreaId: id }), enabled: Boolean(token && id) })
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['life-area', id] })
    client.invalidateQueries({ queryKey: ['life-areas'] })
  }
  if (query.isLoading || !query.data) return <Box minHeight="70vh" display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
  const area = query.data
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 5 } }}>
      <IconButton component={Link} to="/life-areas" aria-label="Back to Life Areas"><ArrowBackRounded /></IconButton>
      <Box sx={{ mt: 2, p: { xs: 3, md: 5 }, borderRadius: 5, background: `radial-gradient(circle at 90% 10%, ${area.colorHex}55, transparent 38%), ${area.colorHex}12` }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Chip label={`${area.desiredImportance}/5 importance right now`} sx={{ color: area.colorHex }} />
            <Typography variant="h1" fontSize={{ xs: 40, md: 58 }} mt={2}>{area.name}</Typography>
            <Typography color="text.secondary" mt={1} maxWidth={650}>{area.description || 'A meaningful direction waiting to be shaped.'}</Typography>
          </Box>
          <Button startIcon={<EditRounded />} onClick={() => setAreaDialog(true)}>Shape area</Button>
        </Stack>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mt={4} mb={2}>
        <Box><Typography variant="h3">Subareas</Typography><Typography color="text.secondary">Smaller directions that remain connected to the whole.</Typography></Box>
        <Button startIcon={<AddRounded />} onClick={() => setSubareaDialog(true)}>Add subarea</Button>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
        {area.subareas.map((subarea) => <Card key={subarea.id}><CardContent><Stack direction="row" spacing={1.5}><LocalFloristRounded sx={{ color: subarea.colorHex }} /><Box><Typography fontWeight={800}>{subarea.name}</Typography><Typography variant="body2" color="text.secondary">{subarea.description || 'Ready to grow.'}</Typography></Box></Stack></CardContent></Card>)}
        {area.subareas.length === 0 && <Typography color="text.secondary">No subareas yet—and that is perfectly fine.</Typography>}
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mt={5} mb={2}>
        <Box><Typography variant="h3">Growth Habits</Typography><Typography color="text.secondary">Small rhythms connected to this part of life.</Typography></Box>
        <Button component={Link} to={`/growth-habits?area=${area.id}`} variant="contained" startIcon={<AddRounded />}>Create a Growth Habit</Button>
      </Stack>
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {(habits.data ?? []).map((habit) => <Card key={habit.id}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={800}>{habit.name}</Typography><Typography variant="body2" color="text.secondary">{habit.purpose}</Typography></Box><Chip label={habit.status.toLowerCase()} /></Stack></CardContent></Card>)}
        {habits.data?.length === 0 && <Typography color="text.secondary">This area has no Growth Habits yet.</Typography>}
      </Box>
      {areaDialog && <LifeAreaDialog open areas={[area]} initial={area} onClose={() => setAreaDialog(false)} onSaved={refresh} />}
      {subareaDialog && <LifeAreaDialog open areas={[area]} parentId={area.id} onClose={() => setSubareaDialog(false)} onSaved={refresh} />}
    </Container>
  )
}
