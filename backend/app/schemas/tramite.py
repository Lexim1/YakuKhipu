"""Entradas de las operaciones que cambian datos. Las salidas siguen los tipos del frontend
(frontend/src/types/*.ts) y se documentan con ejemplos en /docs."""
from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class NuevaActuacion(BaseModel):
    """POST /api/tramites/{id}/eventos."""
    tipo: Literal["avanzar_paso", "requerir_informacion", "verificar_respuesta", "resolver", "confirmar_vinculo"]
    titulo: str | None = Field(default=None, max_length=200)
    detalle: str | None = Field(default=None, max_length=2000)
    documento_id: str | None = Field(default=None, max_length=120)
    fecha_acreditada: date | None = None
    version: int | None = Field(default=None, description="Versión que vio la persona; si cambió, responde 409")
    plazo_dias: int | None = Field(default=None, ge=1, le=60, description="Solo para requerir_informacion")
    requisitos: list[str] | None = None
    resultado: Literal["autorizado", "no_autorizado"] | None = None


class ConfirmarVinculo(BaseModel):
    documento: str = Field(max_length=120)
    decision: Literal["confirmar"] = "confirmar"


class NuevaRespuestaEps(BaseModel):
    """POST /api/eps/tramites/{id}/respuestas."""
    documento: str = Field(min_length=2, max_length=120)
    fecha_presentacion: date
    cargo: str | None = Field(default=None, max_length=120)
    canal: str = Field(min_length=2, max_length=120)


class Incorporacion(BaseModel):
    documento_id: str
    tramite_id: str
    tipo_actuacion: str
    asignado_a: str
    avisar: bool = False


class InicioDemo(BaseModel):
    usuario_id: str
