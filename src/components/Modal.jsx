import { useEffect, useId } from 'react'

/** Ventana modal: se cierra con Escape o clic afuera (salvo mientras guarda). */
export default function Modal({ ancho = false, titulo, subtitulo, onCerrar, bloqueado = false, onSubmit, pie, children }) {
  const idTitulo = useId()
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && !bloqueado && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar, bloqueado])

  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby={idTitulo} onMouseDown={(e) => e.target === e.currentTarget && !bloqueado && onCerrar()}>
      <form className={`modal__caja ${ancho ? 'modal__caja--ancha' : ''}`} onSubmit={onSubmit} noValidate>
        <header className="modal__cabecera">
          <div>
            <h2 id={idTitulo}>{titulo}</h2>
            {subtitulo && <p className="texto-suave">{subtitulo}</p>}
          </div>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar" disabled={bloqueado}>✕</button>
        </header>
        <div className="modal__cuerpo">{children}</div>
        <footer className="modal__pie">{pie}</footer>
      </form>
    </div>
  )
}
