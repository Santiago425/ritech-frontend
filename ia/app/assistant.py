import logging
import unicodedata

from .providers import LLMProvider, parse_json, provider_label

log = logging.getLogger("ritech.ia")

ORDER_STATES = {"BORRADOR": "en borrador", "CONFIRMADA": "confirmadas", "EN_TRANSITO": "en tránsito", "ENTREGADA": "entregadas", "ANULADA": "anuladas"}
LOT_STATES = {"REGISTRADO": "registrados", "EN_INSPECCION": "en inspección", "APROBADO": "aprobados", "RECHAZADO": "rechazados", "ASIGNADO": "asignados a orden", "EXPORTADO": "exportados"}
SHIPMENT_STATES = {"PROGRAMADO": "Programado", "EN_PUERTO": "En puerto", "EN_TRANSITO": "En tránsito", "ARRIBADO": "Arribado", "ENTREGADO": "Entregado", "INCIDENCIA": "Incidencia"}
STEPS = ["PROGRAMADO", "EN_PUERTO", "EN_TRANSITO", "ARRIBADO", "ENTREGADO"]

PARAMETERS = {
    "geolocalizacion_fincas": "geolocalización de las fincas",
    "poligono_si_area_mayor_4ha": "polígono de las fincas de más de 4 hectáreas",
    "suma_aportes_finca": "suma de aportes de las fincas",
    "ocratoxina_a_cafe": "ocratoxina A del café",
    "aflatoxinas_cacao": "aflatoxinas del cacao",
    "humedad_cafe_verde": "humedad del café verde",
    "certificado_fitosanitario_vigente": "certificado fitosanitario vigente",
    "eori_importador_valido": "EORI del importador",
}

FIXES = {
    "geolocalizacion_fincas": "Registra latitud y longitud de todas las fincas que aportan al lote en Productores y fincas.",
    "poligono_si_area_mayor_4ha": "Dibuja en el mapa el polígono de cada finca de más de 4 ha (lo exige el EUDR).",
    "suma_aportes_finca": "Ajusta los aportes de las fincas en la trazabilidad del lote hasta que sumen 100 %.",
    "ocratoxina_a_cafe": "El café supera el límite de ocratoxina A: hay que separar el lote o repetir el análisis de laboratorio.",
    "aflatoxinas_cacao": "El cacao supera el límite de aflatoxinas: hay que repetir el análisis o descartar el lote.",
    "humedad_cafe_verde": "La humedad está por fuera del rango: hay que secar el café y registrar una nueva inspección.",
    "certificado_fitosanitario_vigente": "Carga un certificado fitosanitario vigente con su soporte en la pestaña de cumplimiento.",
    "eori_importador_valido": "Corrige el EORI del cliente importador (dos letras de país y de 12 a 15 caracteres).",
}

APP_GUIDE = [
    "RiTech Exports es una plataforma para exportadores colombianos de café y cacao que venden a la Unión Europea.",
    "Flujo: productores y fincas geolocalizadas -> lotes con aportes de fincas -> inspección de calidad -> certificados",
    "-> validación normativa UE (EUDR, contaminantes, humedad, fitosanitario) -> orden de exportación con lotes aprobados",
    "-> confirmar orden -> programar envío (desde el detalle de la orden confirmada) -> registrar eventos del envío hasta entregado.",
    "Módulos: Inicio, Reportes (Excel/CSV), Clientes UE, Órdenes, Productores y fincas, Productos, Lotes, Cumplimiento UE, Envíos, Usuarios y roles, Auditoría.",
    "Roles: Administrador (todo), Gestor de exportaciones (clientes, productores, lotes, órdenes, envíos), Inspector de calidad (inspecciones y certificados), Cliente UE (sus órdenes, lotes y envíos).",
    "La declaración DDS del lote se descarga cuando la trazabilidad está al 100 % y el dictamen es Cumple.",
    "El EUDR (Reglamento UE 2023/1115) exige probar que el café y el cacao no vienen de tierras deforestadas después del 31/12/2020, con geolocalización de cada finca.",
]

