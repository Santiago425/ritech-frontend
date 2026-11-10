import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MODO_DEMO } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import Icono from '../components/Icono.jsx'
import Marca from '../components/Marca.jsx'

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PASSWORD_PRUEBA = import.meta.env.VITE_PASSWORD_PRUEBA || 'RiTech2026*'
const USUARIOS_PRUEBA = [
  { rol: 'Cliente UE', email: 'cliente@importadora-eu.com' },
  { rol: 'Gestor', email: 'gestor@ritech.co' },
  { rol: 'Administrador', email: 'admin@ritech.co' },
  { rol: 'Inspector', email: 'inspector@ritech.co' },
]

function copiar(texto) {
  try {
    navigator.clipboard?.writeText(texto)
  } catch {
    // Sin permiso de portapapeles: el usuario puede seleccionar el texto a mano.
  }
}

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

          <div className="cuentas-prueba">
            <div className="cuentas-prueba__cabecera">
              <strong>Cuentas de prueba</strong>
              <span>Toca una para llenar el formulario</span>
            </div>
            {USUARIOS_PRUEBA.map((u) => (
              <button
                type="button"
                key={u.email}
                className="cuenta-prueba"
                onClick={() => {
                  setEmail(u.email)
                  setPassword(PASSWORD_PRUEBA)
                  setError('')
                }}
              >
                <span className="cuenta-prueba__rol">{u.rol}</span>
                <span className="mono">{u.email}</span>
              </button>
            ))}
            <div className="cuentas-prueba__clave">
              <span>Contraseña: <code>{MODO_DEMO ? 'cualquiera' : PASSWORD_PRUEBA}</code></span>
              {!MODO_DEMO && (
                <button type="button" className="boton boton--fantasma" onClick={() => copiar(PASSWORD_PRUEBA)}>Copiar</button>
              )}
            </div>
          </div>
        </form>
        <footer>© {new Date().getFullYear()} RiTech Exports S.A.S.</footer>
      </section>
    </div>
  )
}
