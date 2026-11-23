import { FOTOS, RECORRIDO } from '../fotos.js'

export default function Recorrido() {
  return (
    <section className="recorrido" aria-label="Del cafetal al puerto">
      <div className="recorrido__cabecera">
        <h2>Del cafetal al puerto europeo</h2>
        <p className="texto-suave">Cada lote que gestionas en RiTech recorre este camino.</p>
      </div>
      <ol className="recorrido__pasos">
        {RECORRIDO.map((p, i) => (
          <li key={p.titulo} className="recorrido__paso" style={{ backgroundImage: `url(${FOTOS[p.foto](700)})` }}>
            <span className="recorrido__numero">{i + 1}</span>
            <div>
              <strong>{p.titulo}</strong>
              <span>{p.texto}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
