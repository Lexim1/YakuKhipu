"""Sesión del portal.

SIMULACIÓN: mientras no exista el inicio de sesión institucional, la persona elige un usuario de
demostración y el servidor guarda su identificador en una cookie firmada (HMAC). El perfil y la EPS
salen siempre de la base de datos, nunca de lo que envía el navegador.
"""
from __future__ import annotations

import hashlib
import hmac
import time
import uuid

from fastapi import Depends, Request, Response,Security
from fastapi.security import APIKeyCookie
from sqlalchemy.orm import Session

from ..models import Usuario
from ..schemas.comun import Actor
from .config import settings
from .db import get_db
from .errores import AccesoDenegado, SinSesion

COOKIE = "yakukhipu_sesion"
cookie_auth=APIKeyCookie(name=COOKIE,auto_error=False,description='Cookie HttpOnly obtenida en POST /api/sesion')


def _firma(valor: str) -> str:
    return hmac.new(settings.secret_key.encode(), valor.encode(), hashlib.sha256).hexdigest()[:32]


def abrir(respuesta: Response, usuario_id: str) -> None:
    value = f"{usuario_id}.{int(time.time())+8*3600}"
    respuesta.set_cookie(COOKIE, f"{value}.{_firma(value)}", httponly=True, samesite="lax",
                         max_age=8 * 3600)


def cerrar(respuesta: Response) -> None:
    respuesta.delete_cookie(COOKIE)


def usuario_actual(request: Request, db: Session = Depends(get_db),cookie: str | None=Security(cookie_auth)) -> Usuario:
    if len(settings.secret_key)<32:
        raise SinSesion('La sesión requiere una SECRET_KEY de al menos 32 caracteres.')
    valor = cookie or ''
    signed, _, firma = valor.rpartition(".")
    usuario_id, _, expires = signed.rpartition('.')
    if not usuario_id or not expires.isdigit() or int(expires)<time.time() or not hmac.compare_digest(firma, _firma(signed)):
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


def visitante(request: Request, response: Response) -> Actor:
    from .errores import ServicioNoDisponible
    if len(settings.secret_key)<32:
        raise ServicioNoDisponible('La sesión del asistente ciudadano no está configurada.')
    cookie=request.cookies.get('yakukhipu_visitante','')
    signed,_,signature=cookie.rpartition('.')
    identifier,_,expires=signed.rpartition('.')
    valido=bool(identifier and expires.isdigit() and int(expires)>time.time() and hmac.compare_digest(signature,_firma('publico:'+signed)))
    if not valido:
        identifier=str(uuid.uuid4())
        signed=f'{identifier}.{int(time.time())+8*3600}'
        response.set_cookie('yakukhipu_visitante',f'{signed}.{_firma("publico:"+signed)}',httponly=True,samesite='lax',max_age=8*3600)
        request.state.visitante_cookies=response.headers.getlist('set-cookie')
    return Actor(perfil='publico',visitante_id=identifier)
