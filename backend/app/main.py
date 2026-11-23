"""Aplicación FastAPI. Arranca aunque el proveedor de IA esté deshabilitado (LLM_ENABLED=false)."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .api import asistente, documentos, eps, publico, sesion, tramites
from .core import errores
from .core.config import settings
from .core.db import engine

app = FastAPI(title="YakuKhipu", version="0.1.0",
              description="API del portal de trazabilidad de SUNASS. Los datos marcados `simulado` son de demostración.")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True,
                   allow_methods=["GET", "POST", "DELETE"], allow_headers=["Content-Type", "Idempotency-Key"])
errores.registrar(app)
for r in (sesion.router, tramites.router, eps.router, documentos.router, publico.router, asistente.router):
    app.include_router(r)


@app.get("/health", tags=["Sistema"])
def health() -> dict:
    try:
        with engine.connect() as c:
            c.execute(text("select 1"))
        base = "ok"
    except Exception:  # noqa: BLE001 - el chequeo informa, no falla
        base = "sin_conexion"
    return {"estado": "ok", "base_de_datos": base, "asistente": "habilitado" if settings.llm_enabled else "deshabilitado",
            "sesion": "demo" if settings.sesion_demo else "institucional"}
