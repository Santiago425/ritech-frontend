import { Navigate, Route, Routes } from 'react-router-dom'
import { useSesion } from './auth/SesionContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Inicio from './pages/Inicio.jsx'
import Envios from './pages/Envios.jsx'
import EnvioDetalle from './pages/EnvioDetalle.jsx'
import NoEncontrado from './pages/NoEncontrado.jsx'
import Clientes from './pages/Clientes.jsx'
import Productores from './pages/Productores.jsx'
import ProductorDetalle from './pages/ProductorDetalle.jsx'
import Lotes from './pages/Lotes.jsx'
import LoteDetalle from './pages/LoteDetalle.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Auditoria from './pages/Auditoria.jsx'

function Protegida({ children, permitido = true }) {
  const { usuario } = useSesion()
  if (!usuario) return <Navigate to="/login" replace />
  if (!permitido) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { usuario, puedeVerEnvios, tienePermiso } = useSesion()
  // GET /api/productores: hasAnyAuthority('PRODUCTORES_GESTIONAR','LOTES_TRAZABILIDAD')
  const puedeVerProductores = tienePermiso('PRODUCTORES_GESTIONAR') || tienePermiso('LOTES_TRAZABILIDAD')

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route index element={<Inicio />} />
        <Route path="envios" element={<Protegida permitido={puedeVerEnvios}><Envios /></Protegida>} />
        <Route path="envios/:id" element={<Protegida permitido={puedeVerEnvios}><EnvioDetalle /></Protegida>} />
        <Route path="clientes" element={<Protegida permitido={tienePermiso('CLIENTES_CONSULTAR')}><Clientes /></Protegida>} />
        <Route path="productores" element={<Protegida permitido={puedeVerProductores}><Productores /></Protegida>} />
        <Route path="productores/:id" element={<Protegida permitido={puedeVerProductores}><ProductorDetalle /></Protegida>} />
        <Route path="lotes" element={<Protegida permitido={tienePermiso('LOTES_CONSULTAR')}><Lotes /></Protegida>} />
        <Route path="lotes/:id" element={<Protegida permitido={tienePermiso('LOTES_CONSULTAR')}><LoteDetalle /></Protegida>} />
        <Route path="usuarios" element={<Protegida permitido={tienePermiso('USUARIOS_GESTIONAR')}><Usuarios /></Protegida>} />
        <Route path="auditoria" element={<Protegida permitido={tienePermiso('AUDITORIA_CONSULTAR')}><Auditoria /></Protegida>} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  )
}