FAQ = [
    (("envio", "programar", "despacho"), "Los envíos se programan desde una orden confirmada: entra a Órdenes, abre la orden, asígnale lotes aprobados, confírmala y pulsa «Programar envío». Después, en Envíos, registras los eventos (zarpe, puerto, incidencia, entrega)."),
    (("eudr", "deforestacion", "reglamento"), "El EUDR (Reglamento UE 2023/1115) exige demostrar que el café y el cacao no provienen de tierras deforestadas después del 31 de diciembre de 2020. En RiTech eso se cubre geolocalizando cada finca (con polígono si mide más de 4 ha) y cerrando la trazabilidad del lote al 100 %."),
    (("dds", "declaracion"), "La declaración DDS se descarga en el detalle del lote cuando la trazabilidad está al 100 % y el dictamen de cumplimiento UE es «Cumple»."),
    (("lote", "aprobar", "inspeccion"), "Un lote se aprueba con una inspección de calidad (humedad, defectos, contaminantes). Si queda rechazado puedes registrar otra inspección; los lotes aprobados son los únicos que se pueden asignar a una orden."),
    (("orden", "confirmar"), "Para confirmar una orden necesita al menos un lote aprobado asignado. Una vez confirmada ya puedes programar su envío o volverla a borrador mientras no tenga envío."),
    (("certificado", "fitosanitario", "vence", "vencer"), "Los certificados se cargan en la pestaña de cumplimiento del lote con su archivo de soporte. En Cumplimiento UE ves los que están por vencer en los próximos días."),
    (("finca", "poligono", "mapa", "productor"), "En Productores y fincas registras al productor y sus fincas. Marca el punto en el mapa y, si la finca mide más de 4 hectáreas, dibuja su polígono."),
    (("reporte", "excel", "csv"), "En Reportes eliges el periodo y el formato (Excel o CSV) y descargas órdenes, lotes o envíos."),
    (("usuario", "rol", "permiso"), "Los usuarios y roles los administra el Administrador en Usuarios y roles. Allí se crean cuentas, se asigna el rol y se activan o desactivan."),
]


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", (text or "").lower())
    return "".join(c for c in text if not unicodedata.combining(c))


def _money(value: float, currency: str) -> str:
    return f"{currency} {value:,.0f}".replace(",", ".")


def _run(provider, prompt: str, rules: str):
    if not isinstance(provider, LLMProvider):
        return rules, "reglas"
    try:
        return provider.generate(prompt), provider_label(provider)
    except Exception as exc:
        log.warning("Proveedor %s fallo (%s); usando reglas", provider.name, exc)
        return rules, f"reglas (respaldo de {provider_label(provider)})"


