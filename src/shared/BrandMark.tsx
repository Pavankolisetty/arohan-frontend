import { Box, Stack, Typography } from '@mui/material'

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box
        aria-hidden="true"
        sx={{
          width: 42,
          height: 42,
          borderRadius: '15px 15px 15px 5px',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
          transform: 'rotate(-3deg)',
          boxShadow: '0 8px 24px rgba(49,92,76,.22)',
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 48 48"
          sx={{ width: 31, height: 31, overflow: 'visible' }}
        >
          <path
            d="M9 36c7-1 9-7 13-12 4-5 9-7 17-14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M19 27c-6 .3-10-2.8-11-8.2 6-1 10.4 1.6 11 8.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M25 21c-.5-6.2 3.2-10.5 9.3-11.6.8 6.3-2.8 10.6-9.3 11.6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="39" cy="9" r="3.2" fill="#F3C96B" />
        </Box>
      </Box>
      {!compact && (
        <Box>
          <Typography
            variant="h6"
            component="span"
            sx={{ fontFamily: 'Georgia, serif', fontWeight: 700, lineHeight: 1 }}
          >
            Arohan
          </Typography>
          <Typography
            display="block"
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.35 }}
          >
            Rise gently. Grow meaningfully.
          </Typography>
        </Box>
      )}
    </Stack>
  )
}
