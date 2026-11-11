import { useState } from 'react'
import { reportesApi } from '../api/cliente.js'
import BotonArchivo from '../components/BotonArchivo.jsx'
import Icono from '../components/Icono.jsx'

const REPORTES = [
  { clave: 'ordenes', titulo: 'Órdenes de exportación', texto: 'Número, cliente, fecha, Incoterm, moneda, valor total y estado.', filtro: 'fecha de la orden', icono: 'documento' },
  { clave: 'lotes', titulo: 'Lotes', texto: 'Código, producto, pesos, cosecha, registro y estado de calidad.', filtro: 'fecha de registro', icono: 'contenedor' },
  { clave: 'envios', titulo: 'Envíos', texto: 'Orden, transportista, contenedor, puertos, fechas y estado.', filtro: 'zarpe estimado', icono: 'barco' },
]

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

function rango(clave) {
  const hoy = new Date()
  if (clave === 'mes') return [iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), iso(hoy)]
  if (clave === 'trimestre') return [iso(new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)), iso(hoy)]
  if (clave === 'anio') return [iso(new Date(hoy.getFullYear(), 0, 1)), iso(hoy)]
  return ['', '']
}

/** SCRUM-32: exportar órdenes, lotes y envíos a Excel o CSV. */
export default function Reportes() {
  const [formato, setFormato] = useState('xlsx')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [atajo, setAtajo] = useState('todo')
  const [error, setError] = useState('')
  const invalido = desde && hasta && desde > hasta

  const elegirAtajo = (clave) => {
    const [d, h] = rango(clave)
    setAtajo(clave)
    setDesde(d)
    setHasta(h)
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Reportes</span>
          <h1>Exportar reportes</h1>
          <p className="texto-suave">Descarga la información en Excel o CSV para análisis, auditorías o entregas al cliente.</p>
        </div>
      </header>

      <section className="tarjeta">
        <div className="opciones-reporte">
          <div className="campo">
            <span>Periodo</span>
            <div className="filtros__chips">
              {[['todo', 'Todo'], ['mes', 'Este mes'], ['trimestre', 'Últimos 3 meses'], ['anio', 'Este año']].map(([c, t]) => (
                <button key={c} className={`chip ${atajo === c ? 'chip--activo' : ''}`} onClick={() => elegirAtajo(c)}>{t}</button>
              ))}
            </div>
          </div>
          <label className="filtro-fecha">
            <span>Desde</span>
            <input type="date" className="selector" value={desde} max={hasta || undefined} onChange={(e) => { setDesde(e.target.value); setAtajo('') }} />
          </label>
          <label className="filtro-fecha">
            <span>Hasta</span>
            <input type="date" className="selector" value={hasta} min={desde || undefined} onChange={(e) => { setHasta(e.target.value); setAtajo('') }} />
          </label>
          <div className="campo">
            <span>Formato</span>
            <div className="filtros__chips">
              <button className={`chip ${formato === 'xlsx' ? 'chip--activo' : ''}`} onClick={() => setFormato('xlsx')}>Excel (.xlsx)</button>
              <button className={`chip ${formato === 'csv' ? 'chip--activo' : ''}`} onClick={() => setFormato('csv')}>CSV</button>
            </div>
          </div>
        </div>
        {invalido && <div className="aviso aviso--alerta espacio-arriba" role="alert"><Icono nombre="alerta" tam={16} /> La fecha "desde" debe ser anterior a "hasta".</div>}
        {error && <div className="aviso aviso--error espacio-arriba" role="alert"><Icono nombre="alerta" tam={16} /> {error}</div>}
      </section>

      <div className="rejilla-reportes">
        {REPORTES.map((r) => (
          <section key={r.clave} className="tarjeta tarjeta-reporte">
            <span className="tarjeta-reporte__icono"><Icono nombre={r.icono} tam={22} /></span>
            <h2>{r.titulo}</h2>
            <p className="texto-suave">{r.texto}</p>
            <p className="celda-sub">El periodo se aplica sobre la {r.filtro}.</p>
            <BotonArchivo
              obtener={() => reportesApi.exportar(r.clave, { formato, desde, hasta })}
              clase="boton boton--primario boton--bloque"
              icono="descarga"
              onError={setError}
              disabled={invalido}
            >
              Descargar {formato === 'xlsx' ? 'Excel' : 'CSV'}
            </BotonArchivo>
          </section>
        ))}
      </div>
    </div>
  )
}
