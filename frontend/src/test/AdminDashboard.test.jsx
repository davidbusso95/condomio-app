import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import AdminDashboard from '../pages/AdminDashboard'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin Test', role: 'ADMIN' },
    token: 'test-token',
    logout: vi.fn(),
    login: vi.fn()
  })
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Dashboard del Administrador', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('debería renderizar el panel de administración', () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalPayments: 0, totalExpenses: 0, balance: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    renderWithRouter(<AdminDashboard />)
    
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument()
    expect(screen.getByText(/Bienvenido/)).toBeInTheDocument()
  })

  it('debería mostrar las opciones de navegación', () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalPayments: 0, totalExpenses: 0, balance: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    renderWithRouter(<AdminDashboard />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Registrar Gastos')).toBeInTheDocument()
    expect(screen.getByText('Reportes')).toBeInTheDocument()
  })

  it('debería cambiar entre pestañas', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalPayments: 0, totalExpenses: 0, balance: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    renderWithRouter(<AdminDashboard />)
    
    await userEvent.click(screen.getByText('Registrar Gastos'))
    await waitFor(() => {
      expect(screen.getByText('Registrar Nuevo Gasto')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Reportes'))
    await waitFor(() => {
      expect(screen.getByText('Reportes y Exportación')).toBeInTheDocument()
    })
  })

  it('debería mostrar el formulario de registro de gastos', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalPayments: 0, totalExpenses: 0, balance: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    renderWithRouter(<AdminDashboard />)
    
    await userEvent.click(screen.getByText('Registrar Gastos'))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Categoría/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Monto/)).toBeInTheDocument()
    })
  })

  it('debería mostrar propietarios con pagos pendientes', () => {
    const mockPendingOwners = [
      { id: 1, name: 'Owner 1', email: 'owner1@test.com', unitNumber: 'A101' }
    ]

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalPayments: 0, totalExpenses: 0, balance: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPendingOwners })

    renderWithRouter(<AdminDashboard />)
    
    expect(screen.getByText('Propietarios con Pagos Pendientes')).toBeInTheDocument()
  })

  it('debería tener botón de exportar a Excel', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalPayments: 0, totalExpenses: 0, balance: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    renderWithRouter(<AdminDashboard />)
    
    await userEvent.click(screen.getByText('Reportes'))
    
    await waitFor(() => {
      expect(screen.getByText('Exportar a Excel')).toBeInTheDocument()
    })
  })
})
