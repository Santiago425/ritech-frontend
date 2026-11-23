# RiTech Exports · Componente de IA

Servicio independiente del backend, en Python con FastAPI. El frontend lo llama directamente por HTTP y no sabe qué modelo hay detrás.

| Endpoint | Qué hace |
|---|---|
| `POST /api/v1/dashboard-summary` | Resumen en lenguaje natural del tablero de Inicio: lo urgente primero (incidencias, lotes rechazados, certificados por vencer), ventas y una recomendación |
| `POST /api/v1/lot-analysis` | Explica el dictamen de cumplimiento UE de un lote (EUDR, contaminantes, humedad, fitosanitario) y da los pasos para corregirlo |
| `POST /api/v1/shipment-event` | Convierte lo que escribe el gestor ("retraso por tormenta en el canal de Panamá") en un evento de seguimiento: estado, ubicación y observación para el cliente |
| `POST /api/v1/chat` | RiBot, asistente que responde dudas sobre la plataforma y la normativa europea |
| `GET /api/v1/models` | Proveedor activo |
| `POST /api/v1/models/switch` | Cambiar de proveedor en caliente (header `X-Admin-Token` si se configuró `ADMIN_TOKEN`) |

## Proveedores

`LLM_PROVIDER`: `auto` (por defecto) · `gemini` · `openai_compatible` (Groq, OpenRouter, LM Studio…) · `reglas`.

Con `auto`, si existe `GEMINI_API_KEY` se usa Gemini; si no, todo responde con reglas. Si Gemini falla, la respuesta se arma con las reglas y lo indica en `model` (`"reglas (respaldo de gemini:...)"`), así la app nunca se queda sin respuesta.

## Correr

```bash
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8001
pytest
```

## Activar Gemini

1. Crear una llave gratis en https://aistudio.google.com/apikey
2. En Render, en el servicio `ritech-ia`: **Environment** → agregar `GEMINI_API_KEY` → guardar.
3. `ALLOWED_ORIGINS` debe incluir la URL del frontend.
