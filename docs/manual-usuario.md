# Manual de usuario por rol — RiTech Exports

**Historia:** SCRUM-66 · **Versión:** 1.0 · **Fecha:** 11 de noviembre de 2026
**Aplicación:** https://ritech-frontend-atwu.onrender.com
**Responsable:** Santiago Campoverde (Frontend)

RiTech Exports es el sistema para exportar café y cacao colombiano a la Unión Europea con trazabilidad hasta la finca, cumpliendo el Reglamento EUDR (UE 2023/1115). Este manual explica qué puede hacer cada rol y cómo hacerlo, paso a paso.

> Las capturas están en [`docs/capturas`](capturas).

---

## 1. Primeros pasos (todos los roles)

### 1.1 Iniciar sesión
1. Abra la aplicación en el navegador.
2. Escriba su correo y contraseña y pulse **Ingresar**.
3. En el ambiente de pruebas, la pantalla muestra las cuentas de prueba. Pulse una para llenar el correo automáticamente.

**[Captura: login-cuentas-prueba.png]**

| Rol | Cuenta de prueba |
|---|---|
| Administrador | admin@ritech.co |
| Gestor de exportaciones | gestor@ritech.co |
| Inspector de calidad | inspector@ritech.co |
| Cliente UE | cliente@importadora-eu.com |

Después de 5 intentos fallidos la cuenta se bloquea y un administrador debe desbloquearla.

### 1.2 Navegación
- El **menú lateral** solo muestra los módulos que su rol puede usar.
- Arriba a la derecha está su nombre, su rol y el botón para **cerrar sesión**.
- En el celular, el menú se abre con el botón de las tres rayas.
- La sesión dura un tiempo limitado. Si vence, el sistema lo devuelve al inicio de sesión con el mensaje *"Debe iniciar sesion o el token vencio."*

### 1.3 Estados que verá en todo el sistema

| Elemento | Estados |
|---|---|
| Lote | Registrado → En inspección → Aprobado / Rechazado → Asignado a orden → Exportado |
| Orden | Borrador → Confirmada → En tránsito → Entregada (o Anulada) |
| Envío | Programado → En tránsito → En puerto destino → Entregado (o Incidencia) |
| Dictamen UE | Cumple / No cumple / Sin evaluar |

---

## 2. Administrador

El administrador tiene acceso a **todos** los módulos. Además de lo que hace el gestor y el inspector, administra la seguridad.

### 2.1 Usuarios y roles (SCRUM-9)
**Ruta:** menú **Seguridad → Usuarios**

1. Pulse **+ Nuevo usuario**.
2. Llene nombre, correo, rol y contraseña inicial.
3. Si el rol es **Cliente UE**, elija la empresa importadora a la que pertenece.
4. Pulse **Crear usuario**.

Para activar, inactivar o desbloquear una cuenta use el botón de la fila. La pestaña **Roles y permisos** muestra la matriz de qué puede hacer cada rol.

**[Captura: usuarios-nuevo.png]** **[Captura: roles-permisos.png]**

### 2.2 Auditoría (SCRUM-10)
**Ruta:** menú **Seguridad → Auditoría**

Muestra quién cambió qué y cuándo. Filtre por tabla, acción, usuario o fechas. Pulse una fila para ver el valor **antes** y **después** del cambio.

**[Captura: auditoria.png]**

### 2.3 Mensajes frecuentes

| Mensaje | Qué significa / qué hacer |
|---|---|
| No puede cambiar su propio rol. | Pida a otro administrador que lo haga. |
| No puede inactivar ni bloquear su propia cuenta. | Igual que el anterior. |
| Un usuario con rol CLIENTE_UE debe indicar idCliente. | Elija la empresa importadora en el formulario. |

---

## 3. Gestor de exportaciones

Es el rol que más usa el sistema: clientes, productores, lotes, órdenes, envíos, cumplimiento UE y reportes.

### 3.1 Tablero de inicio (SCRUM-31)
Al entrar ve los indicadores del negocio: órdenes, kg exportados, lotes aprobados y envíos en tránsito; la gráfica de valor vendido por mes (puede cambiar EUR/USD); órdenes y lotes por estado; y los envíos activos. Pulse cualquier indicador para ir al módulo.

**[Captura: tablero.png]**

### 3.2 Clientes UE (SCRUM-11, 12)
**Ruta:** **Comercial → Clientes UE**