def dashboard_rules(data: dict) -> str:
    parts = []
    orders = data.get("ordenesPorEstado", {})
    active_orders = orders.get("CONFIRMADA", 0) + orders.get("EN_TRANSITO", 0)
    parts.append(f"Hay {data.get('ordenesTotal', 0)} órdenes registradas, {active_orders} activas (confirmadas o en tránsito) y {orders.get('BORRADOR', 0)} en borrador.")
    months = sorted(data.get("valorPorMes", []), key=lambda m: (m["anio"], m["mes"]))
    if months:
        currency = months[-1]["moneda"]
        total = sum(m["valor"] for m in months if m["moneda"] == currency)
        best = max((m for m in months if m["moneda"] == currency), key=lambda m: m["valor"])
        parts.append(f"En los últimos 12 meses se vendieron {_money(total, currency)}; el mejor mes fue {best['mes']}/{best['anio']} con {_money(best['valor'], currency)}.")
    lots = data.get("lotesPorEstado", {})
    pending = lots.get("REGISTRADO", 0) + lots.get("EN_INSPECCION", 0)
    if pending:
        parts.append(f"Hay {pending} lotes esperando inspección y {data.get('lotesAprobados', 0)} aprobados listos para asignar a órdenes.")
    rejected = data.get("lotesRechazados", 0)
    if rejected == 1:
        parts.append("Ojo: 1 lote está rechazado y no se puede exportar hasta una nueva inspección.")
    elif rejected:
        parts.append(f"Ojo: {rejected} lotes están rechazados y no se pueden exportar hasta una nueva inspección.")
    incidents = data.get("enviosConIncidencia", 0)
    transit = data.get("enviosEnTransito", 0)
    if incidents == 1:
        parts.append("Hay 1 envío con incidencia: conviene revisarlo primero y avisar al cliente.")
    elif incidents:
        parts.append(f"Hay {incidents} envíos con incidencia: conviene revisarlos primero y avisar al cliente.")
    elif transit:
        parts.append(f"Hay {transit} envíos en tránsito y ninguno con incidencia.")
    else:
        parts.append("No hay envíos en tránsito en este momento.")
    certs = data.get("certificadosPorVencer", [])
    if certs:
        parts.append(f"Además, {len(certs)} {'certificado está' if len(certs) == 1 else 'certificados están'} por vencer; renuévalos antes de asignar esos lotes.")
    if not pending and not incidents and not certs:
        parts.append("La operación está al día.")
    return " ".join(parts)


def dashboard_prompt(data: dict) -> str:
    lines = [
        "Eres el asistente de RiTech Exports, exportadora colombiana de café y cacao hacia la Unión Europea.",
        f"Escribe en español un resumen breve (máximo 5 oraciones) del estado de la operación al {data['date']} para un usuario con rol {data.get('role') or 'gestor'}.",
        "Destaca lo urgente primero (incidencias, lotes rechazados, certificados por vencer), luego ventas y avance. Termina con una recomendación concreta.",
        "No inventes datos que no estén abajo. Sin markdown, solo texto.",
        "",
        f"Órdenes por estado: {data.get('ordenesPorEstado')}",
        f"Kg exportados: {data.get('kgExportados')}",
        f"Valor vendido por mes: {[(m['mes'], m['anio'], m['moneda'], m['valor']) for m in data.get('valorPorMes', [])]}",
        f"Lotes por estado: {data.get('lotesPorEstado')}",
        f"Envíos por estado: {data.get('enviosPorEstado')}",
        f"Envíos activos: {data.get('enviosActivos')}",
        f"Certificados por vencer: {data.get('certificadosPorVencer')}",
    ]
    return "\n".join(lines)


def summarize_dashboard(provider, data: dict) -> dict:
    text, model = _run(provider, dashboard_prompt(data), dashboard_rules(data))
    return {"summary": text, "model": model}


def lot_rules(data: dict) -> dict:
    failed = [r for r in data.get("detalle", []) if r.get("resultado") != "CUMPLE"]
    code = data["codigoLote"]
    if data.get("dictamen") == "SIN_VALIDAR":
        return {"explanation": f"El lote {code} todavía no se ha validado contra las reglas de la UE.", "steps": ["Completa la trazabilidad y los certificados del lote.", "Pulsa «Validar lote» en la pestaña de cumplimiento."]}
    if not failed:
        return {"explanation": f"El lote {code} cumple las {data.get('reglasEvaluadas', 0)} reglas normativas de la UE evaluadas, así que ya se puede asignar a una orden y descargar su declaración DDS.", "steps": ["Asigna el lote a una orden de exportación.", "Descarga la declaración DDS para la aduana del importador."]}
    names = ", ".join(PARAMETERS.get(r["parametro"], r["parametro"]) for r in failed)
    steps = [FIXES.get(r["parametro"], r.get("mensaje") or f"Revisa la regla {r['codigoRegla']}.") for r in failed]
    steps.append("Cuando lo corrijas, vuelve a validar el lote.")
    return {"explanation": f"El lote {code} no cumple {len(failed)} de {data.get('reglasEvaluadas', 0)} reglas: {names}. Mientras no se corrija no puede asignarse a una orden ni exportarse a la UE.", "steps": steps}


