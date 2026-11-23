"""Abrir el documento de una cita: el PDF si está en la carpeta local, o su texto por página."""
from __future__ import annotations

from pathlib import Path

from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models import Documento, Fragmento
from ..repositories import tramites as repo
from ..schemas.comun import Actor


def contenido(db: Session, actor: Actor, documento_id: str, pagina: int | None, formato: str):
    doc = repo.obtener_documento(db, actor, documento_id)
    if formato == "pdf" and doc.archivo and settings.documentos_dir:
        ruta = (Path(settings.documentos_dir) / doc.archivo).resolve()
        if ruta.is_file() and Path(settings.documentos_dir).resolve() in ruta.parents:
            return FileResponse(ruta, media_type="application/pdf", filename=ruta.name,
                                content_disposition_type="inline")
    consulta = select(Fragmento).where(Fragmento.documento_id == doc.id).order_by(Fragmento.pagina_pdf)
    if pagina:
        consulta = consulta.where(Fragmento.pagina_pdf == pagina)
    paginas = [{"pagina_pdf": f.pagina_pdf, "pagina_impresa": f.pagina_impresa, "texto": f.texto,
                "requiere_ocr": f.requiere_ocr} for f in db.scalars(consulta)]
    return {"id": doc.id, "titulo": doc.titulo, "referencia": doc.referencia, "visibilidad": doc.visibilidad,
            "estado_validacion": doc.estado_validacion, "simulado": doc.simulado,
            "pdf_disponible": bool(doc.archivo and settings.documentos_dir), "paginas": paginas}


def enlace(doc_id: str, pagina: int | None, publico: bool) -> str:
    base = "/api/publico/documentos" if publico else "/api/documentos"
    return f"{base}/{doc_id}/contenido" + (f"?pagina={pagina}" if pagina else "")


def titulos(db: Session, ids: set[str]) -> dict[str, Documento]:
    if not ids:
        return {}
    return {d.id: d for d in db.scalars(select(Documento).where(Documento.id.in_(ids)))}
