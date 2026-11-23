from fastapi.testclient import TestClient

from app import main
from app.providers import LLMProvider, RulesProvider

client = TestClient(main.app)

DASHBOARD = {
    "date": "2026-11-23",
    "role": "Gestor de exportaciones",
    "ordenesPorEstado": {"BORRADOR": 1, "CONFIRMADA": 2, "EN_TRANSITO": 1, "ENTREGADA": 3, "ANULADA": 0},
    "ordenesTotal": 7,
    "kgExportados": 18000,
    "valorPorMes": [{"anio": 2026, "mes": 10, "moneda": "EUR", "valor": 93120, "ordenes": 1}, {"anio": 2026, "mes": 9, "moneda": "EUR", "valor": 50000, "ordenes": 1}],
    "lotesPorEstado": {"REGISTRADO": 2, "EN_INSPECCION": 1, "APROBADO": 1, "RECHAZADO": 1},
    "lotesAprobados": 1,
    "lotesRechazados": 1,
    "enviosConIncidencia": 1,
    "enviosEnTransito": 2,
}

LOT_FAILED = {
    "codigoLote": "LT-2026-0004",
    "producto": "Café verde",
    "dictamen": "NO_CUMPLE",
    "reglasEvaluadas": 5,
    "reglasIncumplidas": 2,
    "detalle": [
        {"codigoRegla": "EUDR-01", "parametro": "geolocalizacion_fincas", "resultado": "CUMPLE"},
        {"codigoRegla": "EUDR-02", "parametro": "poligono_si_area_mayor_4ha", "resultado": "NO_CUMPLE"},
        {"codigoRegla": "UE-915", "parametro": "ocratoxina_a_cafe", "resultado": "NO_CUMPLE", "valorEvaluado": "7.2", "operador": "<=", "valorLimite": "5"},
    ],
}


class FakeLLM(LLMProvider):
    name = "fake"
    model = "test"

    def __init__(self, reply: str = "", fail: bool = False) -> None:
        self.reply = reply
        self.fail = fail

    def generate(self, prompt: str) -> str:
        if self.fail:
            raise RuntimeError("sin conexion")
        return self.reply


def use(provider):
    main.registry.provider = provider


def setup_function():
    use(RulesProvider())


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_models_default_rules():
    assert client.get("/api/v1/models").json()["provider"] == "reglas"


def test_dashboard_rules_mentions_urgent_items():
    r = client.post("/api/v1/dashboard-summary", json=DASHBOARD).json()
    assert r["model"] == "reglas"
    assert "7 órdenes" in r["summary"]
    assert "incidencia" in r["summary"]
    assert "rechazados" in r["summary"]
    assert "EUR 143.120" in r["summary"]


def test_dashboard_uses_llm():
    use(FakeLLM("Todo bien hoy."))
    r = client.post("/api/v1/dashboard-summary", json=DASHBOARD).json()
    assert r == {"summary": "Todo bien hoy.", "model": "fake:test"}


def test_dashboard_falls_back_when_llm_fails():
    use(FakeLLM(fail=True))
    r = client.post("/api/v1/dashboard-summary", json=DASHBOARD).json()
    assert r["model"].startswith("reglas (respaldo")
    assert "órdenes" in r["summary"]


def test_lot_failed_lists_fixes():
    r = client.post("/api/v1/lot-analysis", json=LOT_FAILED).json()
    assert "no cumple 2 de 5" in r["explanation"]
    assert any("polígono" in s for s in r["steps"])
    assert any("ocratoxina" in s for s in r["steps"])
    assert r["steps"][-1].startswith("Cuando lo corrijas")


def test_lot_compliant():
    lot = {**LOT_FAILED, "dictamen": "CUMPLE", "reglasIncumplidas": 0, "detalle": [{"codigoRegla": "X", "parametro": "humedad_cafe_verde", "resultado": "CUMPLE"}]}
    r = client.post("/api/v1/lot-analysis", json=lot).json()
    assert "cumple las 5 reglas" in r["explanation"]