1. Pulse **+ Nuevo cliente**.
2. Llene razón social, país (debe ser de la UE), **EORI**, **VAT**, ciudad y contacto.
3. Pulse **Guardar**.

Puede buscar por nombre y filtrar por país o estado.

**[Captura: clientes-lista.png]** **[Captura: clientes-formulario.png]**

### 3.3 Productores y fincas (SCRUM-14)
**Ruta:** **Origen → Productores y fincas**

1. Cree el productor (nombre, documento, municipio).
2. Entre al productor y pulse **+ Nueva finca**.
3. Indique área en hectáreas, coordenadas y, si la finca tiene **más de 4 ha**, dibuje el **polígono** en el mapa (obligatorio por EUDR).

**[Captura: productor-fincas.png]** **[Captura: finca-formulario-mapa.png]**

### 3.4 Productos (SCRUM-13)
**Ruta:** **Origen → Productos**

Registre café o cacao con su **código arancelario HS** (0901 café, 1801 cacao). Un producto que ya tiene lotes no se puede eliminar.

**[Captura: productos.png]**

### 3.5 Lotes y trazabilidad (SCRUM-15, 16, 19)
**Ruta:** **Origen → Lotes**

1. Pulse **+ Registrar lote**: producto, pesos neto y bruto, humedad, fecha de cosecha. El código (CAF-AAAA-NNNN o CAC-AAAA-NNNN) se genera solo si no lo escribe.
2. Entre al lote, pestaña **Fincas de origen**, y pulse **+ Agregar finca** con el porcentaje que aporta cada una.
3. Cuando los aportes sumen **100 %**, pulse **Verificar trazabilidad**.

**[Captura: lote-fincas-origen.png]** **[Captura: lote-trazabilidad.png]**

### 3.6 Cumplimiento UE (SCRUM-20 a 24)
**Ruta:** pestaña **Cumplimiento UE** del lote, y menú **Origen → Cumplimiento UE**

- **Validar lote:** pulse **Validar ahora**. El sistema revisa las reglas normativas y da el dictamen **Cumple / No cumple** con el detalle de cada parámetro.
- **Certificados:** pulse **+ Cargar certificado**, elija el tipo, fechas y adjunte el soporte (PDF, JPG o PNG).
- **Declaración DDS (EUDR):** con trazabilidad al 100 % y dictamen **Cumple**, pulse **Ver DDS** para el PDF, o **GeoJSON** para descargar las coordenadas de las fincas.
- En la página **Cumplimiento UE** verá las **alertas de certificados por vencer** y podrá crear o activar/desactivar **reglas normativas**.

**[Captura: dictamen-cumplimiento.png]** **[Captura: alertas-certificados.png]** **[Captura: reglas-normativas.png]**

### 3.7 Órdenes de exportación (SCRUM-25, 26, 27)
**Ruta:** **Comercial → Órdenes**

1. Pulse **+ Nueva orden**: cliente, Incoterm, moneda y puertos.
2. En el detalle, pulse **Asignar lote** y elija lotes **aprobados**, con kg y precio por kg.
3. Pulse **Confirmar orden**.
4. Ya confirmada, en la tarjeta **Documentos** descargue la **Factura comercial** y la **Lista de empaque** (botón **Ver** o **PDF**).

**[Captura: ordenes-lista.png]** **[Captura: orden-detalle.png]**

### 3.8 Envíos y seguimiento (SCRUM-28, 29, 30)
1. En la orden confirmada pulse **Programar envío**: transportista, contenedor, booking y fechas de zarpe y arribo.
2. Desde **Logística → Envíos**, abra el envío y pulse **Registrar evento** (zarpe, llegada a puerto, retraso, incidencia, entrega).

**[Captura: programar-envio.png]** **[Captura: registrar-evento.png]** **[Captura: detalle-envio.png]**

### 3.9 Reportes (SCRUM-32)
**Ruta:** **General → Reportes**

1. Elija el periodo (Todo, Este mes, Últimos 3 meses, Este año) o unas fechas.
2. Elija **Excel (.xlsx)** o **CSV**.
3. Pulse **Descargar** en Órdenes, Lotes o Envíos.

**[Captura: reportes.png]**

### 3.10 Mensajes de error normativo y de negocio más frecuentes

