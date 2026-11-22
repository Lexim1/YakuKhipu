"""Errores del negocio con su código HTTP. Los routers no arman mensajes a mano."""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ErrorNegocio(Exception):
    estado = 400
    codigo = "error"

    def __init__(self, mensaje: str):
        super().__init__(mensaje)
        self.mensaje = mensaje


class SinSesion(ErrorNegocio):
    estado, codigo = 401, "sin_sesion"


class AccesoDenegado(ErrorNegocio):
    estado, codigo = 403, "acceso_denegado"


class NoEncontrado(ErrorNegocio):
    """También se usa cuando el recurso existe pero el perfil no puede saberlo (política 404)."""
    estado, codigo = 404, "no_encontrado"


class Conflicto(ErrorNegocio):
    estado, codigo = 409, "conflicto"


class DatosInvalidos(ErrorNegocio):
    estado, codigo = 422, "datos_invalidos"


class ServicioNoDisponible(ErrorNegocio):
    estado, codigo = 503, "no_disponible"


class DemasiadasConsultas(ErrorNegocio):
    estado, codigo = 429, "demasiadas_consultas"


def registrar(app: FastAPI) -> None:
    @app.exception_handler(ErrorNegocio)
    async def _negocio(_: Request, e: ErrorNegocio) -> JSONResponse:
        return JSONResponse(status_code=e.estado, content={"detail": e.mensaje, "codigo": e.codigo})

    @app.exception_handler(RequestValidationError)
    async def _validacion(_: Request, e: RequestValidationError) -> JSONResponse:
        campos = ", ".join(".".join(str(p) for p in err["loc"][1:]) or "cuerpo" for err in e.errors())
        return JSONResponse(status_code=422, content={"detail": f"Datos no válidos: {campos}.",
                                                      "codigo": "datos_invalidos"})
