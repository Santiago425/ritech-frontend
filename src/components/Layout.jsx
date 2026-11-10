import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MODO_DEMO } from '../api/cliente.js'
import { NOMBRE_ROL, useSesion } from '../auth/SesionContext.jsx'
import Icono from './Icono.jsx'
import Marca from './Marca.jsx'

function iniciales(nombre = '') {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

export default function Layout() {
  const { usuario, esCliente, puedeVerEnvios, tienePermiso, cerrarSesion } = useSesion()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => setMenuAbierto(false), [pathname])

  const salir = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`app ${menuAbierto ? 'app--menu-abierto' : ''}`}>
      <aside className="lateral">
        <Marca claro />
        <nav className="lateral__nav" aria-label="Principal">
          <span className="lateral__seccion">General</span>
          <NavLink to="/" end className="lateral__enlace">
            <Icono nombre="inicio" /> Inicio
          </NavLink>
          {tienePermiso('CLIENTES_CONSULTAR') && (
            <>
              <span className="lateral__seccion">Comercial</span>
              <NavLink to="/clientes" className="lateral__enlace">
                <Icono nombre="usuarios" /> Clientes UE
              </NavLink>
            </>
          )}
          {(tienePermiso('PRODUCTORES_GESTIONAR') || tienePermiso('LOTES_TRAZABILIDAD') || tienePermiso('LOTES_CONSULTAR')) && (
            <span className="lateral__seccion">{tienePermiso('INSPECCION_REGISTRAR') ? 'Calidad' : 'Origen'}</span>
          )}
          {(tienePermiso('PRODUCTORES_GESTIONAR') || tienePermiso('LOTES_TRAZABILIDAD')) && (
            <NavLink to="/productores" className="lateral__enlace">
              <Icono nombre="hoja" /> Productores y fincas
            </NavLink>
          )}
          {tienePermiso('LOTES_CONSULTAR') && (
            <NavLink to="/lotes" className="lateral__enlace">
              <Icono nombre="contenedor" /> {esCliente ? 'Mis lotes' : 'Lotes'}
            </NavLink>
          )}
          {puedeVerEnvios && (
            <>
              <span className="lateral__seccion">Logística</span>
              <NavLink to="/envios" className="lateral__enlace">
                <Icono nombre="barco" /> {esCliente ? 'Mis envíos' : 'Envíos'}
              </NavLink>
            </>
          )}
        </nav>
        <div className="lateral__pie">
          <p>Café y cacao trazable hacia la Unión Europea</p>
          <span>Cumplimiento EUDR</span>
        </div>
      </aside>
      <div className="velo" onClick={() => setMenuAbierto(false)} />

      <div className="principal">
        <header className="barra">
          <button className="barra__menu" onClick={() => setMenuAbierto((v) => !v)} aria-label="Abrir menú">
            <Icono nombre="menu" tam={22} />
          </button>
          {MODO_DEMO && <span className="chip-demo">Modo demo</span>}
          <div className="barra__usuario">
            <div className="avatar">{iniciales(usuario.nombreCompleto)}</div>
            <div className="barra__datos">
              <strong>{usuario.nombreCompleto}</strong>
              <span>{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</span>
            </div>
            <button className="boton-icono" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión">
              <Icono nombre="salir" />
            </button>
          </div>
        </header>
        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
