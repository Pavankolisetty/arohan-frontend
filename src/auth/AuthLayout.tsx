import { Box, Chip, Container, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { BrandMark } from '../shared/BrandMark'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(360px, .85fr) 1.15fr' },
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          p: { md: 6, lg: 9 },
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'space-between',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 430,
            height: 430,
            border: '80px solid rgba(255,255,255,.07)',
            borderRadius: '50%',
            right: -170,
            bottom: -150,
          },
        }}
      >
        <BrandMark />
        <Stack spacing={3} sx={{ maxWidth: 540, zIndex: 1 }}>
          <Chip
            label="A cue-first way to grow"
            sx={{
              alignSelf: 'flex-start',
              color: 'inherit',
              bgcolor: 'rgba(255,255,255,.12)',
            }}
          />
          <Typography variant="h1" sx={{ fontSize: { md: 52, lg: 66 } }}>
            Meaningful change starts small.
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.78, fontWeight: 400 }}>
            Shape a rhythm that supports who you’re becoming—without pressure,
            perfection or another overwhelming list.
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ opacity: 0.7, zIndex: 1 }}>
          Let’s grow, one meaningful habit at a time.
        </Typography>
      </Box>
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          minHeight: '100dvh',
          alignItems: 'center',
          py: 5,
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: { md: 'none' }, mb: 5 }}>
            <BrandMark />
          </Box>
          {children}
        </Box>
      </Container>
    </Box>
  )
}

