import { Navigate, Route, Routes } from 'react-router-dom'
import { useSesion } from './auth/SesionContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Inicio from './pages/Inicio.jsx'
import Envios from './pages/Envios.jsx'
import EnvioDetalle from './pages/EnvioDetalle.jsx'
import NoEncontrado from './pages/NoEncontrado.jsx'

function Protegida({ children, permitido = true }) {
  const { usuario } = useSesion()
  if (!usuario) return <Navigate to="/login" replace />
  if (!permitido) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { usuario, puedeVerEnvios } = useSesion()

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route index element={<Inicio />} />
        <Route path="envios" element={<Protegida permitido={puedeVerEnvios}><Envios /></Protegida>} />
        <Route path="envios/:id" element={<Protegida permitido={puedeVerEnvios}><EnvioDetalle /></Protegida>} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  )
}
