"""Aplicación FastAPI. Arranca aunque el proveedor de IA esté deshabilitado (LLM_ENABLED=false)."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .api import asistente, documentos, eps, publico, sesion, tramites
from .core import errores
from .core.config import settings
from .core.db import engine
from .schemas.comun import ErrorApi
from .core.errores import ServicioNoDisponible

app = FastAPI(title="YakuKhipu", version="0.2.0", responses={code:{'model':ErrorApi} for code in (401,403,404,409,422,429,500,503)},
              description="API sobre fuentes importadas a PostgreSQL. Los datasets de muestra conservan su procedencia.")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True,
                   allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type", "Idempotency-Key"])
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
    return {"estado": "ok" if base=='ok' else 'degradado', "base_de_datos": base, "asistente": "habilitado" if settings.llm_enabled else "deshabilitado",
            "sesion": "demo" if settings.sesion_demo else "credenciales_locales"}


@app.get('/live',tags=['Sistema'],summary='Proceso de la API activo, sin consultar BD')
def live() -> dict:
    return {'estado':'ok','version':app.version}


@app.get('/ready',tags=['Sistema'],summary='Conexión y esquema mínimo disponibles')
def ready() -> dict:
    try:
        with engine.connect() as connection: connection.execute(text('SELECT id FROM tramite LIMIT 1'))
    except Exception:
        raise ServicioNoDisponible('La conexión o el esquema de PostgreSQL aún no están disponibles.')
    return {'estado':'ok'}
