import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { despertarIa, iaApi, IA_DISPONIBLE } from '../api/ia.js'
import { NOMBRE_ROL, useSesion } from '../auth/SesionContext.jsx'
import Icono from './Icono.jsx'

const SUGERENCIAS = ['¿Cómo programo un envío?', '¿Qué exige el EUDR?', '¿Cuándo puedo descargar la DDS?']

export default function AsistenteIA() {
  const { usuario } = useSesion()
  const { pathname } = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const lista = useRef(null)
  const entrada = useRef(null)

  useEffect(() => {
    if (abierto) {
      despertarIa()
      entrada.current?.focus()
    }
  }, [abierto])

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes, cargando])

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto])

  if (!IA_DISPONIBLE) return null

  const preguntar = async (pregunta) => {
    const q = pregunta.trim()
    if (q.length < 2 || cargando) return
    const historial = mensajes.filter((m) => !m.error).slice(-10).map(({ rol, texto: t }) => ({ role: rol, text: t.slice(0, 1500) }))
    setMensajes((m) => [...m, { rol: 'user', texto: q }])
    setTexto('')
    setCargando(true)
    try {
      const r = await iaApi.preguntar(q.slice(0, 500), { rol: NOMBRE_ROL[usuario.rol] ?? usuario.rol, pagina: pathname, historial })
      setMensajes((m) => [...m, { rol: 'assistant', texto: r.answer }])
    } catch (err) {
      setMensajes((m) => [...m, { rol: 'assistant', texto: err.message, error: true }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      {abierto && (
        <section className="asistente" role="dialog" aria-label="Asistente RiBot">
          <header className="asistente__cabecera">
            <div>
              <strong><Icono nombre="chispa" tam={16} /> RiBot</strong>
              <span>Asistente de RiTech con IA</span>
            </div>
            <button className="boton-icono" onClick={() => setAbierto(false)} aria-label="Cerrar asistente">✕</button>
          </header>
          <div className="asistente__mensajes" ref={lista} aria-live="polite">
            {mensajes.length === 0 && (
              <div className="asistente__bienvenida">
                <p>Hola, {usuario.nombreCompleto.split(' ')[0]}. Pregúntame sobre la plataforma, el EUDR o cómo exportar a la UE.</p>
                {SUGERENCIAS.map((s) => <button key={s} className="chip" onClick={() => preguntar(s)}>{s}</button>)}
              </div>
            )}
            {mensajes.map((m, i) => (
              <p key={i} className={`burbuja burbuja--${m.rol === 'user' ? 'usuario' : 'bot'} ${m.error ? 'burbuja--error' : ''}`}>{m.texto}</p>
            ))}
            {cargando && <p className="burbuja burbuja--bot"><span className="spinner" /></p>}
          </div>
          <form className="asistente__entrada" onSubmit={(e) => { e.preventDefault(); preguntar(texto) }}>
            <input ref={entrada} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={500} placeholder="Escribe tu pregunta…" aria-label="Pregunta para RiBot" />
            <button className="boton-icono" disabled={cargando || texto.trim().length < 2} aria-label="Enviar pregunta"><Icono nombre="enviar" tam={18} /></button>
          </form>
        </section>
      )}
      <button className="asistente__boton" onClick={() => setAbierto((v) => !v)} aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente RiBot'} aria-expanded={abierto}>
        {abierto ? <span aria-hidden="true">✕</span> : <Icono nombre="chispa" tam={22} />}
      </button>
    </>
  )
}
