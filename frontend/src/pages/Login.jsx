import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import heroImg from '../assets/hero.png'
import '../App.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    
    const endpoint = isRegister ? '/auth/register' : '/auth/login'
    const body = isRegister 
      ? { name, email, password, unitNumber, role: 'OWNER' }
      : { email, password }

    try {
      const res = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Error en la solicitud')
      }

      if (isRegister) {
        setMessage('Registro exitoso. Ahora puedes iniciar sesión.')
        setIsRegister(false)
      } else {
        login(data.user, data.token)
        navigate(data.user.role === 'ADMIN' ? '/admin' : '/pagos')
      }
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div className="login-container">
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
        </div>
        <div>
          <h1>Condominio App</h1>
          <p>{isRegister ? 'Regístrate para gestionar tus pagos' : 'Inicia sesión para gestionar pagos y gastos'}</p>
        </div>
      </section>

      <section id="login">
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="field">
                <label>Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Número de apartamento/casa</label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary">
            {isRegister ? 'Registrarse' : 'Iniciar sesión'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="switch-mode">
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button 
            type="button" 
            className="link-btn"
            onClick={() => {
              setIsRegister(!isRegister)
              setMessage('')
            }}
          >
            {isRegister ? ' Inicia sesión' : ' Regístrate'}
          </button>
        </p>
      </section>
    </div>
  )
}
