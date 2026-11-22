"""Ingesta: PDF de los casos reales → documentos y fragmentos por página en PostgreSQL.

Uso (desde backend/):  python -m scripts.ingesta_fuentes [--carpeta "D:/ruta/Casos reales"]
La carpeta por defecto es DOCUMENTOS_DIR. Los PDF y su texto NO se suben al repositorio: quedan en la base local.

- Cada página conserva documento, página PDF y texto. Las páginas con menos de 80 caracteres se marcan para OCR
  y el agente no las usa.
- Visibilidad: RCD y estudio tarifario publicados → «publica»; oficios entre SUNASS y la EPS → «partes»;
  informes y memorandos → «interna». La DRE debe revisar esta clasificación.
- Los identificadores y títulos se anonimizan: no deben contener nombres de personas.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import sys
import unicodedata
from pathlib import Path

from pypdf import PdfReader
from sqlalchemy import delete, select

from app.core.config import settings
from app.core.db import SesionDB
from app.models import Documento, Fragmento, Tramite

CARPETAS = {
    "EPS TACNA S.A. - modificación del PI": "CPI-2026-0007",
    "EPSSMU uso excepcional del FI": "UFI-2025-0001",
    "Emapa Pasco - Revisión Periódica": "RP-2024-0001",
}
# Algunos nombres de archivo incluyen el nombre de quien firma. Se elimina todo lo que está entre el número del
# documento y el asunto, sin escribir el nombre aquí (el repositorio es público).
ANONIMIZAR = [(re.compile(r"(1590-2026)[\s_-]+.*?(solicit)", re.I), r"\1-\2"),
              (re.compile(r"solicito[\s_-]*ampliacio\w*", re.I), "solicita-ampliacion")]
MIN_CARACTERES = 80
FIRMA = re.compile(r"[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]{6,}?\d{2}/\d{2}/\d{4} \d{2}:\d{2}(:\d{2})?")


def anonimizar(texto: str) -> str:
    for patron, reemplazo in ANONIMIZAR:
        texto = patron.sub(reemplazo, texto)
    return texto


def slug(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:60]


def limpiar(texto: str) -> str:
    texto = FIRMA.sub(" ", texto.replace("\x00", " "))  # sellos de firma digital repetidos
    texto = re.sub(r"[ \t]+", " ", texto)
    return re.sub(r"\n{3,}", "\n\n", texto).strip()


def visibilidad(doc_id: str, publicos: set[str]) -> str:
    if doc_id in publicos or "-rcd-" in doc_id:
        return "publica"
    return "partes" if "oficio" in doc_id else "interna"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--carpeta", type=Path, default=settings.documentos_dir)
    a = p.parse_args()
    if not a.carpeta or not a.carpeta.is_dir():
        sys.exit("Indica la carpeta de los casos con --carpeta o DOCUMENTOS_DIR en .env")
    with SesionDB() as db:
        for carpeta, tramite_id in CARPETAS.items():
            t = db.get(Tramite, tramite_id)
            if t is None:
                print(f"! {tramite_id} no está en la base: ejecuta antes python -m scripts.semilla")
                continue
            publicos = set((t.ficha_agente or {}).get("documentos_publicos", []))
            db.execute(delete(Fragmento).where(Fragmento.tramite_id == tramite_id))
            db.execute(delete(Documento).where(Documento.tramite_id == tramite_id, Documento.simulado.is_(False)))
            huella, paginas_total, ocr = hashlib.sha256(), 0, 0
            for pdf in sorted((a.carpeta / carpeta).rglob("*.pdf")):
                doc_id = anonimizar(f"{tramite_id.lower()}-{slug(pdf.stem)}").strip("-")
                titulo = anonimizar(pdf.stem).strip(" -_")
                try:
                    paginas = PdfReader(str(pdf)).pages
                except Exception as e:  # noqa: BLE001
                    print(f"! no se pudo leer {pdf.name}: {e}")
                    continue
                if db.get(Documento, doc_id):
                    continue
                db.add(Documento(id=doc_id, tramite_id=tramite_id, titulo=titulo, referencia=titulo,
                                 visibilidad=visibilidad(doc_id, publicos), estado_validacion="por_validar",
                                 archivo=str(pdf.relative_to(a.carpeta)).replace("\\", "/"), paginas=len(paginas)))
                db.flush()
                for i, pagina in enumerate(paginas, start=1):
                    try:
                        texto = limpiar(pagina.extract_text() or "")
                    except Exception:  # noqa: BLE001
                        texto = ""
                    requiere_ocr = len(texto) < MIN_CARACTERES
                    ocr += requiere_ocr
                    db.add(Fragmento(id=f"{doc_id}-p{i}", documento_id=doc_id, tramite_id=tramite_id, pagina_pdf=i,
                                     texto=texto, requiere_ocr=requiere_ocr,
                                     metadatos={"etapa_carpeta": pdf.parent.name if pdf.parent.name != carpeta else None}))
                    huella.update(f"{doc_id}-p{i}".encode())
                    huella.update(hashlib.sha256(texto.encode()).digest())
                paginas_total += len(paginas)
            t.huella_fuentes = huella.hexdigest()[:32]
            db.commit()
            docs = db.scalars(select(Documento).where(Documento.tramite_id == tramite_id)).all()
            print(f"{tramite_id}: {len(docs)} documentos, {paginas_total} páginas, {ocr} requieren OCR")


if __name__ == "__main__":
    main()
