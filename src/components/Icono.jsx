const RUTAS = {
  inicio: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  barco: 'M2 20c1.7 1 3.3 1 5 0s3.3-1 5 0 3.3 1 5 0 3.3-1 5 0M4.5 17 3 12h18l-1.5 5M6 12V8h12v4M10 8V5h4v3',
  salir: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  flecha: 'M15 18l-6-6 6-6',
  ancla: 'M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 8v13M5 13a7 7 0 0 0 14 0M8 11h8',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  contenedor: 'M3 7h18v10H3zM7 7v10M11 7v10M15 7v10M19 7v10',
  documento: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  alerta: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  check: 'M5 12l5 5L20 7',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  menu: 'M4 6h16M4 12h16M4 18h16',
  recargar: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  camion: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
}

export default function Icono({ nombre, tam = 18, className = '' }) {
  return (
    <svg
      className={`icono ${className}`}
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={RUTAS[nombre]} />
    </svg>
  )
}
