"""Separación de las tres vistas: sesión, EPS propia y proyección pública."""
from conftest import entrar


def test_health_responde_sin_sesion(cliente):
    r = cliente.get("/health")
    assert r.status_code == 200 and r.json()["estado"] == "ok"


def test_sin_sesion_responde_401(cliente):
    assert cliente.get("/api/tramites").status_code == 401
    assert cliente.post("/api/agente/chat", json={"pregunta": "hola", "tramite_id": "CPI-2026-0007"}).status_code == 401


def test_cookie_alterada_no_da_acceso(cliente):
    cliente.cookies.set("yakukhipu_sesion", "sunass-srt.firmafalsa")
    assert cliente.get("/api/tramites").status_code == 401


def test_eps_no_entra_a_la_vista_sunass(cliente):
    entrar(cliente, "eps-tacna")
    assert cliente.get("/api/tramites").status_code == 403


def test_eps_solo_ve_sus_tramites(cliente):
    entrar(cliente, "eps-tacna")
    ids = {t["id"] for t in cliente.get("/api/eps/tramites").json()["items"]}
    assert "CPI-2026-0007" in ids and "UFI-2026-0001" not in ids
    assert cliente.get("/api/eps/tramites/UFI-2026-0001").status_code == 404  # otra EPS: igual que inexistente


def test_eps_no_abre_documentos_internos(cliente):
    entrar(cliente, "eps-tacna")
    assert cliente.get("/api/documentos/prueba-oficio-156/contenido").status_code == 200
    assert cliente.get("/api/documentos/prueba-informe-031/contenido").status_code == 404


def test_publico_solo_fuentes_publicadas(cliente):
    assert cliente.get("/api/publico/documentos/prueba-rcd-032/contenido").status_code == 200
    assert cliente.get("/api/publico/documentos/prueba-informe-031/contenido").status_code == 404
    assert cliente.get("/api/publico/documentos/prueba-oficio-156/contenido").status_code == 404


def test_listado_publico_excluye_campos_internos(cliente):
    datos = cliente.get("/api/publico/decisiones?q=tacna").json()
    assert datos["total"] >= 1
    texto = str(datos)
    for interno in ("responsable", "requisitos", "presentacion", "ficha_eps"):
        assert interno not in texto


def test_publico_no_existe_responde_404(cliente):
    assert cliente.get("/api/publico/decisiones/no-existe").status_code == 404
