"""Sesión del portal.

SIMULACIÓN: mientras no exista el inicio de sesión institucional, la persona elige un usuario de
demostración y el servidor guarda su identificador en una cookie firmada (HMAC). El perfil y la EPS
salen siempre de la base de datos, nunca de lo que envía el navegador.
"""
from __future__ import annotations

import hashlib
import hmac

from fastapi import Depends, Request, Response
from sqlalchemy.orm import Session

from ..models import Usuario
from ..schemas.comun import Actor
from .config import settings
from .db import get_db
from .errores import AccesoDenegado, SinSesion

COOKIE = "yakukhipu_sesion"


def _firma(valor: str) -> str:
    return hmac.new(settings.secret_key.encode(), valor.encode(), hashlib.sha256).hexdigest()[:32]


def abrir(respuesta: Response, usuario_id: str) -> None:
    respuesta.set_cookie(COOKIE, f"{usuario_id}.{_firma(usuario_id)}", httponly=True, samesite="lax",
                         max_age=8 * 3600)


def cerrar(respuesta: Response) -> None:
    respuesta.delete_cookie(COOKIE)


def usuario_actual(request: Request, db: Session = Depends(get_db)) -> Usuario:
    valor = request.cookies.get(COOKIE, "")
    usuario_id, _, firma = valor.rpartition(".")
    if not usuario_id or not hmac.compare_digest(firma, _firma(usuario_id)):
        raise SinSesion("Inicia sesión para continuar.")
    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.activo:
        raise SinSesion("Tu sesión ya no es válida.")
    return usuario


def actor_de(usuario: Usuario) -> Actor:
    return Actor(perfil=usuario.perfil, eps_id=usuario.eps_id, usuario_id=usuario.id)


def actor_institucional(usuario: Usuario = Depends(usuario_actual)) -> Actor:
    return actor_de(usuario)


def actor_sunass(actor: Actor = Depends(actor_institucional)) -> Actor:
    if actor.perfil != "sunass":
        raise AccesoDenegado("Esta sección es solo para el personal de SUNASS.")
    return actor


def actor_eps(actor: Actor = Depends(actor_institucional)) -> Actor:
    if actor.perfil != "eps" or not actor.eps_id:
        raise AccesoDenegado("Esta sección es solo para las empresas prestadoras.")
    return actor


ACTOR_PUBLICO = Actor(perfil="publico")
