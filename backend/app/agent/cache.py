"""Clave de la caché de respuestas comprobadas.

- Incluye el perfil y la EPS: una respuesta para SUNASS nunca se entrega a una EPS ni al público.
- Incluye la versión del trámite (ficha y documentos) y la fecha: si cambia un documento, un estado o el día
  (los días restantes cambian), la respuesta anterior deja de usarse.
- Incluye el último turno, porque una pregunta de seguimiento depende de la conversación.
- «¿Cuánto se autorizó?» y «cuanto se autorizo» comparten clave.
El almacenamiento (tabla respuesta_cache) lo implementa FuentesAgente.
"""
from __future__ import annotations

import hashlib

from .retrieval import tokens


def clave(actor: dict, tramite_id: str, version: str, pregunta: str, ultimo_turno: str = "") -> str:
    partes = [actor["perfil"], actor.get("eps_id") or "-", tramite_id, version,
              " ".join(sorted(set(tokens(pregunta)))), " ".join(sorted(set(tokens(ultimo_turno))))]
    return hashlib.sha256("|".join(partes).encode()).hexdigest()
