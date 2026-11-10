import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { productoresApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import ProductorForm from '../components/ProductorForm.jsx'
import { useCarga } from '../hooks.js'

const normalizar = (t) => (t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** SCRUM-14: productores proveedores; desde aquí se entra a sus fincas. */
export default function Productores() {
  const { tienePermiso } = useSesion()
  const puedeGestionar = tienePermiso('PRODUCTORES_GESTIONAR')
  const navigate = useNavigate()
  const { datos, error, cargando, recargar } = useCarga(() => productoresApi.listar())
  const [busqueda, setBusqueda] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [nuevo, setNuevo] = useState(false)

  const departamentos = useMemo(() => [...new Set((datos ?? []).map((p) => p.departamento))].sort(), [datos])
  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return (datos ?? []).filter((p) =>
      (!departamento || p.departamento === departamento) &&
      (!q || [p.nombre, p.nitOCedula, p.municipio].some((v) => normalizar(v).includes(q))),
    )
  }, [datos, busqueda, departamento])

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Origen</span>
          <h1>Productores y fincas</h1>
          <p className="texto-suave">Proveedores de café y cacao y los predios de donde sale cada lote.</p>
        </div>
        {puedeGestionar && <button className="boton boton--primario" onClick={() => setNuevo(true)}>+ Nuevo productor</button>}
      </header>

      <section className="tarjeta">
        <div className="filtros">
          <div className="filtros__grupo">
            <label className="buscador">
              <Icono nombre="buscar" tam={16} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, NIT/cédula o municipio" aria-label="Buscar productor" />
            </label>
            <select className="selector" value={departamento} onChange={(e) => setDepartamento(e.target.value)} aria-label="Filtrar por departamento">
              <option value="">Todos los departamentos</option>
              {departamentos.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          {datos && <span className="texto-suave contador">{filtrados.length} {filtrados.length === 1 ? 'productor' : 'productores'}</span>}
        </div>

        {cargando ? (
          <Cargando texto="Cargando productores…" />
        ) : error ? (
          <ErrorCaja error={error} onReintentar={recargar} />
        ) : filtrados.length === 0 ? (
          <Vacio icono="hoja" titulo={datos.length ? 'Sin resultados' : 'Aún no hay productores'} texto={datos.length ? 'Prueba con otra búsqueda.' : null} />
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th>Productor</th>
                  <th>NIT / cédula</th>
                  <th>Ubicación</th>
                  <th>Teléfono</th>
                  <th aria-label="Abrir" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.idProductor} onClick={() => navigate(`/productores/${p.idProductor}`)}>
                    <td data-etiqueta="Productor"><strong>{p.nombre}</strong></td>
                    <td data-etiqueta="NIT / cédula" className="mono">{p.nitOCedula}</td>
                    <td data-etiqueta="Ubicación">{p.municipio}, {p.departamento}</td>
                    <td data-etiqueta="Teléfono">{p.telefono ?? '—'}</td>
                    <td className="celda-accion"><span className="boton boton--fantasma">Ver fincas</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {nuevo && (
        <ProductorForm
          onCerrar={() => setNuevo(false)}
          onGuardado={(p) => navigate(`/productores/${p.idProductor}`, { state: { creado: true } })}
        />
      )}
    </div>
  )
}