def lot_prompt(data: dict) -> str:
    lines = [
        "Eres un experto en cumplimiento normativo de exportaciones de café y cacao hacia la UE (EUDR 2023/1115, Reglamento 2023/915 de contaminantes, fitosanitarios).",
        "Explica a un gestor de exportaciones, en español sencillo, el dictamen de este lote y qué debe hacer.",
        'Responde SOLO un JSON: {"explanation": "<máximo 3 oraciones>", "steps": ["<paso concreto>", "..."]} con máximo 4 pasos.',
        "Los pasos deben poder hacerse en la plataforma: Productores y fincas, trazabilidad del lote, inspecciones, certificados, validar lote.",
        "No inventes valores que no estén abajo.",
        "",
        f"Lote {data['codigoLote']} · producto {data.get('producto')} · estado {data.get('estadoLote')} · peso neto {data.get('pesoNetoKg')} kg",
        f"Dictamen: {data.get('dictamen')} ({data.get('reglasIncumplidas')} incumplidas de {data.get('reglasEvaluadas')})",
        "Reglas:",
    ]
    for r in data.get("detalle", []):
        lines.append(f"- {r['codigoRegla']} {r['parametro']} ({r.get('normativa')}): {r['resultado']} · valor {r.get('valorEvaluado')} {r.get('operador') or ''} {r.get('valorLimite') or ''} · {r.get('mensaje') or ''}")
    return "\n".join(lines)


def analyze_lot(provider, data: dict) -> dict:
    rules = lot_rules(data)
    if not isinstance(provider, LLMProvider):
        return {**rules, "model": "reglas"}
    try:
        raw = parse_json(provider.generate(lot_prompt(data)))
        steps = [str(s) for s in raw.get("steps", []) if str(s).strip()][:4]
        return {"explanation": str(raw.get("explanation") or rules["explanation"]), "steps": steps or rules["steps"], "model": provider_label(provider)}
    except Exception as exc:
        log.warning("Analisis de lote con %s fallo (%s); usando reglas", provider.name, exc)
        return {**rules, "model": f"reglas (respaldo de {provider_label(provider)})"}


STATE_WORDS = [
    ("ENTREGADO", ("entregado", "entregamos", "recibio", "recibido", "entrega")),
    ("INCIDENCIA", ("retraso", "retrasado", "demora", "problema", "daño", "danado", "huelga", "incidencia", "inspeccion aduanera", "retenido", "averia", "tormenta")),
    ("ARRIBADO", ("arribo", "arribado", "llego a destino", "llego al puerto de destino", "atraco en")),
    ("EN_TRANSITO", ("zarpo", "zarpe", "navegando", "transito", "salio", "en camino", "canal de panama")),
    ("EN_PUERTO", ("en puerto", "puerto de", "llego al puerto", "terminal", "patio")),
]


def _place(text: str) -> str:
    for marker in (" en ", " por ", " desde "):
        idx = normalize(text).find(marker)
        if idx >= 0:
            fragment = text[idx + len(marker):].split(",")[0].split(".")[0].strip()
            for article in ("el ", "la ", "los ", "las "):
                if fragment.lower().startswith(article):
                    fragment = fragment[len(article):]
            if 2 < len(fragment) <= 120:
                return fragment[0].upper() + fragment[1:]
    return ""


