import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

const TestComponent = () => {
  const { user, token, login, logout, loading } = useAuth()
  
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="user">{user ? user.name : 'no-user'}</span>
      <span data-testid="token">{token ? 'has-token' : 'no-token'}</span>
      <button onClick={() => login({ name: 'Test User' }, 'test-token')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    })
  })

  it('debería inicializar sin usuario', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('debería iniciar sesión correctamente', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await screen.findByTestId('loading')
    
    const loginBtn = screen.getByText('Login')
    await screen.findByRole('button', { name: 'Login' })
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })
    expect(screen.getByTestId('token')).toHaveTextContent('has-token')
  })

  it('debería cerrar sesión correctamente', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })
})
