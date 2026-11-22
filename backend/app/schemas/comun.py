from __future__ import annotations

from typing import Generic, Literal, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Actor(BaseModel):
    """Quién consulta. Lo deriva el servidor de la sesión o del endpoint público, nunca del cuerpo."""
    perfil: Literal["sunass", "eps", "publico"]
    eps_id: str | None = None
    usuario_id: str | None = None


class ListaPaginada(BaseModel, Generic[T]):
    items: list[T]
    total: int


class ListaPublica(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class ErrorApi(BaseModel):
    """Formato estable de error: el frontend muestra su propio texto según el código HTTP."""
    detail: str
    codigo: str
