/** Abre un PDF (u otro archivo visible) en una pestaña nueva. Hay que llamar a abrirVentana() antes del await. */
export function abrirVentana() {
  return window.open('', '_blank')
}

export function mostrarEnVentana(ventana, { blob, nombre }) {
  const url = URL.createObjectURL(blob)
  if (ventana && !ventana.closed) {
    ventana.location.href = url
    try { ventana.document.title = nombre } catch { /* otra pestaña */ }
  } else {
    guardarArchivo({ blob, nombre })
  }
  setTimeout(() => URL.revokeObjectURL(url), 120000)
}

/** Guarda el archivo con su nombre en la carpeta de descargas. */
export function guardarArchivo({ blob, nombre }) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
