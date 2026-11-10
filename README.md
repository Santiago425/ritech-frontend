# RiTech Exports — Frontend

Interfaz web del sistema de gestión de exportaciones de café y cacao hacia la Unión Europea.
Consume la API REST de [BACKEND-CACAO](https://github.com/walterjojoa/BACKEND-CACAO).

- React 19 · Vite 6 · React Router 7
- Autenticación con JWT (`POST /api/auth/login`), sesión guardada en el navegador y cierre automático al expirar
- Menú y permisos según el rol: Administrador, Gestor de exportaciones, Inspector de calidad y Cliente UE
- Diseño adaptable a escritorio y celular

## Funcionalidades

| Historia | Pantalla | Endpoints que usa |
|---|---|---|
| SCRUM-8 Iniciar sesión | `/login` | `POST /api/auth/login` |
| SCRUM-30 Consultar estado y ubicación del envío | `/envios`, `/envios/:id` | `GET /api/envios?estado=`, `GET /api/envios/{id}` |

**Inicio:** resumen con indicadores (envíos totales, en tránsito, entregados, con incidencia) y próximos arribos.

**Envíos:** listado con filtro por estado y búsqueda por contenedor, booking o puerto. Un Cliente UE solo ve
los envíos de sus propias órdenes (lo filtra el backend).

**Detalle del envío:** ruta origen → destino con la ubicación del último reporte, progreso por etapas
(Programado, En puerto, En tránsito, Arribado, Entregado), aviso destacado si hay una incidencia, alerta de
retraso frente al arribo estimado, datos del envío (orden, transportista, contenedor ISO 6346, booking/BL) y
bitácora completa de seguimiento.

## Ejecutar en local

Requisitos: Node.js 18 o superior y el backend corriendo en `http://localhost:8080`.

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev
```

Abrir `http://localhost:5173` e ingresar con un usuario semilla del backend, por ejemplo
`cliente@importadora-eu.com` o `gestor@ritech.co`.

El backend ya permite peticiones desde `http://localhost:5173` (variable `ALLOWED_ORIGINS`).

### Modo demo (sin backend)

Para presentar o revisar la interfaz sin levantar MySQL ni el backend, poner en `.env`:

```
VITE_MODO_DEMO=true
```

Cualquier correo semilla funciona con cualquier contraseña y se muestran envíos de ejemplo.

## Variables de entorno

| Variable | Para qué | Por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:8080` |
| `VITE_MODO_DEMO` | Usar datos de ejemplo sin backend | `false` |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve la compilación de `dist/` |
| `npm run lint` | Revisa el código con ESLint |

## Estructura

```
src/
  api/          cliente HTTP, manejo de errores del backend y datos del modo demo
  auth/         sesión, rol y permisos del usuario
  components/   menú, ruta del envío, etapas, bitácora, estados de carga
  pages/        login, inicio, envíos y detalle del envío
  styles/       estilos globales
```
