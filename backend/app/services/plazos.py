"""Cómputo de plazos con reglas guardadas en la base de datos.

El modelo de lenguaje nunca calcula plazos: recibe este resultado y lo explica. Mientras una regla no esté
validada por la DRE, el resultado lleva «pendiente_de_validacion» y su motivo.
"""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import ReglaPlazo, Tramite

# Feriados nacionales de Perú. CALENDARIO POR VALIDAR con la DRE: no incluye días no laborables
# decretados ni suspensiones del procedimiento.
FERIADOS = {
    "2024-01-01", "2024-03-28", "2024-03-29", "2024-05-01", "2024-06-07", "2024-06-29", "2024-07-23",
    "2024-07-28", "2024-07-29", "2024-08-06", "2024-08-30", "2024-10-08", "2024-11-01", "2024-12-08",
    "2024-12-09", "2024-12-25",
    "2025-01-01", "2025-04-17", "2025-04-18", "2025-05-01", "2025-06-07", "2025-06-29", "2025-07-23",
    "2025-07-28", "2025-07-29", "2025-08-06", "2025-08-30", "2025-10-08", "2025-11-01", "2025-12-08",
    "2025-12-09", "2025-12-25",
    "2026-01-01", "2026-04-02", "2026-04-03", "2026-05-01", "2026-06-07", "2026-06-29", "2026-07-23",
    "2026-07-28", "2026-07-29", "2026-08-06", "2026-08-30", "2026-10-08", "2026-11-01", "2026-12-08",
    "2026-12-09", "2026-12-25",
    "2027-01-01", "2027-03-25", "2027-03-26", "2027-05-01", "2027-06-07", "2027-06-29", "2027-07-23",
    "2027-07-28", "2027-07-29", "2027-08-06", "2027-08-30", "2027-10-08", "2027-11-01", "2027-12-08",
    "2027-12-09", "2027-12-25",
}
UMBRAL_POR_VENCER = 0.75  # desde el 75 % del plazo usado, el trámite está «por vencer»

# Revisión periódica: cada paso del flujograma pertenece a una etapa con su propio reloj.
ETAPA_RP = {1: "inicio", 2: "evaluacion", 3: "evaluacion", 4: "difusion", 5: "difusion",
            6: "aprobacion", 7: "aprobacion", 8: "aprobacion"}
NOMBRE_ETAPA_RP = {"inicio": "Inicio", "evaluacion": "Evaluación", "difusion": "Difusión",
                   "aprobacion": "Aprobación"}
ESTADOS_FINALES = {"autorizado", "no_autorizado", "concluido"}
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"]


def es_habil(d: date) -> bool:
    return d.weekday() < 5 and d.isoformat() not in FERIADOS


def dias_habiles(desde: date, hasta: date) -> int:
    """Días hábiles después de «desde» hasta «hasta» inclusive. Negativo si «hasta» es anterior."""
    if hasta < desde:
        return -dias_habiles(hasta, desde)
    d, n = desde, 0
    while d < hasta:
        d += timedelta(days=1)
        n += es_habil(d)
    return n


def sumar_dias_habiles(desde: date, n: int) -> date:
    d, paso = desde, 1 if n >= 0 else -1
    for _ in range(abs(n)):
        d += timedelta(days=paso)
        while not es_habil(d):
            d += timedelta(days=paso)
    return d


def fecha_corta(d: date) -> str:
    return f"{d.day} {MESES[d.month - 1]}"


def situacion(usados: int, total: int, concluido: bool = False) -> str:
    if concluido:
        return "concluido"
    if usados > total:
        return "vencido"
    return "por_vencer" if usados >= total * UMBRAL_POR_VENCER else "en_plazo"


def regla_vigente(db: Session, tramite: Tramite) -> ReglaPlazo | None:
    etapa = ETAPA_RP.get(tramite.paso_actual) if tramite.procedimiento == "RP" else None
    consulta = select(ReglaPlazo).where(ReglaPlazo.procedimiento == tramite.procedimiento)
    consulta = consulta.where(ReglaPlazo.etapa == etapa) if etapa else consulta.where(ReglaPlazo.etapa.is_(None))
    return db.scalars(consulta).first()


def calcular(db: Session, tramite: Tramite, hoy: date) -> dict:
    """Plazo del trámite (o de la etapa activa en RP) con su regla, fuente y estado de validación."""
    regla = regla_vigente(db, tramite)
    etapa = ETAPA_RP.get(tramite.paso_actual) if tramite.procedimiento == "RP" else None
    inicio = (tramite.fecha_inicio_etapa or tramite.fecha_inicio) if etapa else tramite.fecha_inicio
    concluido = tramite.fecha_fin is not None or tramite.estado in ESTADOS_FINALES
    if regla is None or inicio is None:
        return {"situacion": "concluido" if concluido else "en_plazo", "dias_usados": 0, "dias_totales": regla.dias if regla else 0,
                "etapa": NOMBRE_ETAPA_RP.get(etapa) if etapa else None, "fecha_limite": None,
                "regla": regla.evento_inicial if regla else None, "fuente": regla.fuente if regla else None,
                "validacion": "pendiente_de_validacion",
                "motivo": "Falta la fecha acreditada de inicio o la regla del procedimiento."}
    fin = tramite.fecha_fin or hoy
    usados = max(dias_habiles(inicio, fin), 0)
    return {
        "situacion": situacion(usados, regla.dias, concluido=concluido),
        "dias_usados": usados,
        "dias_totales": regla.dias,
        "etapa": NOMBRE_ETAPA_RP.get(etapa) if etapa else None,
        "fecha_limite": sumar_dias_habiles(inicio, regla.dias).isoformat(),
        "regla": f"{regla.dias} días hábiles desde {regla.evento_inicial}",
        "fuente": regla.fuente,
        "validacion": "validado" if regla.validada else "pendiente_de_validacion",
        "motivo": None if regla.validada else regla.motivo_pendiente,
    }


def texto_chip(plazo: dict) -> str:
    s, u, t = plazo["situacion"], plazo["dias_usados"], plazo["dias_totales"]
    if s == "concluido":
        return f"Concluido · {u} días hábiles"
    nombre = {"en_plazo": "En plazo", "por_vencer": "Por vencer", "vencido": "Vencido"}[s]
    etapa = f" · etapa {plazo['etapa']}" if plazo.get("etapa") else ""
    return f"{nombre} · {u} de {t} días hábiles{etapa}"


def plazos_del_expediente(ficha_agente: dict | None) -> list[dict]:
    """Plazos de los casos con documentos: duración real entre presentación y resolución."""
    salida = []
    for p in (ficha_agente or {}).get("plazos", []):
        item = {"capa": p["capa"], "regla": p["regla"], "fuente": p["fuente"], "estado": "pendiente_de_validacion"}
        if p.get("inicio") and p.get("fin"):
            item["dias_habiles_transcurridos"] = dias_habiles(date.fromisoformat(p["inicio"]),
                                                              date.fromisoformat(p["fin"]))
            item["motivo"] = ("Cálculo bruto entre la presentación y la resolución. No descuenta suspensiones por "
                              "requerimientos ni usa fechas de notificación acreditadas; la DRE debe validarlo.")
        else:
            item["motivo"] = "Falta la fecha de notificación acreditada para computar este plazo."
        salida.append(item)
    return salida
