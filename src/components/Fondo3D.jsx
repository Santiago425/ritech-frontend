import { useEffect, useRef } from 'react'

const CANTIDAD_GRANOS = 70
const CANTIDAD_PARTICULAS = 260

function crearGrano(THREE) {
  const geometria = new THREE.SphereGeometry(1, 40, 28)
  const pos = geometria.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const surco = Math.exp(-(v.x * v.x) / 0.01) * Math.max(0, v.z) * 0.45
    const curva = Math.sin(v.y * 2.2) * 0.06
    pos.setXYZ(i, (v.x + curva) * 0.72, v.y * 1.0, v.z * 0.5 - surco)
  }
  geometria.computeVertexNormals()
  return geometria
}

export default function Fondo3D() {
  const contenedor = useRef(null)

  useEffect(() => {
    const nodo = contenedor.current
    if (!nodo) return
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cancelado = false
    let limpiar = () => {}

    import('three').then((THREE) => {
      if (cancelado) return
      let renderer
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      } catch {
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.45
      nodo.appendChild(renderer.domElement)

      const escena = new THREE.Scene()
      escena.fog = new THREE.FogExp2(0x140d08, 0.032)
      const camara = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      camara.position.set(0, 0, 16)

      escena.add(new THREE.HemisphereLight(0xffe2b8, 0x16324a, 1.1))
      const clave = new THREE.DirectionalLight(0xffd19a, 3.4)
      clave.position.set(6, 8, 10)
      escena.add(clave)
      const contraluz = new THREE.PointLight(0xc8893b, 60, 40)
      contraluz.position.set(-8, -4, 4)
      escena.add(contraluz)
      const fria = new THREE.PointLight(0x4f8fc0, 30, 40)
      fria.position.set(10, -6, -2)
      escena.add(fria)

      const geometria = crearGrano(THREE)
      const material = new THREE.MeshPhysicalMaterial({ color: 0x7a4a24, roughness: 0.32, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color(0xc8893b) })
      const granos = new THREE.InstancedMesh(geometria, material, CANTIDAD_GRANOS)
      const datos = []
      const tonos = [0x7a4a24, 0x8b5a2b, 0x6b3f1d, 0x9a6531, 0x5e3518]
      const color = new THREE.Color()
      for (let i = 0; i < CANTIDAD_GRANOS; i++) {
        datos.push({
          x: (Math.random() - 0.5) * 34,
          y: (Math.random() - 0.5) * 22,
          z: -Math.random() * 22 + 4,
          rx: Math.random() * Math.PI * 2,
          ry: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.5,
          vy: 0.15 + Math.random() * 0.35,
          escala: 0.35 + Math.random() * 0.55,
          fase: Math.random() * Math.PI * 2,
        })
        granos.setColorAt(i, color.setHex(tonos[i % tonos.length]))
      }
      escena.add(granos)

      const puntos = new Float32Array(CANTIDAD_PARTICULAS * 3)
      for (let i = 0; i < CANTIDAD_PARTICULAS; i++) {
        puntos[i * 3] = (Math.random() - 0.5) * 40
        puntos[i * 3 + 1] = (Math.random() - 0.5) * 26
        puntos[i * 3 + 2] = -Math.random() * 24 + 2
      }
      const geoParticulas = new THREE.BufferGeometry()
      geoParticulas.setAttribute('position', new THREE.BufferAttribute(puntos, 3))
      const particulas = new THREE.Points(geoParticulas, new THREE.PointsMaterial({
        color: 0xf3c77f, size: 0.07, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      escena.add(particulas)

      const matriz = new THREE.Matrix4()
      const cuaternion = new THREE.Quaternion()
      const euler = new THREE.Euler()
      const posicion = new THREE.Vector3()
      const escala = new THREE.Vector3()
      const raton = { x: 0, y: 0, tx: 0, ty: 0 }
      const reloj = new THREE.Clock()
      let cuadro = 0
      let scroll = 0

      const ajustar = () => {
        const { clientWidth: w, clientHeight: h } = nodo
        renderer.setSize(w, h, false)
        camara.aspect = w / Math.max(h, 1)
        camara.updateProjectionMatrix()
      }
      const alMover = (e) => {
        raton.tx = (e.clientX / window.innerWidth - 0.5) * 2
        raton.ty = (e.clientY / window.innerHeight - 0.5) * 2
      }
      const alScroll = () => { scroll = window.scrollY }

      const dibujar = () => {
        const dt = Math.min(reloj.getDelta(), 0.05)
        const t = reloj.elapsedTime
        raton.x += (raton.tx - raton.x) * 0.04
        raton.y += (raton.ty - raton.y) * 0.04
        camara.position.x = raton.x * 1.6
        camara.position.y = -raton.y * 1.1 - scroll * 0.0015
        camara.lookAt(0, -scroll * 0.0015, -6)

        for (let i = 0; i < CANTIDAD_GRANOS; i++) {
          const d = datos[i]
          d.y += d.vy * dt
          if (d.y > 13) d.y = -13
          d.rx += d.vr * dt
          d.ry += d.vr * 0.7 * dt
          posicion.set(d.x + Math.sin(t * 0.3 + d.fase) * 0.6, d.y, d.z)
          cuaternion.setFromEuler(euler.set(d.rx, d.ry, Math.sin(t * 0.2 + d.fase) * 0.4))
          escala.setScalar(d.escala)
          granos.setMatrixAt(i, matriz.compose(posicion, cuaternion, escala))
        }
        granos.instanceMatrix.needsUpdate = true
        particulas.rotation.y = t * 0.015
        particulas.position.y = Math.sin(t * 0.2) * 0.3
        contraluz.intensity = 55 + Math.sin(t * 0.8) * 10
        renderer.render(escena, camara)
        if (!reducido) cuadro = requestAnimationFrame(dibujar)
      }

      const alVisibilidad = () => {
        cancelAnimationFrame(cuadro)
        if (!document.hidden && !reducido) {
          reloj.getDelta()
          cuadro = requestAnimationFrame(dibujar)
        }
      }

      const observador = new ResizeObserver(ajustar)
      observador.observe(nodo)
      ajustar()
      window.addEventListener('pointermove', alMover, { passive: true })
      window.addEventListener('scroll', alScroll, { passive: true })
      document.addEventListener('visibilitychange', alVisibilidad)
      dibujar()
      requestAnimationFrame(() => nodo.classList.add('fondo-3d--listo'))

      limpiar = () => {
        cancelAnimationFrame(cuadro)
        observador.disconnect()
        window.removeEventListener('pointermove', alMover)
        window.removeEventListener('scroll', alScroll)
        document.removeEventListener('visibilitychange', alVisibilidad)
        geometria.dispose()
        material.dispose()
        geoParticulas.dispose()
        particulas.material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => {
      cancelado = true
      limpiar()
    }
  }, [])

  return <div ref={contenedor} className="fondo-3d" aria-hidden="true" />
}
