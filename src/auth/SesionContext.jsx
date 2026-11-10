/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, guardarSesion, leerSesion, registrarAlExpirar } from '../api/cliente.js'

const SesionContext = createContext(null)

export const NOMBRE_ROL = {
  ADMINISTRADOR: 'Administrador',
  GESTOR_EXPORTACIONES: 'Gestor de exportaciones',
  INSPECTOR_CALIDAD: 'Inspector de calidad',
  CLIENTE_UE: 'Cliente UE',
}

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion())

  const cerrarSesion = useCallback(() => {
    guardarSesion(null)
    setSesion(null)
  }, [])

  useEffect(() => {
    registrarAlExpirar(cerrarSesion)
  }, [cerrarSesion])

  const iniciarSesion = useCallback(async (email, password) => {
    const r = await authApi.login(email, password)
    const nueva = { token: r.token, usuario: r.usuario, expiraEn: Date.now() + r.expiraEnSegundos * 1000 }
    guardarSesion(nueva)
    setSesion(nueva)
    return r.usuario
  }, [])

  const valor = useMemo(() => {
    const usuario = sesion?.usuario ?? null
    const permisos = new Set(usuario?.permisos ?? [])
    const esCliente = usuario?.rol === 'CLIENTE_UE'
    return {
      usuario,
      esCliente,
      tienePermiso: (p) => permisos.has(p),
      // GET /api/envios: hasAnyAuthority('ORDENES_GESTIONAR','ROLE_CLIENTE_UE')
      puedeVerEnvios: esCliente || permisos.has('ORDENES_GESTIONAR'),
      iniciarSesion,
      cerrarSesion,
    }
  }, [sesion, iniciarSesion, cerrarSesion])

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

export function useSesion() {
  return useContext(SesionContext)
}
