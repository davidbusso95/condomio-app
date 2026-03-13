import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import '../App.css'

export default function AdminDashboard() {
  const { user, logout, token } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({ totalPayments: 0, totalExpenses: 0, balance: 0 })
  const [pendingOwners, setPendingOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: '',
    amount: '',
    currency: 'ARS',
    expenseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    supplier: ''
  })

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses/latest', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setExpenses(data)
      }
    } catch (err) {
      console.error('Error fetching expenses:', err)
    }
  }

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/reports/summary?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }

  const fetchPendingOwners = async () => {
    try {
      const res = await fetch(`/api/reports/pending-owners?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPendingOwners(data)
      }
    } catch (err) {
      console.error('Error fetching pending owners:', err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchExpenses(), fetchSummary(), fetchPendingOwners()])
      setLoading(false)
    }
    fetchData()
  }, [year, month])

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(expenseForm)
      })
      
      if (res.ok) {
        alert('Gasto registrado exitosamente')
        setExpenseForm({
          description: '',
          category: '',
          amount: '',
          currency: 'ARS',
          expenseDate: new Date().toISOString().split('T')[0],
          invoiceNumber: '',
          supplier: ''
        })
        fetchExpenses()
        fetchSummary()
      } else {
        alert('Error al registrar gasto')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error al registrar gasto')
    }
  }

  const handleDeleteExpense = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return
    
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        alert('Gasto eliminado exitosamente')
        fetchExpenses()
        fetchSummary()
      } else {
        alert('Error al eliminar gasto')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error al eliminar gasto')
    }
  }

  const handleExportExcel = async () => {
    try {
      const res = await fetch('/api/reports/export-excel', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'condominio-reportes.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting:', err)
      alert('Error al exportar a Excel')
    }
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Panel de Administración</h1>
        <div className="header-info">
          <span>Bienvenido, {user?.name}</span>
          <button onClick={() => { logout(); window.location.href = '/' }} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button className={activeTab === 'expenses' ? 'active' : ''} onClick={() => setActiveTab('expenses')}>
          Registrar Gastos
        </button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
          Reportes
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-view">
            <div className="filters">
              <label>
                Período: 
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>
                  ))}
                </select>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {[2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="summary-cards">
              <div className="card income">
                <h3>Ingresos</h3>
                <p className="amount">{formatCurrency(summary.totalPayments, 'ARS')}</p>
              </div>
              <div className="card expense">
                <h3>Egresos</h3>
                <p className="amount">{formatCurrency(summary.totalExpenses, 'ARS')}</p>
              </div>
              <div className="card balance">
                <h3>Balance</h3>
                <p className="amount">{formatCurrency(summary.balance, 'ARS')}</p>
              </div>
            </div>

            <div className="dashboard-grid">
              <section className="latest-expenses">
                <h3>Últimos Gastos Registrados</h3>
                {loading ? <p>Cargando...</p> : (
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th>Monto</th>
                        <th>Moneda</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.slice(0, 10).map(expense => (
                        <tr key={expense.id}>
                          <td>{new Date(expense.expenseDate).toLocaleDateString('es-VE')}</td>
                          <td>{expense.description}</td>
                          <td>{expense.category || '-'}</td>
                          <td>{expense.amount}</td>
                          <td>{expense.currency}</td>
                          <td>
                            <button 
                              className="btn-delete"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && <tr><td colSpan="6">No hay gastos registrados</td></tr>}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="pending-owners">
                <h3>Propietarios con Pagos Pendientes</h3>
                {loading ? <p>Cargando...</p> : (
                  <table>
                    <thead>
                      <tr>
                        <th>Apartamento</th>
                        <th>Nombre</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOwners.map(owner => (
                        <tr key={owner.id}>
                          <td>{owner.unitNumber || '-'}</td>
                          <td>{owner.name}</td>
                          <td>{owner.email}</td>
                        </tr>
                      ))}
                      {pendingOwners.length === 0 && <tr><td colSpan="3">Todos los propietarios están al día</td></tr>}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="expense-form-view">
            <h2>Registrar Nuevo Gasto</h2>
            <form onSubmit={handleExpenseSubmit} className="expense-form">
              <div className="field">
                <label>Descripción *</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="field">
                <label>Categoría</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Seguridad">Seguridad</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Administración">Administración</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                  />
                </div>
                
                <div className="field">
                  <label>Moneda *</label>
                  <select
                    value={expenseForm.currency}
                    onChange={(e) => setExpenseForm({...expenseForm, currency: e.target.value})}
                    required
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar (USD)</option>
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({...expenseForm, expenseDate: e.target.value})}
                    required
                  />
                </div>
                
                <div className="field">
                  <label>Número de Factura</label>
                  <input
                    type="text"
                    value={expenseForm.invoiceNumber}
                    onChange={(e) => setExpenseForm({...expenseForm, invoiceNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="field">
                <label>Proveedor</label>
                <input
                  type="text"
                  value={expenseForm.supplier}
                  onChange={(e) => setExpenseForm({...expenseForm, supplier: e.target.value})}
                />
              </div>

              <button type="submit" className="btn-primary">Registrar Gasto</button>
            </form>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-view">
            <h2>Reportes y Exportación</h2>
            
            <div className="report-filters">
              <label>
                Período: 
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>
                  ))}
                </select>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {[2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              <button onClick={handleExportExcel} className="btn-export">
                Exportar a Excel
              </button>
            </div>

            <div className="report-summary">
              <h3>Estado de Cuenta General</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="label">Total Ingresos:</span>
                  <span className="value income">{formatCurrency(summary.totalPayments, 'ARS')}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Total Egresos:</span>
                  <span className="value expense">{formatCurrency(summary.totalExpenses, 'ARS')}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Balance del período:</span>
                  <span className={`value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
                    {formatCurrency(summary.balance, 'ARS')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
