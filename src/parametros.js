/** Nombres legibles de los parámetros que evalúan las reglas normativas de la UE. */
const PARAMETROS = {
  geolocalizacion_fincas: 'Fincas geolocalizadas (%)',
  poligono_si_area_mayor_4ha: 'Polígono en fincas > 4 ha',
  suma_aportes_finca: 'Suma de aportes (%)',
  ocratoxina_a_cafe: 'Ocratoxina A (µg/kg)',
  aflatoxinas_cacao: 'Aflatoxinas (µg/kg)',
  humedad_cafe_verde: 'Humedad (%)',
  certificado_fitosanitario_vigente: 'Fitosanitario vigente',
  eori_importador_valido: 'EORI del importador válido',
}

export const nombreParametro = (p) => PARAMETROS[p] ?? p
