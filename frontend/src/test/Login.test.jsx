import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Login from '../pages/Login'

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
      token: null,
      loading: false
    })
  }
})

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Página de Login', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('debería renderizar el formulario de login', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText('Condominio App')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar sesión/ })).toBeInTheDocument()
  })

  it('debería mostrar error con credenciales inválidas', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Credenciales inválidas' })
    })

    renderWithRouter(<Login />)
    
    await userEvent.type(screen.getByLabelText(/Email/), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }))

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })
  })

  it('debería cambiar a modo registro', async () => {
    renderWithRouter(<Login />)
    
    await userEvent.click(screen.getByText(/Regístrate/))
    
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Número de apartamento/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrarse/ })).toBeInTheDocument()
  })

  it('debería registrar un nuevo usuario exitosamente', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registro exitoso' })
    })

    renderWithRouter(<Login />)
    
    await userEvent.click(screen.getByText(/Regístrate/))
    
    await userEvent.type(screen.getByLabelText(/Nombre/), 'Juan Perez')
    await userEvent.type(screen.getByLabelText(/Número de apartamento/), 'A101')
    await userEvent.type(screen.getByLabelText(/Email/), 'juan@test.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'password123')
    
    await userEvent.click(screen.getByRole('button', { name: /Registrarse/ }))

    await waitFor(() => {
      expect(screen.getByText('Registro exitoso. Ahora puedes iniciar sesión.')).toBeInTheDocument()
    })
  })
})
