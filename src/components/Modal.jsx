import { useEffect } from 'react'

/** Ventana modal: se cierra con Escape o clic afuera (salvo mientras guarda). */
export default function Modal({ titulo, subtitulo, onCerrar, bloqueado = false, onSubmit, pie, children }) {
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && !bloqueado && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar, bloqueado])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onMouseDown={(e) => e.target === e.currentTarget && !bloqueado && onCerrar()}>
      <form className="modal__caja" onSubmit={onSubmit} noValidate>
        <header className="modal__cabecera">
          <div>
            <h2 id="modal-titulo">{titulo}</h2>
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
