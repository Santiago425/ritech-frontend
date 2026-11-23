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

const NOMBRES_VISIBLES = {
  'gestor@ritech.co': 'Santiago Campoverde y Manuel Villarreal',
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

  useEffect(() => {
    if (!sesion?.expiraEn) return
    const restante = sesion.expiraEn - Date.now()
    if (restante <= 0) return cerrarSesion()
    const t = setTimeout(cerrarSesion, Math.min(restante, 2147483647))
    return () => clearTimeout(t)
  }, [sesion, cerrarSesion])

  const iniciarSesion = useCallback(async (email, password) => {
    const r = await authApi.login(email, password)
    const nueva = { token: r.token, usuario: r.usuario, expiraEn: Date.now() + r.expiraEnSegundos * 1000 }
    guardarSesion(nueva)
    setSesion(nueva)
    return r.usuario
  }, [])

  const valor = useMemo(() => {
    const base = sesion?.usuario ?? null
    const visible = base && NOMBRES_VISIBLES[base.email?.toLowerCase()]
    const usuario = visible ? { ...base, nombreCompleto: visible } : base
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
