import logging
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .assistant import analyze_lot, answer, interpret_event, summarize_dashboard
from .config import get_settings
from .providers import build_provider, provider_label
from .schemas import ChatIn, DashboardIn, LotIn, ShipmentEventIn, SwitchIn

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="RiTech IA", version="1.0.0", description="Componente de inteligencia artificial de RiTech Exports")
app.add_middleware(CORSMiddleware, allow_origins=get_settings().origins(), allow_methods=["GET", "POST"], allow_headers=["*"])


class Registry:
    def __init__(self) -> None:
        self.settings = get_settings().model_copy()
        self.provider = build_provider(self.settings)

    def reload(self) -> None:
        self.provider = build_provider(self.settings)

    def describe(self) -> dict:
        return {"provider": provider_label(self.provider), "available": ["auto", "gemini", "openai_compatible", "reglas"]}


registry = Registry()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/models")
def models():
    return registry.describe()


@app.post("/api/v1/models/switch")
def switch(data: SwitchIn, x_admin_token: Optional[str] = Header(None)):
    expected = get_settings().admin_token
    if expected and x_admin_token != expected:
        raise HTTPException(401, "Token de administrador invalido")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(registry.settings, field, value)
    registry.reload()
    return registry.describe()


@app.post("/api/v1/dashboard-summary")
def dashboard_summary(data: DashboardIn):
    return summarize_dashboard(registry.provider, data.model_dump())


@app.post("/api/v1/lot-analysis")
def lot_analysis(data: LotIn):
    return analyze_lot(registry.provider, data.model_dump())


@app.post("/api/v1/shipment-event")
def shipment_event(data: ShipmentEventIn):
    return interpret_event(registry.provider, data.model_dump())


@app.post("/api/v1/chat")
def chat(data: ChatIn):
    return answer(registry.provider, data.model_dump())
