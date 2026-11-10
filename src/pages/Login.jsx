import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MODO_DEMO } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import Icono from '../components/Icono.jsx'
import Marca from '../components/Marca.jsx'

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { iniciarSesion } = useSesion()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    if (!CORREO_VALIDO.test(email.trim())) return setError('Escribe un correo válido.')
    if (!password) return setError('Escribe tu contraseña.')
    setEnviando(true)
    try {
      await iniciarSesion(email.trim(), password)
      navigate(location.state?.desde ?? '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <section className="login__panel">
        <Marca claro />
        <div className="login__mensaje">
          <h1>Exportaciones de café y cacao con trazabilidad de origen a destino.</h1>
          <p>Lotes, cumplimiento normativo UE, órdenes y logística en un solo lugar.</p>
        </div>
        <ul className="login__puntos">
          <li><Icono nombre="pin" /> Trazabilidad EUDR por finca</li>
          <li><Icono nombre="documento" /> Certificados y validación normativa</li>
          <li><Icono nombre="barco" /> Seguimiento de envíos en tiempo real</li>
        </ul>
      </section>

      <section className="login__formulario">
        <form onSubmit={enviar} noValidate>
          <h2>Iniciar sesión</h2>
          <p className="texto-suave">Ingresa con tu cuenta corporativa.</p>

          <label className="campo">
            <span>Correo</span>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.com" autoFocus />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>

          {error && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {error}</div>}

          <button className="boton boton--primario boton--bloque" disabled={enviando}>
            {enviando ? <span className="spinner spinner--claro" /> : 'Ingresar'}
          </button>

          {MODO_DEMO && (
            <div className="aviso aviso--info">
              Modo demo: usa <code>cliente@importadora-eu.com</code> o <code>gestor@ritech.co</code> con cualquier contraseña.
            </div>
          )}
        </form>
        <footer>© {new Date().getFullYear()} RiTech Exports S.A.S.</footer>
      </section>
    </div>
  )
}
