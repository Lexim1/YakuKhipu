"""Vista SUNASS: expedientes, flujo, eventos, acciones, recepción y alertas."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.db import get_db
from ..core.sesion import actor_institucional, actor_sunass
from ..repositories import tramites as repo
from ..models import Documento
from ..schemas.comun import Actor
from ..schemas.comun import ListaPaginada
from ..schemas.salidas import ResumenTramite,Expediente,Accion,PublicarDecision,NuevaRecepcion,DecisionPublica
from ..schemas.salidas import Evento,Recepcion,Flujo,Alerta
from ..schemas.tramite import ConfirmarVinculo, Incorporacion, NuevaActuacion
from ..services import tramites as servicio
from ..services.datos import contexto

router = APIRouter(prefix="/api", tags=["SUNASS"])


@router.get('/tramites/{tramite_id}/contexto', summary='Inversiones, fondos, finanzas y metas con procedencia')
def datos_contexto(tramite_id: str, actor: Actor = Depends(actor_institucional), db: Session = Depends(get_db)) -> dict:
    return contexto(db, repo.obtener_tramite(db,actor,tramite_id))


@router.get("/tramites", response_model=ListaPaginada[ResumenTramite], summary="Expedientes visibles para SUNASS")
def listar(actor: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    items = [servicio.resumen(db, t, settings.hoy()) for t in repo.listar_tramites(db, actor)]
    return {"items": items, "total": len(items)}


@router.get("/tramites/{tramite_id}", response_model=Expediente, summary="Ficha interna con responsable, etapa y plazos")
def detalle(tramite_id: str, actor: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    return servicio.expediente(db, repo.obtener_tramite(db, actor, tramite_id), settings.hoy())


@router.get("/tramites/{tramite_id}/flujo", response_model=Flujo, summary="Pasos del proceso con su estado")
def flujo(tramite_id: str, actor: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    return servicio.expediente(db, repo.obtener_tramite(db, actor, tramite_id), settings.hoy())["flujo"]


@router.get("/tramites/{tramite_id}/eventos", response_model=ListaPaginada[Evento], summary="Historial autorizado")
def eventos(tramite_id: str, actor: Actor = Depends(actor_institucional), db: Session = Depends(get_db)) -> dict:
    items = servicio.eventos(db, repo.obtener_tramite(db, actor, tramite_id))
    if actor.perfil == "eps":  # la EPS no ve las notas internas
        visibles = set(db.scalars(select(Documento.id).where(Documento.tramite_id==tramite_id,
                        Documento.visibilidad.in_(repo.VISIBLES['eps']))))
        items = [e for e in items if e.get('documento_id') in visibles]
        items = [{k: v for k, v in e.items() if k != "detalle"} for e in items]
    return {"items": items, "total": len(items)}


@router.get("/tramites/{tramite_id}/acciones", response_model=ListaPaginada[Accion], summary="Acciones permitidas al usuario actual")
def acciones(tramite_id: str, actor: Actor = Depends(actor_institucional), db: Session = Depends(get_db)) -> dict:
    items = servicio.acciones(db, actor, repo.obtener_tramite(db, actor, tramite_id))
    return {"items": items, "total": len(items)}


@router.post("/tramites/{tramite_id}/eventos", response_model=Expediente, summary="Registrar una actuación y aplicar la transición")
def registrar(tramite_id: str, datos: NuevaActuacion, actor: Actor = Depends(actor_sunass),
              db: Session = Depends(get_db), idempotency_key: str | None = Header(default=None, max_length=80)) -> dict:
    return servicio.registrar(db, actor, tramite_id, datos.model_dump(), idempotency_key, settings.hoy())


@router.post("/tramites/{tramite_id}/vinculos", summary="Confirmar el vínculo que propuso el agente")
def confirmar_vinculo(tramite_id: str, datos: ConfirmarVinculo, actor: Actor = Depends(actor_sunass),
                      db: Session = Depends(get_db)) -> dict:
    return servicio.registrar(db, actor, tramite_id, {"tipo": "confirmar_vinculo", "documento_id": datos.documento, "version":datos.version},
                              None, settings.hoy())


@router.get("/recepcion", response_model=ListaPaginada[Recepcion], summary="Documentos recibidos por incorporar")
def recepcion(_: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    items = servicio.listar_recepcion(db)
    return {"items": items, "total": len(items)}


@router.post('/recepcion',status_code=201,response_model=Recepcion,summary='Registrar metadatos y texto recibido por Mesa de Partes')
def recibir(datos: NuevaRecepcion, actor: Actor = Depends(actor_sunass),db: Session = Depends(get_db),
            idempotency_key: str=Header(min_length=3,max_length=80)) -> dict:
    from ..services.operaciones import recibir_documento
    return recibir_documento(db,actor,datos.model_dump(),settings.hoy(),idempotency_key)


@router.put('/tramites/{tramite_id}/publicacion',response_model=DecisionPublica,summary='Publicar una decisión y sus documentos revisados')
def publicar(tramite_id: str,datos: PublicarDecision,actor: Actor=Depends(actor_sunass),db: Session=Depends(get_db)) -> dict:
    from ..services.operaciones import publicar_decision
    return publicar_decision(db,actor,tramite_id,datos.model_dump(),settings.hoy())


@router.delete('/tramites/{tramite_id}/publicacion',status_code=204,summary='Retirar una decisión de la consulta pública')
def retirar(tramite_id: str,actor: Actor=Depends(actor_sunass),db: Session=Depends(get_db)) -> None:
    from ..services.operaciones import retirar_publicacion
    retirar_publicacion(db,actor,tramite_id)


@router.get('/tramites/{tramite_id}/plazos',summary='Plazos con regla, fuente y estado de validación')
def plazos(tramite_id: str,actor: Actor=Depends(actor_institucional),db: Session=Depends(get_db)) -> list[dict]:
    from ..services.fuentes import FuentesBD
    repo.obtener_tramite(db,actor,tramite_id)
    return FuentesBD(db).consultar_plazo(actor,tramite_id)


@router.get('/tramites/{tramite_id}/documentos',summary='Documentos visibles para la persona autenticada')
def documentos(tramite_id: str,actor: Actor=Depends(actor_institucional),db: Session=Depends(get_db)) -> dict:
    repo.obtener_tramite(db,actor,tramite_id)
    rows=repo.documentos_visibles(db,actor,tramite_id)
    items=[{'id':d.id,'titulo':d.titulo,'referencia':d.referencia,'paginas':d.paginas,'visibilidad':d.visibilidad} for d in rows]
    return {'items':items,'total':len(items)}


@router.post("/recepcion/incorporaciones", status_code=204, summary="Incorporar un documento a un expediente")
def incorporar(datos: Incorporacion, actor: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> None:
    servicio.incorporar(db, actor, datos.model_dump(), settings.hoy())


@router.get("/alertas", response_model=ListaPaginada[Alerta], summary="Alertas de plazo y de documentos")
def alertas(_: Actor = Depends(actor_sunass), db: Session = Depends(get_db)) -> dict:
    items = servicio.listar_alertas(db, settings.hoy())
    return {"items": items, "total": len(items)}