def event_rules(data: dict) -> dict:
    text = data["text"].strip()
    norm = normalize(text)
    state = None
    for code, words in STATE_WORDS:
        if any(w in norm for w in words):
            state = code
            break
    if not state:
        current = data.get("currentState")
        idx = STEPS.index(current) if current in STEPS else -1
        state = STEPS[idx + 1] if 0 <= idx < len(STEPS) - 1 else "EN_TRANSITO"
    location = _place(text) or (data.get("destination") if state in ("ARRIBADO", "ENTREGADO") else data.get("origin")) or ""
    note = text[0].upper() + text[1:]
    if not note.endswith("."):
        note += "."
    return {"state": state, "location": location[:120], "note": note[:300]}


def event_prompt(data: dict) -> str:
    states = ", ".join(f"{k} ({v})" for k, v in SHIPMENT_STATES.items())
    return "\n".join(
        [
            "Eres el asistente de logística de RiTech Exports. Un gestor describe, con pocas palabras, lo que pasó con un envío de café o cacao.",
            "Conviértelo en un evento de seguimiento que verá el cliente importador europeo.",
            'Responde SOLO un JSON: {"state": "<uno de los códigos>", "location": "<dónde está el envío, máximo 120 letras>", "note": "<observación clara y profesional para el cliente, máximo 280 letras>"}',
            f"Códigos de estado: {states}. Usa INCIDENCIA para retrasos, daños, retenciones o cualquier problema.",
            "No inventes datos que el gestor no dijo.",
            "",
            f"Ruta del envío: {data.get('origin')} -> {data.get('destination')}. Estado actual: {data.get('currentState')}.",
            f"Lo que escribió el gestor: {data['text']}",
        ]
    )


def interpret_event(provider, data: dict) -> dict:
    rules = event_rules(data)
    if not isinstance(provider, LLMProvider):
        return {**rules, "model": "reglas"}
    try:
        raw = parse_json(provider.generate(event_prompt(data)))
        state = raw.get("state") if raw.get("state") in SHIPMENT_STATES else rules["state"]
        return {
            "state": state,
            "location": str(raw.get("location") or rules["location"])[:120],
            "note": str(raw.get("note") or rules["note"])[:300],
            "model": provider_label(provider),
        }
    except Exception as exc:
        log.warning("Interpretar evento con %s fallo (%s); usando reglas", provider.name, exc)
        return {**rules, "model": f"reglas (respaldo de {provider_label(provider)})"}


def chat_rules(data: dict) -> str:
    q = normalize(data["question"])
    best, score = None, 0
    for words, answer in FAQ:
        hits = sum(1 for w in words if w in q)
        if hits > score:
            best, score = answer, hits
    if best:
        return best
    return "Puedo ayudarte con el flujo de RiTech: productores y fincas, lotes e inspecciones, certificados, cumplimiento EUDR, órdenes, envíos y reportes. Cuéntame qué quieres hacer."


def chat_prompt(data: dict) -> str:
    lines = [
        "Eres RiBot, el asistente de RiTech Exports. Respondes en español, claro y corto (máximo 5 oraciones), sin markdown.",
        "Conoces la plataforma y la normativa europea para exportar café y cacao. Si te preguntan algo fuera de ese tema, redirige con amabilidad.",
        "No inventes datos de la empresa: usa solo el contexto de abajo.",
        "",
        "Guía de la plataforma:",
        *APP_GUIDE,
        "",
        f"Rol del usuario: {data.get('role') or 'desconocido'}. Página donde está: {data.get('page') or '/'}.",
    ]
    if data.get("context"):
        lines.append(f"Datos actuales: {data['context']}")
    if data.get("history"):
        lines.append("Conversación previa:")
        for turn in data["history"][-8:]:
            lines.append(f"{'Usuario' if turn['role'] == 'user' else 'RiBot'}: {turn['text']}")
    lines.append(f"Usuario: {data['question']}")
    lines.append("RiBot:")
    return "\n".join(lines)


def answer(provider, data: dict) -> dict:
    text, model = _run(provider, chat_prompt(data), chat_rules(data))
    return {"answer": text, "model": model}
