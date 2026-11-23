"""Chat con el agente desde la terminal, contra la base local.

Uso (desde backend/):
  python -m scripts.chat                                    (SUNASS, caso Tacna)
  python -m scripts.chat --usuario eps-tacna
  python -m scripts.chat --publico --tramite UFI-2025-0001
Escribe 'salir' para terminar.
"""
import argparse
import asyncio
import sys

from app.agent import graph
from app.core.db import SesionDB
from app.core.sesion import actor_de
from app.models import Usuario
from app.schemas.comun import Actor
from app.services.fuentes import FuentesBD


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("--usuario", default="sunass-srt", help="sunass-srt · eps-tacna · eps-epssmu · eps-emapa-pasco")
    p.add_argument("--publico", action="store_true")
    p.add_argument("--tramite", default="CPI-2026-0007")
    a = p.parse_args()
    with SesionDB() as db:
        actor = Actor(perfil="publico") if a.publico else actor_de(db.get(Usuario, a.usuario))
        fuentes, historial = FuentesBD(db), []
        print(f"YakuKhipu · {actor.perfil} {actor.eps_id or ''} · {a.tramite} · escribe 'salir' para terminar\n")
        while (pregunta := input("Tú: ").strip()).lower() not in {"salir", "exit", "q"}:
            if not pregunta:
                continue
            r = await graph.preguntar(fuentes, actor, a.tramite, pregunta, historial)
            print(f"\n[{r.estado}] {r.respuesta}")
            for f in r.fuentes:
                print(f"   · {f.titulo}, página {f.pagina_pdf}")
            for adv in r.advertencias:
                print(f"   ! {adv}")
            if r.modelo:
                print(f"   ({'desde caché' if r.desde_cache else r.modelo}, {r.duracion_ms} ms)")
            print()
            if r.estado in ("ok", "sin_fuentes"):
                historial = (historial + [{"pregunta": pregunta, "respuesta": r.respuesta}])[-4:]


if __name__ == "__main__":
    asyncio.run(main())
