import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import '../App.css'

export default function OwnerPayments() {
  const { user, logout, token } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'ARS',
    exchangeRate: '',
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'Transferencia',
    note: ''
  })

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments/my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paymentForm)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage('Pago registrado exitosamente. Se ha enviado un correo de confirmación.')
        setPaymentForm({
          amount: '',
          currency: 'ARS',
          exchangeRate: '',
          periodYear: new Date().getFullYear(),
          periodMonth: new Date().getMonth() + 1,
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'Transferencia',
          note: ''
        })
        fetchPayments()
      } else {
        setMessage(data.message || 'Error al registrar pago')
      }
    } catch (err) {
      console.error('Error:', err)
      setMessage('Error al registrar pago')
    }
  }

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const isCurrentPeriod = (p) => {
    const now = new Date()
    return p.periodYear === now.getFullYear() && p.periodMonth === now.getMonth() + 1
  }

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>Mis Pagos</h1>
        <div className="header-info">
          <span>Bienvenido, {user?.name} {user?.unitNumber && `(${user.unitNumber})`}</span>
          <button onClick={() => { logout(); window.location.href = '/' }} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="owner-grid">
          <section className="payment-form-section">
            <h2>Registrar Nuevo Pago</h2>
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="field-row">
                <div className="field">
                  <label>Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    required
                  />
                </div>
                
                <div className="field">
                  <label>Moneda *</label>
                  <select
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({...paymentForm, currency: e.target.value})}
                    required
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar (USD)</option>
                  </select>
                </div>
              </div>

              {paymentForm.currency === 'USD' && (
                <div className="field">
                  <label>Tasa de cambio (ARS por USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.exchangeRate}
                    onChange={(e) => setPaymentForm({...paymentForm, exchangeRate: e.target.value})}
                    placeholder="Ej: 36.50"
                  />
                </div>
              )}

              <div className="field-row">
                <div className="field">
                  <label>Año *</label>
                  <select
                    value={paymentForm.periodYear}
                    onChange={(e) => setPaymentForm({...paymentForm, periodYear: Number(e.target.value)})}
                    required
                  >
                    {[2023, 2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                
                <div className="field">
                  <label>Mes *</label>
                  <select
                    value={paymentForm.periodMonth}
                    onChange={(e) => setPaymentForm({...paymentForm, periodMonth: Number(e.target.value)})}
                    required
                  >
                    {months.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Fecha de pago *</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                    required
                  />
                </div>
                
                <div className="field">
                  <label>Método de pago</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Nota adicional</label>
                <textarea
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
                  placeholder="Información adicional..."
                  rows={3}
                />
              </div>

              <button type="submit" className="btn-primary">Registrar Pago</button>
            </form>
            
            {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
          </section>

          <section className="payment-history">
            <h2>Historial de Pagos</h2>
            {loading ? (
              <p>Cargando...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Método</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id} className={isCurrentPeriod(payment) ? 'current-period' : ''}>
                      <td>{months[payment.periodMonth - 1]} {payment.periodYear}</td>
                      <td>{formatCurrency(payment.amount, payment.currency)}</td>
                      <td>{new Date(payment.paymentDate).toLocaleDateString('es-VE')}</td>
                      <td>{payment.method || '-'}</td>
                      <td>
                        <span className={`status ${isCurrentPeriod(payment) ? 'paid' : 'historical'}`}>
                          {isCurrentPeriod(payment) ? 'Período actual' : 'Registrado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="5">No hay pagos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
