import { CircularProgress, CssBaseline, GlobalStyles, useMediaQuery } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { lazy, Suspense, useMemo } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { makeTheme } from './shared/theme'
import { AppShell } from './shell/AppShell'

const LoginPage = lazy(() =>
  import('./auth/AuthPages').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('./auth/AuthPages').then((module) => ({ default: module.RegisterPage })),
)
const HomePage = lazy(() =>
  import('./home/HomePage').then((module) => ({ default: module.HomePage })),
)
const OnboardingPage = lazy(() =>
  import('./onboarding/OnboardingPage').then((module) => ({
    default: module.OnboardingPage,
  })),
)
const SettingsPage = lazy(() =>
  import('./settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)
const LifeAreasPage = lazy(() =>
  import('./lifeareas/LifeAreasPage').then((module) => ({
    default: module.LifeAreasPage,
  })),
)
const LifeAreaDetailPage = lazy(() =>
  import('./lifeareas/LifeAreaDetailPage').then((module) => ({
    default: module.LifeAreaDetailPage,
  })),
)
const GrowthHabitsPage = lazy(() =>
  import('./habits/GrowthHabitsPage').then((module) => ({
    default: module.GrowthHabitsPage,
  })),
)
const TodayPage = lazy(() =>
  import('./tracking/TodayPage').then((module) => ({
    default: module.TodayPage,
  })),
)
const GrowthStudioPage = lazy(() =>
  import('./analytics/GrowthStudioPage').then((module) => ({
    default: module.GrowthStudioPage,
  })),
)
const FinancialFlowPage = lazy(() =>
  import('./finance/FinancialFlowPage').then((module) => ({
    default: module.FinancialFlowPage,
  })),
)
const FinancialInsightsPage = lazy(() =>
  import('./finance/FinancialInsightsPage').then((module) => ({
    default: module.FinancialInsightsPage,
  })),
)
const ReflectionSpacePage = lazy(() =>
  import('./reflection/ReflectionSpacePage').then((module) => ({
    default: module.ReflectionSpacePage,
  })),
)
const GrowthSignalsPage = lazy(() =>
  import('./signals/GrowthSignalsPage').then((module) => ({
    default: module.GrowthSignalsPage,
  })),
)

function RouteTree() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress aria-label="Loading Arohan" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  if (!user.onboardingComplete) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="life-areas" element={<LifeAreasPage />} />
        <Route path="life-areas/:id" element={<LifeAreaDetailPage />} />
        <Route path="growth-habits" element={<GrowthHabitsPage />} />
        <Route path="growth-studio" element={<GrowthStudioPage />} />
        <Route path="financial-flow" element={<FinancialFlowPage />} />
        <Route path="financial-flow/insights" element={<FinancialInsightsPage />} />
        <Route path="reflection-space" element={<ReflectionSpacePage />} />
        <Route path="growth-signals" element={<GrowthSignalsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ThemedApplication() {
  const { user } = useAuth()
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const mode =
    user?.themePreference === 'DARK'
      ? 'dark'
      : user?.themePreference === 'LIGHT'
        ? 'light'
        : systemDark
          ? 'dark'
          : 'light'
  const theme = useMemo(
    () => makeTheme(mode, user?.enhancedContrast),
    [mode, user?.enhancedContrast],
  )
  const motionStyles = {
    animationDuration: '0.01ms !important',
    animationIterationCount: '1 !important',
    transitionDuration: '0.01ms !important',
    scrollBehavior: 'auto !important',
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          '#root': { minHeight: '100dvh' },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': motionStyles,
          },
          ...(user?.reducedMotion
            ? { '*, *::before, *::after': motionStyles }
            : {}),
        }}
      />
      <Suspense
        fallback={
          <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
            <CircularProgress aria-label="Preparing your Arohan space" />
          </div>
        }
      >
        <RouteTree />
      </Suspense>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemedApplication />
      </AuthProvider>
    </BrowserRouter>
  )
}
