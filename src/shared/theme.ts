import { alpha, createTheme, type PaletteMode } from '@mui/material/styles'

export const colors = {
  forest: '#315C4C',
  forestDeep: '#1F4036',
  sage: '#A9C9B8',
  mint: '#DDEDE4',
  cream: '#F7F4EC',
  peach: '#F3C9AE',
  lavender: '#C9C3E8',
  sky: '#B9D7E5',
  gold: '#D9A94E',
}

export function makeTheme(mode: PaletteMode, enhancedContrast = false) {
  const dark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#8CC7AA' : colors.forest },
      secondary: { main: dark ? '#F3C9AE' : '#A35442' },
      background: {
        default: dark ? '#111A17' : colors.cream,
        paper: dark ? '#192520' : '#FFFDF8',
      },
      text: {
        primary: dark ? '#F0F5F1' : '#18342B',
        secondary: enhancedContrast
          ? dark
            ? '#E0EBE4'
            : '#354A41'
          : dark
            ? '#B6C8BF'
            : '#5C6F66',
      },
      divider: alpha(
        dark ? '#DDEDE4' : colors.forest,
        enhancedContrast ? 0.3 : 0.12,
      ),
    },
    typography: {
      fontFamily:
        '"Aptos", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
      h1: {
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontWeight: 600,
        letterSpacing: '-0.035em',
      },
      h2: {
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      button: { fontWeight: 700, textTransform: 'none' },
    },
    shape: { borderRadius: 18 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { minHeight: 46, borderRadius: 14, paddingInline: 20 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${alpha(
              dark ? '#DDEDE4' : colors.forest,
              enhancedContrast ? 0.28 : 0.1,
            )}`,
            boxShadow: dark
              ? '0 18px 50px rgba(0,0,0,.18)'
              : '0 18px 55px rgba(48,82,69,.08)',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            minWidth: 320,
            backgroundImage: dark
              ? 'radial-gradient(circle at 90% 0%, rgba(78,123,102,.14), transparent 35%)'
              : 'radial-gradient(circle at 90% 0%, rgba(169,201,184,.35), transparent 35%)',
          },
          '*:focus-visible': {
            outline: `3px solid ${alpha(colors.gold, 0.65)}`,
            outlineOffset: 2,
          },
        },
      },
    },
  })
}