| Mensaje | Qué hacer |
|---|---|
| EORI invalido: dos letras mayusculas de pais y 12 a 15 caracteres alfanumericos | Revise el EORI, ej. DE123456789012. |
| Ya existe un cliente con el EORI … | El cliente ya está registrado; búsquelo en la lista. |
| El pais del importador debe ser miembro de la Union Europea. | Solo se exporta a países de la UE. |
| Las fincas de mas de 4 hectareas requieren poligono de geolocalizacion (EUDR). | Dibuje el polígono de la finca en el mapa. |
| El poligono debe ser GeoJSON con 'type' y 'coordinates'. | Vuelva a dibujar el polígono. |
| El peso bruto no puede ser menor que el peso neto. | Corrija los pesos del lote. |
| Solo se puede editar un lote en estado REGISTRADO. | Después de la inspección el lote ya no se edita. |
| Solo pueden asignarse lotes en estado APROBADO | Espere a que el inspector apruebe el lote. |
| Una orden sin lotes no se puede confirmar. | Asigne al menos un lote. |
| No se puede crear una orden para un cliente inactivo. | Active primero el cliente. |
| Exige trazabilidad completa (100 %) y dictamen CUMPLE | Complete las fincas de origen y valide el lote antes de pedir la DDS. |
| No es posible cargar un certificado ya vencido. | Cargue un certificado vigente. |
| La fecha de vencimiento debe ser posterior a la fecha de emision. | Corrija las fechas del certificado. |
| El arribo estimado no puede ser anterior al zarpe. | Corrija las fechas del envío. |
| El envio ya fue entregado; no admite mas eventos. | El envío está cerrado. |
| La fecha 'desde' no puede ser posterior a 'hasta'. | Corrija el periodo del reporte. |

---

## 4. Inspector de calidad

### 4.1 Inicio
El tablero le muestra un aviso con los **lotes que esperan inspección**. Púlselo para ir directo a ellos.

### 4.2 Registrar inspección (SCRUM-18)
**Ruta:** **Origen → Lotes** → abrir el lote → **Registrar inspección**

1. Escriba humedad, defectos, puntaje de taza (café) o fermentación (cacao) y observaciones.
2. Elija el resultado: **Aprobado** o **Rechazado**. Si rechaza, escriba el motivo.
3. Pulse **Guardar**. El estado del lote cambia solo.

**[Captura: inspeccion-rechazo.png]**

### 4.3 Cargar certificados (SCRUM-21)
En la pestaña **Cumplimiento UE** del lote pulse **+ Cargar certificado** y adjunte el soporte (PDF, JPG o PNG).

### 4.4 Mensajes frecuentes

| Mensaje | Qué hacer |
|---|---|
| No se puede inspeccionar un lote en estado … | Solo se inspeccionan lotes registrados o en inspección. |
| El soporte debe ser PDF, JPG o PNG. | Convierta el archivo a uno de esos formatos. |
| Su rol no tiene permiso para esta operacion. | Esa acción es del gestor o del administrador. |

---

## 5. Cliente UE (importador)

El cliente solo ve la información de **su propia empresa**.

### 5.1 Seguimiento de envíos (SCRUM-30)
Al entrar ve el resumen de sus envíos: cuántos van en tránsito, cuáles llegan pronto y si alguno tiene incidencia.

1. Pulse un envío para ver la ruta, el contenedor, la fecha estimada de arribo y la **bitácora** de eventos.
2. Si un envío está retrasado o tiene incidencia, aparece resaltado en naranja o rojo.

**[Captura: lista-envios.png]** **[Captura: detalle-envio.png]** **[Captura: celular-incidencia.png]**

### 5.2 Consultar lotes y su origen
En **Lotes** puede ver los lotes de sus órdenes, sus fincas de origen y el dictamen de cumplimiento UE. Cuando el lote cumple, puede descargar la **declaración DDS** para su autoridad aduanera.

### 5.3 Mensajes frecuentes

| Mensaje | Qué hacer |
|---|---|
| El lote aún no está asignado a una orden de exportación | Ese lote todavía no es parte de su pedido. |
| Su rol no tiene permiso para esta operacion. | Contacte a RiTech para cambios en su orden. |

---

## 6. Preguntas frecuentes

**¿Olvidé mi contraseña?** Pídale al administrador que la restablezca.
**¿Por qué no veo un módulo del menú?** Su rol no tiene permiso para él (vea la matriz en Seguridad → Usuarios → Roles y permisos).
**¿El PDF no abre?** Permita ventanas emergentes para el sitio o use el botón **PDF** para descargarlo.
**¿Funciona en el celular?** Sí, todas las pantallas se adaptan al celular.
