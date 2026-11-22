"""Las pruebas usan una base aparte (TEST_DATABASE_URL) y NUNCA llaman a un proveedor de IA real."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import dotenv_values

_env = dotenv_values(Path(__file__).resolve().parents[1] / ".env")
_url = os.environ.get("TEST_DATABASE_URL") or _env.get("TEST_DATABASE_URL")
if not _url:
    raise RuntimeError("Configura TEST_DATABASE_URL en backend/.env (una base distinta de la de trabajo).")
os.environ["DATABASE_URL"] = _url
os.environ["FECHA_DEMO"] = "2026-11-26"
os.environ["LLM_ENABLED"] = "true"
os.environ["CACHE_ACTIVA"] = "true"
os.environ["SECRET_KEY"] = "clave-de-pruebas"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.agent import llm  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.core.db import Base, SesionDB, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Documento, Fragmento  # noqa: E402
from scripts import semilla  # noqa: E402

# Texto ficticio: el repositorio no contiene los documentos reales.
FRAGMENTOS = [
    ("prueba-oficio-156", "partes", "Oficio 156 (ficticio)", 1,
     "Se solicita a la EPS remitir en un plazo de tres días hábiles el sustento de los 25 000 medidores."),
    ("prueba-informe-031", "interna", "Informe 031 (ficticio)", 3,
     "Nota interna de evaluación: la EPS remitió 14 902 medidores y luego un correo con 19 935 medidores."),
    ("prueba-rcd-032", "publica", "RCD 032 (ficticia)", 13,
     "Artículo 1. Autorizar 19 935 medidores ultrasónicos por S/ 3 817 752. No se reporta instalación."),
]


@pytest.fixture(scope="session", autouse=True)
def base_de_datos():
    assert settings.database_url == _url, "las pruebas no deben tocar la base de trabajo"
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SesionDB() as db:
        semilla.cargar(db, settings.hoy())
        for doc_id, vis, titulo, pagina, texto in FRAGMENTOS:
            db.add(Documento(id=doc_id, tramite_id="CPI-2026-0007", titulo=titulo, visibilidad=vis, simulado=True))
            db.flush()
            db.add(Fragmento(id=f"{doc_id}-p{pagina}", documento_id=doc_id, tramite_id="CPI-2026-0007",
                             pagina_pdf=pagina, texto=texto))
        db.commit()
    yield
    engine.dispose()


@pytest.fixture
def cliente():
    return TestClient(app)


def entrar(cliente: TestClient, usuario_id: str) -> TestClient:
    r = cliente.post("/api/sesion/demo", json={"usuario_id": usuario_id})
    assert r.status_code == 200, r.text
    return cliente


class ModeloFalso:
    """Reemplaza llm.completar: devuelve respuestas fijas y guarda lo que recibió."""

    def __init__(self, respuestas: list[str] | None = None, error: bool = False):
        self.respuestas = respuestas or []
        self.error = error
        self.llamadas: list[list[dict]] = []

    async def __call__(self, mensajes, max_tokens=None):
        self.llamadas.append(mensajes)
        if self.error:
            raise llm.ModeloNoDisponible("El proveedor de IA no respondió (HTTP 429).")
        texto = self.respuestas[min(len(self.llamadas), len(self.respuestas)) - 1]
        return texto, "modelo-de-prueba"


@pytest.fixture
def modelo(monkeypatch):
    def _instalar(*respuestas: str, error: bool = False) -> ModeloFalso:
        falso = ModeloFalso(list(respuestas), error)
        monkeypatch.setattr(llm, "completar", falso)
        return falso
    return _instalar
