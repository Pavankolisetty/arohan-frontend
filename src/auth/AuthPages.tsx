import { zodResolver } from '@hookform/resolvers/zod'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../shared/api'
import { useAuth } from './AuthContext'
import { AuthLayout } from './AuthLayout'

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})
type LoginInput = z.infer<typeof loginSchema>

const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Tell us what to call you.').max(80),
    email: z.email('Enter a valid email address.'),
    password: z
      .string()
      .min(10, 'Use at least 10 characters.')
      .max(72, 'Use no more than 72 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The passwords do not match.',
  })
type RegisterInput = z.infer<typeof registerSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const submit = async (values: LoginInput) => {
    setServerError('')
    try {
      const user = await login(values.email, values.password)
      navigate(user.onboardingComplete ? '/' : '/onboarding', { replace: true })
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'We could not sign you in. Please try again.',
      )
    }
  }

  return (
    <AuthLayout>
      <Stack spacing={3} component="form" onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={1}>
          <Typography variant="h2" fontSize={{ xs: 38, sm: 46 }}>
            Welcome back
          </Typography>
          <Typography color="text.secondary">
            Return to the rhythm you’re building.
          </Typography>
        </Stack>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Opening your space…' : 'Continue to Arohan'}
        </Button>
        <Typography textAlign="center" color="text.secondary">
          New here?{' '}
          <Link component={RouterLink} to="/register" fontWeight={700}>
            Begin your growth
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const submit = async (values: RegisterInput) => {
    setServerError('')
    try {
      await register(values.displayName, values.email, values.password)
      navigate('/onboarding', { replace: true })
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'We could not create your space. Please try again.',
      )
    }
  }

  return (
    <AuthLayout>
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={1}>
          <Typography variant="h2" fontSize={{ xs: 36, sm: 44 }}>
            Start where you are
          </Typography>
          <Typography color="text.secondary">
            Create a calm space for the person you’re becoming.
          </Typography>
        </Stack>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Controller
          name="displayName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="What should we call you?"
              autoComplete="name"
              error={Boolean(errors.displayName)}
              helperText={errors.displayName?.message}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message ?? 'At least 10 characters'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Confirm password"
              type={showConfirmation ? 'text' : 'password'}
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                        onClick={() => setShowConfirmation((visible) => !visible)}
                      >
                        {showConfirmation ? <VisibilityOffRounded /> : <VisibilityRounded />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Planting the first seed…' : 'Create my Arohan space'}
        </Button>
        <Typography textAlign="center" color="text.secondary">
          Already growing with us?{' '}
          <Link component={RouterLink} to="/login" fontWeight={700}>
            Sign in
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  )
}
