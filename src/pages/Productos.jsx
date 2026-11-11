import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { lotesApi, productosApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import Modal from '../components/Modal.jsx'
import { useCarga } from '../hooks.js'

const HS = /^[0-9]{4}([0-9]{2}){0,3}$/
const TIPOS = { CAFE: 'Café', CACAO: 'Cacao' }
const VACIO = { tipo: 'CAFE', nombreComercial: '', variedad: '', codigoHs: '', unidadMedida: 'KG' }

/** SCRUM-13: catálogo de productos exportables con su código arancelario (HS). */
export default function Productos() {
  const { tienePermiso } = useSesion()
  const puedeGestionar = tienePermiso('PRODUCTOS_GESTIONAR')
  const productos = useCarga(() => productosApi.listar())
  const lotes = useCarga(() => (tienePermiso('LOTES_CONSULTAR') ? lotesApi.listar() : Promise.resolve([])))
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)

  const lotesDe = useMemo(() => {
    const m = new Map()
    ;(lotes.datos ?? []).forEach((l) => m.set(l.idProducto, (m.get(l.idProducto) ?? 0) + 1))
    return (id) => m.get(id) ?? 0
  }, [lotes.datos])

  const avisar = (tono, texto) => {
    setAviso({ tono, texto })
    setTimeout(() => setAviso(null), 5000)
  }
  const listo = (texto) => {
    setModal(null)
    productos.recargar()
    avisar('exito', texto)
  }

  const lista = productos.datos ?? []

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Datos maestros</span>
          <h1>Productos</h1>
          <p className="texto-suave">Café y cacao que se exportan, con su variedad y código arancelario HS para aduanas.</p>
        </div>
        {puedeGestionar && <button className="boton boton--primario" onClick={() => setModal({ tipo: 'form' })}>+ Nuevo producto</button>}
      </header>

      {aviso && <div className={`aviso aviso--${aviso.tono}`} role="status"><Icono nombre={aviso.tono === 'error' ? 'alerta' : 'check'} tam={16} /> {aviso.texto}</div>}

      <section className="tarjeta">
        {productos.cargando && !productos.datos ? (
          <Cargando texto="Cargando productos…" />
        ) : productos.error ? (
          <ErrorCaja error={productos.error} onReintentar={productos.recargar} />
        ) : lista.length === 0 ? (
          <Vacio icono="hoja" titulo="Sin productos" texto={puedeGestionar ? 'Registra el primer producto.' : null} />
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr><th>Producto</th><th>Tipo</th><th>Código HS</th><th>Unidad</th><th className="derecha">Lotes</th>{puedeGestionar && <th aria-label="Acciones" />}</tr>
              </thead>
              <tbody>
                {lista.map((p) => {
                  const n = lotesDe(p.idProducto)
                  return (
                    <tr key={p.idProducto} className="tabla__fila--fija">
                      <td data-etiqueta="Producto">
                        <strong>{p.nombreComercial}</strong>
                        {p.variedad && <span className="celda-sub">Variedad {p.variedad}</span>}
                      </td>
                      <td data-etiqueta="Tipo"><span className={`badge badge--${p.tipo === 'CAFE' ? 'primario' : 'alerta'}`}>{TIPOS[p.tipo] ?? p.tipo}</span></td>
                      <td data-etiqueta="Código HS" className="mono">{p.codigoHs}</td>
                      <td data-etiqueta="Unidad">{p.unidadMedida}</td>
                      <td data-etiqueta="Lotes" className="derecha">
                        {n > 0 ? <Link className="enlace" to={`/lotes?producto=${p.idProducto}`}>{n}</Link> : <span className="texto-suave">0</span>}
                      </td>
                      {puedeGestionar && (
                        <td className="celda-accion">
                          <button className="boton boton--fantasma" onClick={() => setModal({ tipo: 'form', producto: p })}>Editar</button>
                          <button className="boton boton--fantasma texto-alerta" onClick={() => setModal({ tipo: 'eliminar', producto: p })} disabled={n > 0} title={n > 0 ? 'Tiene lotes registrados' : undefined}>Eliminar</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="texto-suave nota-pie">Un producto con lotes registrados no se puede eliminar. El código HS va en la factura y la declaración de aduanas (0901 café, 1801 cacao).</p>
      </section>

      {modal?.tipo === 'form' && (
        <ProductoForm producto={modal.producto} onCerrar={() => setModal(null)} onGuardado={(p, editado) => listo(editado ? `${p.nombreComercial} actualizado.` : `${p.nombreComercial} quedó en el catálogo.`)} />
      )}
      {modal?.tipo === 'eliminar' && (
        <EliminarProducto producto={modal.producto} onCerrar={() => setModal(null)} onHecho={() => listo(`${modal.producto.nombreComercial} se eliminó del catálogo.`)} />
      )}
    </div>
  )
}

function ProductoForm({ producto, onCerrar, onGuardado }) {
  const editando = Boolean(producto)
  const [form, setForm] = useState(() => (editando ? Object.fromEntries(Object.keys(VACIO).map((k) => [k, producto[k] ?? ''])) : VACIO))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo, t = (v) => v) => (e) => {
    setForm((f) => ({ ...f, [campo]: t(e.target.value) }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = {}
    if (!form.nombreComercial.trim()) er.nombreComercial = 'El nombre es obligatorio.'
    if (!HS.test(form.codigoHs)) er.codigoHs = 'De 4 a 10 dígitos, en pares (ej. 0901 o 090111).'
    else if (form.tipo === 'CAFE' && !form.codigoHs.startsWith('0901')) er.codigoHs = 'El café verde va en la partida 0901.'
    else if (form.tipo === 'CACAO' && !form.codigoHs.startsWith('18')) er.codigoHs = 'El cacao va en el capítulo 18 (ej. 1801).'
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const cuerpo = { ...form, nombreComercial: form.nombreComercial.trim(), variedad: form.variedad.trim() || null, unidadMedida: form.unidadMedida || 'KG' }
    try {
      const p = editando ? await productosApi.editar(producto.idProducto, cuerpo) : await productosApi.crear(cuerpo)
      onGuardado(p, editando)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
      setGuardando(false)
    }
  }

  const error = (c) => errores[c] && <span className="campo__error">{errores[c]}</span>

  return (
    <Modal
      titulo={editando ? 'Editar producto' : 'Nuevo producto'}
      subtitulo={editando ? producto.nombreComercial : 'Producto exportable con su código arancelario'}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>{guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Crear producto'}</button>
        </>
      }
    >
      <fieldset className="campo">
        <legend>Tipo</legend>
        <div className="opciones-estado">
          {Object.entries(TIPOS).map(([v, t]) => (
            <label key={v} className={`opcion-estado opcion-estado--primario ${form.tipo === v ? 'opcion-estado--activa' : ''}`}>
              <input type="radio" name="tipo" value={v} checked={form.tipo === v} onChange={cambiar('tipo')} /> {t}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="campo">
        <span>Nombre comercial</span>
        <input value={form.nombreComercial} onChange={cambiar('nombreComercial')} maxLength={100} autoFocus placeholder={form.tipo === 'CAFE' ? 'Café verde excelso' : 'Cacao en grano fino de aroma'} aria-invalid={!!errores.nombreComercial} />
        {error('nombreComercial')}
      </label>
      <div className="rejilla-campos">
        <label className="campo">
          <span>Variedad <em className="texto-suave">(opcional)</em></span>
          <input value={form.variedad} onChange={cambiar('variedad')} maxLength={80} placeholder={form.tipo === 'CAFE' ? 'Castillo, Caturra…' : 'Trinitario, CCN-51…'} />
        </label>
        <label className="campo">
          <span>Código HS</span>
          <input className="mono" inputMode="numeric" value={form.codigoHs} onChange={cambiar('codigoHs', (v) => v.replace(/\D/g, ''))} maxLength={10} placeholder={form.tipo === 'CAFE' ? '090111' : '180100'} aria-invalid={!!errores.codigoHs} />
          {error('codigoHs')}
        </label>
      </div>
      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}

function EliminarProducto({ producto, onCerrar, onHecho }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const confirmar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await productosApi.eliminar(producto.idProducto)
      onHecho()
    } catch (err) {
      setError(err.estado === 409 ? 'No se puede eliminar: el producto ya tiene lotes o reglas asociadas.' : err.message)
      setEnviando(false)
    }
  }
  return (
    <Modal
      titulo="Eliminar producto"
      onCerrar={onCerrar}
      bloqueado={enviando}
      onSubmit={confirmar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button className="boton boton--peligro" disabled={enviando}>{enviando ? <span className="spinner spinner--claro" /> : 'Eliminar'}</button>
        </>
      }
    >
      <p>{producto.nombreComercial} (HS {producto.codigoHs}) se elimina del catálogo. Esta acción no se puede deshacer.</p>
      {error && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {error}</div>}
    </Modal>
  )
}
