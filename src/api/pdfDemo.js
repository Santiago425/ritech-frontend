// Genera un PDF sencillo (una página, texto) para el modo demo, sin dependencias.
const escapar = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '?').replace(/([()\\])/g, '\\$1')

export function pdfDemo(titulo, lineas) {
  const contenido = [
    'BT', '/F1 18 Tf', '50 790 Td', `(${escapar(titulo)}) Tj`, '/F1 10 Tf', '0 -14 Td', '(RiTech Exports S.A.S. - documento de ejemplo del modo demo) Tj',
    '0 -26 Td', '/F1 11 Tf',
    ...lineas.flatMap((l) => [`(${escapar(l)}) Tj`, '0 -16 Td']),
    'ET',
  ].join('\n')
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const posiciones = []
  objetos.forEach((o, i) => {
    posiciones.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${posiciones.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}
