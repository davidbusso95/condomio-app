import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import OwnerPayments from '../pages/OwnerPayments'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test Owner', unitNumber: 'A101', role: 'OWNER' },
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

describe('Página de Pagos del Propietario', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('debería renderizar la página correctamente', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    renderWithRouter(<OwnerPayments />)
    
    expect(screen.getByText('Mis Pagos')).toBeInTheDocument()
    expect(screen.getByText(/Bienvenido/)).toBeInTheDocument()
  })

  it('debería mostrar el formulario de registro de pago', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    renderWithRouter(<OwnerPayments />)
    
    expect(screen.getByText('Registrar Nuevo Pago')).toBeInTheDocument()
    expect(screen.getByLabelText(/Monto/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Moneda/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Año/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mes/)).toBeInTheDocument()
  })

  it('debería mostrar las opciones de moneda ARS y USD', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    renderWithRouter(<OwnerPayments />)
    
    const currencySelect = screen.getByLabelText(/Moneda/)
    expect(currencySelect).toBeInTheDocument()
    
    const options = screen.getAllByRole('option')
    const currencies = options.map(o => o.textContent)
    expect(currencies).toContain('Peso Argentino (ARS)')
    expect(currencies).toContain('Dólar (USD)')
  })

  it('debería mostrar el historial de pagos', () => {
    const mockPayments = [
      {
        id: 1,
        amount: '100.00',
        currency: 'ARS',
        periodYear: 2026,
        periodMonth: 3,
        paymentDate: '2026-03-13',
        method: 'Transferencia'
      }
    ]

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayments
    })

    renderWithRouter(<OwnerPayments />)
    
    expect(screen.getByText('Historial de Pagos')).toBeInTheDocument()
  })

  it('debería registrar un pago exitosamente', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          amount: '100',
          currency: 'ARS',
          periodYear: 2026,
          periodMonth: 3
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

    renderWithRouter(<OwnerPayments />)
    
    await userEvent.type(screen.getByLabelText(/Monto/), '100')
    await userEvent.selectOptions(screen.getByLabelText(/Año/), '2026')
    await userEvent.selectOptions(screen.getByLabelText(/Mes/), '3')
    await userEvent.click(screen.getByRole('button', { name: /Registrar Pago/ }))

    await waitFor(() => {
      expect(screen.getByText(/expuestos/)).toBeInTheDocument()
    })
  })
})
