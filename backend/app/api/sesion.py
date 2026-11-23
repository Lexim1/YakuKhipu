"""Sesión de demostración (SIMULACIÓN). Se reemplaza por el inicio de sesión institucional."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session

from ..core import sesion
from ..core.config import settings
from ..core.db import get_db
from ..core.errores import NoEncontrado, SinSesion, ServicioNoDisponible
from ..core.passwords import verify_password
from ..models import Eps, Usuario
from ..schemas.tramite import InicioDemo
from ..schemas.salidas import Sesion

router = APIRouter(prefix="/api/sesion", tags=["Sesión"])


class Credenciales(BaseModel):
    model_config=ConfigDict(extra='forbid')
    usuario_id: str = Field(min_length=1,max_length=80)
    password: str = Field(min_length=1,max_length=256)


@router.post('', response_model=Sesion, summary='Iniciar sesión con credenciales provisionadas')
def autenticar(datos: Credenciales, respuesta: Response, db: Session = Depends(get_db)) -> dict:
    if len(settings.secret_key)<32:
        raise ServicioNoDisponible('Configura SECRET_KEY con al menos 32 caracteres.')
    u = db.get(Usuario,datos.usuario_id)
    if u is None or not u.activo or not verify_password(datos.password,u.password_hash):
        raise SinSesion('Credenciales no válidas.')
    sesion.abrir(respuesta,u.id)
    return _vista(db,u)


def _vista(db: Session, u: Usuario) -> dict:
    eps = db.get(Eps, u.eps_id) if u.eps_id else None
    return {"usuario_id": u.id, "nombre": u.nombre_visible, "perfil": u.perfil, "eps_id": u.eps_id,
            "eps": eps.nombre if eps else None, "simulado": settings.sesion_demo}


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


@router.get("", response_model=Sesion, summary="Sesión actual")
def actual(u: Usuario = Depends(sesion.usuario_actual), db: Session = Depends(get_db)) -> dict:
    return _vista(db, u)


@router.delete("", summary="Cerrar sesión", status_code=204)
def salir(respuesta: Response) -> Response:
    sesion.cerrar(respuesta)
    respuesta.status_code = 204
    return respuesta
