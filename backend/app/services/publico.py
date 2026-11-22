"""Consulta ciudadana: solo la proyección pública de cada caso habilitado."""
from __future__ import annotations

import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import CifraSector, Publicacion, Tramite
from ..repositories import tramites as repo


def _norm(t: str) -> str:
    t = unicodedata.normalize("NFKD", t.lower())
    return "".join(c for c in t if not unicodedata.combining(c))


def _publicadas(db: Session) -> list[Publicacion]:
    consulta = (select(Publicacion).join(Tramite, Tramite.id == Publicacion.tramite_id)
                .where(Publicacion.publicada.is_(True), Tramite.publicable.is_(True)).order_by(Publicacion.id))
    return list(db.scalars(consulta))


def buscar(db: Session, q: str | None, eps_id: str | None, localidad: str | None, page: int, page_size: int) -> dict:
    items = []
    for pub in _publicadas(db):
        r = pub.resumen
        if q and _norm(q) not in _norm(f"{r['eps']} {r['localidad']} {r['titulo']}"):
            continue
        if eps_id and db.get(Tramite, pub.tramite_id).eps_id != eps_id:
            continue
        if localidad and _norm(localidad) not in _norm(r["localidad"]):
            continue
        items.append(r)
    inicio = (page - 1) * page_size
    return {"items": items[inicio:inicio + page_size], "total": len(items), "page": page, "page_size": page_size}


def ficha(db: Session, caso_id: str) -> dict:
    pub = repo.publicacion(db, caso_id)
    return {**pub.resumen, **(pub.ficha or {})}


def cifras(db: Session) -> list[dict]:
    return [c.datos for c in db.scalars(select(CifraSector).order_by(CifraSector.id))]
