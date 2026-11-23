"""Carga controlada de los datos de demostración y de las fichas de los casos reales.

Uso (desde backend/):  python -m scripts.semilla --reiniciar
- semillas/demo_portal.json  → ejemplos del frontend (SUNASS, EPS y Ciudadanía), marcados como simulados.
- semillas/casos_reales.json → fichas de los 3 casos del expediente (eventos y cifras con su fuente).
Las fechas de los casos simulados se calculan desde «hoy» (FECHA_DEMO) para que los plazos se vean igual que
en el prototipo. El texto de los documentos se carga aparte con scripts/ingesta_fuentes.py.
"""
from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from datetime import date
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import SesionDB
from app.models import (Actuacion, Alerta, CifraSector, Conversacion, Documento, DocumentoRecibido, Eps, Fragmento,
                        Mensaje, Publicacion, ReglaPlazo, RespuestaCache, Tramite, Usuario)
from app.services import plazos
from app.services.tramites import PASOS

SEMILLAS = Path(__file__).resolve().parent / "semillas"
MESES = {m: i for i, m in enumerate(plazos.MESES, start=1)} | {"sep": 9}

EPS = {  # id, nombre, región, tamaño, simulada
    "EPS Selva Alta": ("eps-selva-alta", "San Martín", "Grande", True),
    "EPS Manantial": ("eps-manantial", "Cajamarca", "Pequeña", True),
    "EPS Costa Sur": ("eps-costa-sur", "Ica", "Mediana", True),
    "EPS Río Claro": ("eps-rio-claro", "Amazonas", "Pequeña", True),
    "EPS Tacna": ("eps-tacna", "Tacna", "Mediana", False),
    "EPS Pampa Verde": ("eps-pampa-verde", "Piura", "Pequeña", True),
    "EPS Altiplano": ("eps-altiplano", "Puno", "Grande", True),
}
EPS_REALES = {"epssmu": ("EPSSMU S.A.", "Amazonas", "Pequeña"), "emapa-pasco": ("EMAPA PASCO S.A.", "Pasco", "Pequeña")}
USUARIOS = [
    ("sunass-srt", "Especialista SRT · Equipo 1", "sunass", None),
    ("sunass-subdireccion", "Subdirección SRT", "sunass", None),
    ("eps-tacna", "Gerencia Comercial · EPS Tacna", "eps", "eps-tacna"),
    ("eps-rio-claro", "Gerencia General · EPS Río Claro", "eps", "eps-rio-claro"),
    ("eps-epssmu", "Gerencia General · EPSSMU", "eps", "epssmu"),
    ("eps-emapa-pasco", "Gerencia General · EMAPA Pasco", "eps", "emapa-pasco"),
]
PENDIENTE = ("Regla tomada del flujograma del anexo del Expediente General. Falta que la DRE confirme el evento "
             "inicial (presentación o notificación), las suspensiones por requerimiento y el calendario.")
REGLAS = [
    ("cpi-total", "CPI", None, "la presentación de la solicitud", 30, "Art. 93 RGT · flujograma del anexo"),
    ("ufi-total", "UFI", None, "la presentación de la solicitud", 30, "Art. 89 RGT · flujograma del anexo"),
    ("rp-inicio", "RP", "inicio", "la solicitud de inicio", 30, "Arts. 45-49 RGT · flujograma RP, etapa de inicio"),
    ("rp-evaluacion", "RP", "evaluacion", "la resolución de inicio", 60, "Flujograma RP, etapa de evaluación"),
    ("rp-difusion", "RP", "difusion", "el día siguiente de la publicación en El Peruano", 45,
     "Flujograma RP, etapa de difusión"),
    ("rp-aprobacion", "RP", "aprobacion", "el cierre de la difusión", 60, "Flujograma RP, etapa de aprobación"),
]
PUBLICACIONES = {"tacna-medidores-2026": "CPI-2026-0007", "rioclaro-fondo-2026": "UFI-2026-0001",
                 "altiplano-tarifas-2027": "RP-2026-0001"}
DETALLE_LISTA = {"CPI-2026-0007": "respuesta pendiente", "UFI-2025-0003": "resuelto el 3 mar",
                 "RP-2026-0003": "caso de ejemplo · en evaluación"}
# Efecto de confirmar el vínculo del Oficio 1628 (igual que en frontend/src/services/tramites.ts).
TACNA_TRAS_VINCULO = {
    "titulo": "Pedir el documento de la cifra de 19 935",
    "detalle": "El vínculo quedó confirmado. La cifra final llegó por correo: pide a la EPS que la formalice por "
               "Mesa de Partes.",
    "responsable": "Especialista SRT", "boton": "Ver alertas de plazo", "accion": "alertas", "urgente": False}
CAMPOS_RESUMEN = ("id", "procedimiento", "eps", "tamano_eps", "etapa", "responsable", "plazo", "simulado", "chip_plazo")


def fecha_texto(texto: str, anio: int) -> date | None:
    m = re.match(r"(\d{1,2}) ([a-z]{3})", texto or "")
    return date(anio, MESES[m.group(2)], int(m.group(1))) if m and m.group(2) in MESES else None


