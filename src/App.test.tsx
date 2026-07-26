import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

describe('Arohan application', () => {
  it('uses Arohan branding on the authentication experience', async () => {
    sessionStorage.clear()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>,
    )

    expect(await screen.findAllByText('Arohan')).not.toHaveLength(0)
    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Continue to Arohan'),
    ).toBeInTheDocument()
  })
})