def test_lot_not_validated():
    r = client.post("/api/v1/lot-analysis", json={"codigoLote": "LT-1", "dictamen": "SIN_VALIDAR"}).json()
    assert "todavía no se ha validado" in r["explanation"]


def test_lot_with_llm_json():
    use(FakeLLM('```json\n{"explanation": "Falta el polígono.", "steps": ["Dibuja el polígono", "Valida"]}\n```'))
    r = client.post("/api/v1/lot-analysis", json=LOT_FAILED).json()
    assert r == {"explanation": "Falta el polígono.", "steps": ["Dibuja el polígono", "Valida"], "model": "fake:test"}


def test_lot_llm_bad_json_falls_back():
    use(FakeLLM("no se"))
    r = client.post("/api/v1/lot-analysis", json=LOT_FAILED).json()
    assert r["model"].startswith("reglas (respaldo")


def test_event_incident_from_text():
    r = client.post("/api/v1/shipment-event", json={"text": "retraso por tormenta en Canal de Panama", "currentState": "EN_TRANSITO", "origin": "Buenaventura", "destination": "Hamburgo"}).json()
    assert r["state"] == "INCIDENCIA"
    assert r["location"] == "Canal de Panama"
    assert r["note"].endswith(".")


def test_event_delivered_uses_destination():
    r = client.post("/api/v1/shipment-event", json={"text": "ya lo recibio el cliente", "currentState": "ARRIBADO", "origin": "Buenaventura", "destination": "Hamburgo"}).json()
    assert r["state"] == "ENTREGADO"
    assert r["location"] == "Hamburgo"


def test_event_next_step_when_unclear():
    r = client.post("/api/v1/shipment-event", json={"text": "todo normal hoy", "currentState": "PROGRAMADO"}).json()
    assert r["state"] == "EN_PUERTO"


def test_event_llm_invalid_state_keeps_rules_state():
    use(FakeLLM('{"state": "VOLANDO", "location": "Rotterdam", "note": "Llegó."}'))
    r = client.post("/api/v1/shipment-event", json={"text": "llego a destino", "currentState": "EN_TRANSITO"}).json()
    assert r["state"] == "ARRIBADO"
    assert r["location"] == "Rotterdam"


def test_chat_faq_shipments():
    r = client.post("/api/v1/chat", json={"question": "¿Cómo programo un envío?"}).json()
    assert "orden confirmada" in r["answer"]


def test_chat_faq_eudr():
    r = client.post("/api/v1/chat", json={"question": "que es el EUDR"}).json()
    assert "2023/1115" in r["answer"]


def test_chat_default_answer():
    r = client.post("/api/v1/chat", json={"question": "hola"}).json()
    assert "Puedo ayudarte" in r["answer"]


def test_chat_with_llm_includes_history():
    seen = {}

    class Spy(FakeLLM):
        def generate(self, prompt):
            seen["prompt"] = prompt
            return "Claro."

    use(Spy())
    body = {"question": "y luego?", "role": "Gestor", "history": [{"role": "user", "text": "cree una orden"}, {"role": "assistant", "text": "Bien"}]}
    assert client.post("/api/v1/chat", json=body).json()["answer"] == "Claro."
    assert "cree una orden" in seen["prompt"]
    assert "Rol del usuario: Gestor" in seen["prompt"]


def test_chat_rejects_empty_question():
    assert client.post("/api/v1/chat", json={"question": ""}).status_code == 422


def test_switch_requires_token(monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "x")
    main.get_settings.cache_clear()
    try:
        assert client.post("/api/v1/models/switch", json={"llm_provider": "reglas"}).status_code == 401
        assert client.post("/api/v1/models/switch", json={"llm_provider": "reglas"}, headers={"X-Admin-Token": "x"}).json()["provider"] == "reglas"
    finally:
        monkeypatch.delenv("ADMIN_TOKEN")
        main.get_settings.cache_clear()


def test_cors_allows_frontend():
    r = client.options("/api/v1/chat", headers={"Origin": "https://ritech-frontend-atwu.onrender.com", "Access-Control-Request-Method": "POST"})
    assert r.headers.get("access-control-allow-origin") == "https://ritech-frontend-atwu.onrender.com"
