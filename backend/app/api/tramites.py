"""Vista SUNASS: expedientes, flujo, eventos, acciones, recepción y alertas."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.db import get_db
from ..core.sesion import actor_institucional, actor_sunass
from ..repositories import tramites as repo
from ..schemas.comun import Actor
from ..schemas.tramite import ConfirmarVinculo, Incorporacion, NuevaActuacion
from ..services import tramites as servicio

router = APIRouter(prefix="/api", tags=["SUNASS"])


@router.get("/tramites", summary="Expedientes visibles para SUNASS")
def listar(actor: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    items = [servicio.resumen(db, t, settings.hoy()) for t in repo.listar_tramites(db, actor)]
    return {"items": items, "total": len(items)}


@router.get("/tramites/{tramite_id}", summary="Ficha interna con responsable, etapa y plazos")
def detalle(tramite_id: str, actor: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    return servicio.expediente(db, repo.obtener_tramite(db, actor, tramite_id), settings.hoy())


@router.get("/tramites/{tramite_id}/flujo", summary="Pasos del proceso con su estado")
def flujo(tramite_id: str, actor: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    return servicio.expediente(db, repo.obtener_tramite(db, actor, tramite_id), settings.hoy())["flujo"]


@router.get("/tramites/{tramite_id}/eventos", summary="Historial autorizado")
def eventos(tramite_id: str, actor: Actor = Depends(actor_institucional), db: Session = Depends(get_db)) -> dict:
    items = servicio.eventos(db, repo.obtener_tramite(db, actor, tramite_id))
    if actor.perfil == "eps":  # la EPS no ve las notas internas
        items = [{k: v for k, v in e.items() if k != "detalle"} for e in items]
    return {"items": items, "total": len(items)}


@router.get("/tramites/{tramite_id}/acciones", summary="Acciones permitidas al usuario actual")
def acciones(tramite_id: str, actor: Actor = Depends(actor_institucional), db: Session = Depends(get_db)) -> dict:
    items = servicio.acciones(db, actor, repo.obtener_tramite(db, actor, tramite_id))
    return {"items": items, "total": len(items)}


@router.post("/tramites/{tramite_id}/eventos", summary="Registrar una actuación y aplicar la transición")
def registrar(tramite_id: str, datos: NuevaActuacion, actor: Actor = Depends(actor_sunass),
              db: Session = Depends(get_db), idempotency_key: str | None = Header(default=None, max_length=80)) -> dict:
    return servicio.registrar(db, actor, tramite_id, datos.model_dump(), idempotency_key, settings.hoy())


@router.post("/tramites/{tramite_id}/vinculos", summary="Confirmar el vínculo que propuso el agente")
def confirmar_vinculo(tramite_id: str, datos: ConfirmarVinculo, actor: Actor = Depends(actor_sunass),
                      db: Session = Depends(get_db)) -> dict:
    return servicio.registrar(db, actor, tramite_id, {"tipo": "confirmar_vinculo", "documento": datos.documento},
                              None, settings.hoy())


@router.get("/recepcion", summary="Documentos recibidos por incorporar")
def recepcion(_: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    items = servicio.listar_recepcion(db)
    return {"items": items, "total": len(items)}


@router.post("/recepcion/incorporaciones", status_code=204, summary="Incorporar un documento a un expediente")
def incorporar(datos: Incorporacion, actor: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> None:
    servicio.incorporar(db, actor, datos.model_dump(), settings.hoy())


@router.get("/alertas", summary="Alertas de plazo y de documentos")
def alertas(_: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    items = servicio.listar_alertas(db, settings.hoy())
    return {"items": items, "total": len(items)}
