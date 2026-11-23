import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MODO_DEMO, despertarServidor } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import Icono from '../components/Icono.jsx'
import Marca from '../components/Marca.jsx'
import { FOTOS } from '../fotos.js'

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PASSWORD_PRUEBA = import.meta.env.VITE_PASSWORD_PRUEBA || '626588b636c79dd6116fe404f3e8ca43'
const USUARIOS_PRUEBA = [
  { rol: 'Cliente UE', email: 'cliente@importadora-eu.com', icono: 'usuarios', tono: 'info' },
  { rol: 'Gestor', email: 'gestor@ritech.co', icono: 'barco', tono: 'cacao' },
  { rol: 'Administrador', email: 'admin@ritech.co', icono: 'llave', tono: 'azul' },
  { rol: 'Inspector', email: 'inspector@ritech.co', icono: 'escudo', tono: 'exito' },
]

async function copiar(texto) {
  try {
    await navigator.clipboard?.writeText(texto)
    return true
  } catch {
    return false
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
  const [verClave, setVerClave] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [lento, setLento] = useState(false)

  // El backend gratuito se duerme tras un rato sin uso: se despierta apenas se abre el login.
  useEffect(() => despertarServidor(), [])

  useEffect(() => {
    document.title = 'Iniciar sesión · RiTech Exports'
  }, [])

  useEffect(() => {
    if (!enviando) return setLento(false)
    const t = setTimeout(() => setLento(true), 4000)
    return () => clearTimeout(t)
  }, [enviando])

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    if (!CORREO_VALIDO.test(email.trim())) return setError('Escribe un correo válido.')
    if (!password) return setError('Escribe tu contraseña.')
    setEnviando(true)
    try {
      await iniciarSesion(email.trim().toLowerCase(), password)
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
        <img src={FOTOS.cafetal(1400)} alt="" className="login__paisaje login__paisaje--foto" aria-hidden="true" />
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

      <section className="login__formulario" style={{ '--foto-granos': `url(${FOTOS.granos(1400)})` }}>
        <form onSubmit={enviar} noValidate className="login__tarjeta">
          <div className="login__encabezado">
            <span className="login__sello"><Icono nombre="cafe" tam={22} /></span>
            <div>
              <h2>Bienvenido de nuevo</h2>
              <p>Ingresa con tu cuenta corporativa para continuar.</p>
            </div>
          </div>

          <label className="campo campo--icono">
            <span>Correo</span>
            <div className="campo__envoltura">
              <Icono nombre="correo" tam={18} />
              <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.com" autoFocus />
            </div>
          </label>
          <label className="campo campo--icono">
            <span>Contraseña</span>
            <div className="campo__envoltura campo__clave">
              <Icono nombre="candado" tam={18} />
              <input type={verClave ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" className="boton-icono" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={verClave}>
                <Icono nombre={verClave ? 'ojoTachado' : 'ojo'} tam={18} />
              </button>
            </div>
          </label>

          {lento && (
            <div className="aviso aviso--info" role="status">
              <span className="spinner" /> El servidor se está activando después de un rato sin uso. Puede tardar hasta un minuto, no cierres la página.
            </div>
          )}

          {error && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {error}</div>}

          <button className="boton boton--primario boton--bloque boton--brillo" disabled={enviando}>
            {enviando ? <span className="spinner spinner--claro" /> : <>Ingresar <Icono nombre="siguiente" tam={18} /></>}
          </button>

          <div className="separador"><span>o entra con una cuenta de prueba</span></div>

          <div className="cuentas-prueba">
            {USUARIOS_PRUEBA.map((u) => (
              <button
                type="button"
                key={u.email}
                className={`cuenta-prueba ${email === u.email ? 'cuenta-prueba--activa' : ''}`}
                aria-pressed={email === u.email}
                onClick={() => {
                  setEmail(u.email)
                  setPassword(PASSWORD_PRUEBA)
                  setError('')
                }}
              >
                <span className={`cuenta-prueba__icono cuenta-prueba__icono--${u.tono}`}><Icono nombre={u.icono} tam={18} /></span>
                <span className="cuenta-prueba__texto">
                  <span className="cuenta-prueba__rol">{u.rol}</span>
                  <span className="cuenta-prueba__correo">{u.email}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="cuentas-prueba__clave">
            <span>Contraseña de prueba</span>
            <code>{MODO_DEMO ? 'cualquiera' : PASSWORD_PRUEBA}</code>
            {!MODO_DEMO && (
              <button type="button" className="boton-copiar" onClick={async () => { if (await copiar(PASSWORD_PRUEBA)) { setCopiado(true); setTimeout(() => setCopiado(false), 1800) } }}>
                <Icono nombre={copiado ? 'check' : 'copiar'} tam={14} /> {copiado ? 'Copiada' : 'Copiar'}
              </button>
            )}
          </div>
        </form>
        <footer>© {new Date().getFullYear()} RiTech Exports S.A.S. · Fotos de <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a></footer>
      </section>
    </div>
  )
}
