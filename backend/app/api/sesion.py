"""Sesión de demostración (SIMULACIÓN). Se reemplaza por el inicio de sesión institucional."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import sesion
from ..core.config import settings
from ..core.db import get_db
from ..core.errores import NoEncontrado
from ..models import Eps, Usuario
from ..schemas.tramite import InicioDemo

router = APIRouter(prefix="/api/sesion", tags=["Sesión (simulada)"])


def _vista(db: Session, u: Usuario) -> dict:
    eps = db.get(Eps, u.eps_id) if u.eps_id else None
    return {"usuario_id": u.id, "nombre": u.nombre_visible, "perfil": u.perfil, "eps_id": u.eps_id,
            "eps": eps.nombre if eps else None, "simulado": True}


@router.get("/demo/usuarios", summary="Usuarios de demostración disponibles")
def usuarios(db: Session = Depends(get_db)) -> list[dict]:
    if not settings.sesion_demo:
        raise NoEncontrado("La sesión de demostración está desactivada.")
    return [_vista(db, u) for u in db.scalars(select(Usuario).where(Usuario.activo.is_(True)).order_by(Usuario.id))]


@router.post("/demo", summary="Iniciar sesión como un usuario de demostración")
def iniciar(datos: InicioDemo, respuesta: Response, db: Session = Depends(get_db)) -> dict:
    if not settings.sesion_demo:
        raise NoEncontrado("La sesión de demostración está desactivada.")
    u = db.get(Usuario, datos.usuario_id)
    if u is None or not u.activo:
        raise NoEncontrado("Ese usuario de demostración no existe.")
    sesion.abrir(respuesta, u.id)
    return _vista(db, u)


@router.get("", summary="Sesión actual")
def actual(u: Usuario = Depends(sesion.usuario_actual), db: Session = Depends(get_db)) -> dict:
    return _vista(db, u)


@router.delete("", summary="Cerrar sesión", status_code=204)
def salir(respuesta: Response) -> Response:
    sesion.cerrar(respuesta)
    respuesta.status_code = 204
    return respuesta