def reiniciar(db: Session) -> None:
    for modelo in (Mensaje, Conversacion, RespuestaCache, Fragmento, Actuacion, Alerta, DocumentoRecibido,
                   Publicacion, Documento, CifraSector, Tramite, ReglaPlazo, Usuario, Eps):
        db.execute(delete(modelo))
    db.commit()


def cargar(db: Session, hoy: date) -> dict:
    demo = json.loads((SEMILLAS / "demo_portal.json").read_text(encoding="utf-8"))
    reales = json.loads((SEMILLAS / "casos_reales.json").read_text(encoding="utf-8"))["tramites"]

    for nombre, (eid, region, tamano, simulada) in EPS.items():
        db.add(Eps(id=eid, nombre=nombre, region=region, tamano=tamano, simulado=simulada))
    for eid, (nombre, region, tamano) in EPS_REALES.items():
        db.add(Eps(id=eid, nombre=nombre, region=region, tamano=tamano, simulado=False))
    for uid, nombre, perfil, eps_id in USUARIOS:
        db.add(Usuario(id=uid, nombre_visible=nombre, perfil=perfil, eps_id=eps_id))
    for rid, proc, etapa, evento, dias, fuente in REGLAS:
        db.add(ReglaPlazo(id=rid, procedimiento=proc, etapa=etapa, evento_inicial=evento, dias=dias, fuente=fuente,
                          validada=False, motivo_pendiente=PENDIENTE))
    db.flush()

    fichas_eps = {f["id"]: f for f in demo["fichas_eps"] + demo["fichas_eps_otros"]}
    tramites: dict[str, Tramite] = {}

    # 1. Expedientes de la vista SUNASS
    for exp in demo["expedientes"]:
        paso = next(i for i, p in enumerate(exp["flujo"]["pasos"], start=1) if p["estado"] == "actual")
        p = exp["plazo"]
        inicio = plazos.sumar_dias_habiles(hoy, -p["dias_usados"])
        presentacion = {k: v for k, v in exp.items() if k not in CAMPOS_RESUMEN}
        presentacion["flujo"]["_paso"] = paso
        if exp["id"] == "CPI-2026-0007":
            presentacion["siguiente_tras_vinculo"] = TACNA_TRAS_VINCULO
        t = Tramite(id=exp["id"], procedimiento=exp["procedimiento"], eps_id=EPS[exp["eps"]][0],
                    titulo=exp.get("tema") or exp["etapa"], estado="en_evaluacion", paso_actual=paso,
                    etapa=exp["etapa"], responsable=exp["responsable"], simulado=exp["simulado"],
                    fecha_inicio=inicio if p["etapa"] is None else plazos.sumar_dias_habiles(inicio, -40),
                    fecha_inicio_etapa=inicio if p["etapa"] else None, presentacion=presentacion)
        db.add(t)
        anio = int(exp["id"].split("-")[1])
        for h in exp.get("linea_tiempo") or []:
            if h["fecha_texto"] != "Próximo" and exp["id"] not in reales:
                _hito(db, t, h["titulo"], h["detalle"], fecha_texto(h["fecha_texto"], anio), h.get("fuente"))
        for h in exp.get("historial") or []:
            _hito(db, t, h["titulo"], h["detalle"], fecha_texto(h["fecha_texto"], anio), None)
        tramites[t.id] = t

    # 2. Trámites que solo aparecen en la vista EPS
    for tid, f in fichas_eps.items():
        if tid in tramites:
            continue
        final = f["estado"] in {"autorizado", "no_autorizado", "concluido"}
        t = Tramite(id=tid, procedimiento=f["procedimiento"], eps_id="eps-tacna", titulo=f["titulo"],
                    estado=f["estado"], paso_actual=len(PASOS[f["procedimiento"]]) if final else 2,
                    etapa=f["estado_texto"], responsable=None if final else "Equipo SRT · Especialista",
                    simulado=True, fecha_inicio=plazos.sumar_dias_habiles(hoy, -45 if final else -12),
                    fecha_inicio_etapa=plazos.sumar_dias_habiles(hoy, -12) if f["procedimiento"] == "RP" and not final else None,
                    fecha_fin=plazos.sumar_dias_habiles(hoy, -15) if final else None)
        db.add(t)
        tramites[tid] = t

    # 3. Fichas EPS: la fecha límite se fija desde hoy con los días restantes del ejemplo
    for tid, f in fichas_eps.items():
        f = copy.deepcopy(f)
        f["detalle_lista"] = DETALLE_LISTA.get(tid)
        accion = f.get("siguiente_accion")
        if accion and accion.get("fecha_limite") and accion.get("dias_restantes") is not None:
            limite = plazos.sumar_dias_habiles(hoy, accion["dias_restantes"])
            antes = accion["fecha_texto"]
            accion["fecha_limite"], accion["fecha_texto"] = limite.isoformat(), plazos.fecha_corta(limite)
            for s in f["seguimiento"]:
                s["fecha_texto"] = s["fecha_texto"].replace(antes, accion["fecha_texto"])
        t = tramites[tid]
        t.ficha_eps = f
        if t.estado == "en_evaluacion" and f["estado"] != "en_evaluacion" and tid != "CPI-2026-0007":
            t.estado = f["estado"]
        db.flush()
        for d in f.get("documentos", []):
            if db.get(Documento, d["id"]) is None:
                db.add(Documento(id=d["id"], tramite_id=tid, titulo=d["titulo"], referencia=d["titulo"],
                                 visibilidad="partes", estado_validacion="por_validar", simulado=True))
    # El ejemplo SUNASS de Tacna y su ficha EPS muestran momentos distintos; la EPS ve el requerimiento abierto.
    tramites["CPI-2026-0007"].estado = "requiere_respuesta"

    # 4. Casos reales: fichas con fuentes para el agente
    for tid, r in reales.items():
        normativo = next((p for p in r["plazos"] if p["capa"] == "normativo"), {})
        t = tramites.get(tid)
        if t is None:
            db.add(Eps(id=r["eps_id"], nombre=r["eps"], region=r["region"])) if db.get(Eps, r["eps_id"]) is None else None
            t = Tramite(id=tid, procedimiento=r["procedimiento"], eps_id=r["eps_id"], titulo=r["titulo"],
                        estado="autorizado", paso_actual=len(PASOS[r["procedimiento"]]), etapa=r["paso_actual"],
                        responsable=None, simulado=False,
                        fecha_inicio=date.fromisoformat(normativo["inicio"]) if normativo.get("inicio") else None,
                        fecha_fin=date.fromisoformat(normativo["fin"]) if normativo.get("fin") else None)
            db.add(t)
            tramites[tid] = t
        t.ficha_agente = {k: r[k] for k in ("procedimiento_nombre", "norma", "resumen_ciudadano", "cifras", "plazos",
                                            "documentos_publicos")}
        t.publicable = bool(r.get("publicable"))
        for e in r["eventos"]:
            _hito(db, t, e["hito"], None, date.fromisoformat(e["fecha"]) if e["fecha"] else None, None,
                  actor=e["actor"], fuente=e["fuente"], por_validar=e["fecha_estado"] == "por_validar")
    db.flush()

    # 5. Ciudadanía
    publicas = {f["id"]: f for f in demo["fichas_publicas"]}
    for d in demo["decisiones"]:
        tid = PUBLICACIONES[d["id"]]
        tramites[tid].publicable = True
        ficha = {k: v for k, v in publicas.get(d["id"], {}).items() if k not in d}
        db.add(Publicacion(id=d["id"], tramite_id=tid, resumen=d, ficha=ficha or None))
    for tid, slug in (("UFI-2025-0001", "epssmu-fondo-2025"), ("RP-2024-0001", "pasco-tarifas-2024")):
        r = reales[tid]
        autorizado = next((c for c in r["cifras"] if c["tipo"] == "autorizado"), None)
        db.add(Publicacion(id=slug, tramite_id=tid, resumen={
            "id": slug, "eps": r["eps"], "localidad": r["region"], "procedimiento": r["procedimiento"],
            "titulo": r["titulo"], "estado_publico": "decision_publicada", "cifra": autorizado["valor"] if autorizado else "",
            "nota_estado": r["paso_actual"], "resumen_ciudadano": r["resumen_ciudadano"],
            "fecha_actualizacion": next((p["fin"] for p in r["plazos"] if p.get("fin")), None),
            "autorizado": None, "ficha_disponible": False, "simulado": False}))
    for c in demo["cifras_sector"]:
        db.add(CifraSector(datos=c))

    # 6. Recepción y alertas
    for d in demo["recepcion"]:
        db.add(DocumentoRecibido(id=d["id"], datos=d))
    for a in demo["alertas"]:
        destino = a.get("destino") or {}
        db.add(Alerta(id=a["id"], tramite_id=destino.get("id") if destino.get("tipo") == "expediente" else None, datos=a))
    db.commit()
    return {"tramites": len(tramites), "publicaciones": len(demo["decisiones"]) + 2, "hoy": hoy.isoformat()}


def _hito(db: Session, t: Tramite, titulo: str, detalle: str | None, fecha: date | None, documento: str | None,
          actor: str | None = None, fuente: str | None = None, por_validar: bool = False) -> None:
    db.flush()  # el trámite debe existir antes que sus actuaciones (no hay relationship() que ordene los INSERT)
    doc = re.sub(r"-p\d+$", "", fuente) if fuente else documento
    db.add(Actuacion(tramite_id=t.id, tipo="hito", titulo=titulo, detalle=detalle, fecha_acreditada=fecha,
                     fecha_por_validar=por_validar or fecha is None, actor=actor, documento_id=doc, fuente=fuente,
                     estado_origen=t.estado or "en_evaluacion", estado_destino=t.estado or "en_evaluacion",
                     paso_origen=t.paso_actual or 1, paso_destino=t.paso_actual or 1))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--reiniciar", action="store_true", help="borra los datos actuales antes de cargar")
    a = p.parse_args()
    with SesionDB() as db:
        if a.reiniciar:
            reiniciar(db)
        print(cargar(db, settings.hoy()))


if __name__ == "__main__":
    main()
