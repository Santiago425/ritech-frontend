from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class MonthValue(BaseModel):
    anio: int
    mes: int
    moneda: str = "EUR"
    valor: float = 0
    ordenes: int = 0


class ActiveShipment(BaseModel):
    puertoOrigen: Optional[str] = None
    puertoDestino: Optional[str] = None
    estadoEnvio: Optional[str] = None
    fechaEstimadaArribo: Optional[str] = None
    bookingBl: Optional[str] = None


class ExpiringCertificate(BaseModel):
    tipo: Optional[str] = None
    codigoLote: Optional[str] = None
    fechaVencimiento: Optional[str] = None


class DashboardIn(BaseModel):
    date: str
    role: str = ""
    ordenesPorEstado: Dict[str, int] = {}
    ordenesTotal: int = 0
    kgExportados: float = 0
    valorPorMes: List[MonthValue] = []
    lotesPorEstado: Dict[str, int] = {}
    lotesAprobados: int = 0
    lotesRechazados: int = 0
    enviosPorEstado: Dict[str, int] = {}
    enviosEnTransito: int = 0
    enviosConIncidencia: int = 0
    enviosActivos: List[ActiveShipment] = []
    certificadosPorVencer: List[ExpiringCertificate] = []


class RuleResult(BaseModel):
    codigoRegla: str = ""
    parametro: str = ""
    normativa: str = ""
    resultado: str
    valorEvaluado: Optional[str] = None
    operador: Optional[str] = None
    valorLimite: Optional[str] = None
    mensaje: Optional[str] = None


class LotIn(BaseModel):
    codigoLote: str
    producto: str = ""
    estadoLote: str = ""
    pesoNetoKg: Optional[float] = None
    dictamen: str = "SIN_VALIDAR"
    reglasEvaluadas: int = 0
    reglasIncumplidas: int = 0
    detalle: List[RuleResult] = []


class ShipmentEventIn(BaseModel):
    text: str = Field(min_length=3, max_length=600)
    currentState: str = ""
    origin: str = ""
    destination: str = ""


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=1500)


class ChatIn(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    role: str = ""
    page: str = ""
    context: Dict[str, Any] = {}
    history: List[ChatTurn] = Field(default=[], max_length=12)


class SwitchIn(BaseModel):
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    gemini_model: Optional[str] = None
    llm_base_url: Optional[str] = None
