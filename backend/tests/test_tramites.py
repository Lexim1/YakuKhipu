"""Transiciones, idempotencia, conflictos y plazos."""
from datetime import date

from conftest import entrar

from app.services import plazos


def test_dias_habiles_excluye_fines_de_semana_y_feriados():
    # 28 y 29 de julio de 2026 son feriados; 25 y 26 son fin de semana.
    assert plazos.dias_habiles(date(2026, 7, 24), date(2026, 7, 31)) == 3
    assert plazos.sumar_dias_habiles(date(2026, 7, 24), 3) == date(2026, 7, 31)


def test_plazo_lleva_regla_fuente_y_validacion(cliente):
    entrar(cliente, "sunass-srt")
    p = cliente.get("/api/tramites/RP-2025-0001").json()["plazo_detalle"]
    assert p["etapa"] == "Aprobación" and p["fuente"] and p["validacion"] == "pendiente_de_validacion" and p["motivo"]


def test_listado_sunass_reproduce_el_prototipo(cliente):
    entrar(cliente, "sunass-srt")
    items = {t["id"]: t for t in cliente.get("/api/tramites").json()["items"]}
    assert items["CPI-2026-0007"]["plazo"] == {"situacion": "en_plazo", "dias_usados": 18, "dias_totales": 30, "etapa": None}
    assert items["RP-2025-0001"]["plazo"]["situacion"] == "vencido"


def test_respuesta_eps_idempotente_y_sin_duplicar(cliente):
    entrar(cliente, "eps-tacna")
    cuerpo = {"documento": "Oficio 1628-2026", "fecha_presentacion": "2026-11-25", "cargo": "2026-E01-067906",
              "canal": "Mesa de Partes Virtual"}
    r1 = cliente.post("/api/eps/tramites/CPI-2026-0007/respuestas", json=cuerpo, headers={"Idempotency-Key": "k-1"})
    assert r1.status_code == 200 and r1.json()["estado"] == "en_evaluacion"
    assert r1.json()["respuesta_informada"]["verificada"] is False
    r2 = cliente.post("/api/eps/tramites/CPI-2026-0007/respuestas", json=cuerpo, headers={"Idempotency-Key": "k-1"})
    assert r2.status_code == 200 and r2.json() == r1.json()  # reintento: mismo resultado
    r3 = cliente.post("/api/eps/tramites/CPI-2026-0007/respuestas", json=cuerpo, headers={"Idempotency-Key": "k-2"})
    assert r3.status_code == 409  # otra presentación cuando ya no hay tarea

    entrar(cliente, "sunass-srt")
    tipos = {a["tipo"] for a in cliente.get("/api/tramites/CPI-2026-0007/acciones").json()["items"]}
    assert "verificar_respuesta" in tipos
    r = cliente.post("/api/tramites/CPI-2026-0007/eventos", json={"tipo": "verificar_respuesta"})
    assert r.status_code == 200
    eventos = cliente.get("/api/tramites/CPI-2026-0007/eventos").json()["items"]
    assert sum(e["tipo"] == "informar_presentacion" for e in eventos) == 1


def test_fecha_futura_es_invalida(cliente):
    entrar(cliente, "eps-tacna")
    r = cliente.post("/api/eps/tramites/CPI-2026-0011/respuestas",
                     json={"documento": "Oficio X", "fecha_presentacion": "2030-01-01", "canal": "Mesa de Partes"})
    assert r.status_code == 422


def test_cuerpo_invalido_responde_422(cliente):
    entrar(cliente, "sunass-srt")
    r = cliente.post("/api/tramites/CPI-2026-0003/eventos", json={"tipo": "borrar_todo"})
    assert r.status_code == 422 and r.json()["codigo"] == "datos_invalidos"


def test_transicion_exige_documento_y_version(cliente):
    entrar(cliente, "sunass-srt")
    exp = cliente.get("/api/tramites/CPI-2026-0003").json()
    r = cliente.post("/api/tramites/CPI-2026-0003/eventos", json={"tipo": "avanzar_paso"})
    assert r.status_code == 422  # falta el documento de sustento
    r = cliente.post("/api/tramites/CPI-2026-0003/eventos",
                     json={"tipo": "avanzar_paso", "documento_id": "memo-1", "version": exp["version"] - 1})
    assert r.status_code == 409  # la persona vio una versión anterior
    r = cliente.post("/api/tramites/CPI-2026-0003/eventos",
                     json={"tipo": "avanzar_paso", "documento_id": "memo-1", "version": exp["version"]})
    assert r.status_code == 200 and r.json()["flujo"]["pasos"][7]["estado"] == "actual"
    assert r.json()["version"] == exp["version"] + 1


def test_accion_no_permitida_en_el_estado(cliente):
    entrar(cliente, "sunass-srt")
    r = cliente.post("/api/tramites/UFI-2025-0001/eventos", json={"tipo": "avanzar_paso", "documento_id": "x"})
    assert r.status_code == 409  # el trámite ya concluyó


def test_confirmar_vinculo(cliente):
    entrar(cliente, "sunass-srt")
    r = cliente.post("/api/tramites/CPI-2026-0007/vinculos", json={"documento": "Oficio 1628"})
    assert r.status_code == 200
    assert r.json()["vinculo"] is None and r.json()["siguiente"]["titulo"].startswith("Pedir el documento")
