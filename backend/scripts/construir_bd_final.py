"""Empaqueta SQL para una base nueva. No conecta a PostgreSQL ni ejecuta DDL."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FILES=['01_schema.sql','local/01_dataset_schema.sql','02_constraints_indexes.sql','03_reference_data.sql',
       'local/04_dataset_inserts.sql','local/05_real_cases_inserts.sql','local/08_calidad.sql',
       '09_integridad_dataset.sql','06_views.sql','final/10_identidad_permisos.sql',
       'final/20_trazabilidad_ambitos.sql','final/30_privilegios_postgres.sql']


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--datasets',type=Path,default=Path.home()/'Downloads/DATASETS')
    parser.add_argument('--casos',type=Path,default=Path.home()/'Downloads/Casos reales')
    args=parser.parse_args()
    manifest=json.loads((ROOT/'sql/local/manifiesto.json').read_text(encoding='utf-8'))
    actual={p.name:p for folder in (args.datasets,args.casos) for p in folder.rglob('*') if p.is_file()}
    bad=[name for name,digest in manifest['archivos'].items()
         if name not in actual or hashlib.sha256(actual[name].read_bytes()).hexdigest()!=digest]
    extra=sorted(set(actual)-set(manifest['archivos']))
    if bad or extra:
        raise SystemExit('Regenera primero scripts.generar_sql: fuentes cambiadas/ausentes='+str(bad)+'; nuevas='+str(extra))
    output=ROOT/'sql/local/final';output.mkdir(parents=True,exist_ok=True)
    target=output/'01_yakukhipu_final.sql'
    hashes={}
    with target.open('w',encoding='utf-8',newline='\n') as stream:
        stream.write('-- PostgreSQL 15+. Conectar a yakukhipu_final NUEVA. Ejecutar con detención ante errores.\n')
        stream.write('-- Estructura, fuentes entregadas, cuatro perfiles, permisos, sesiones y trazabilidad. Sin usuarios de prueba.\n')
        for name in FILES:
            source=ROOT/'sql'/name
            raw=source.read_bytes();hashes[name]=hashlib.sha256(raw).hexdigest()
            stream.write('\n-- FUENTE: '+name+'\n'+raw.decode('utf-8').replace('\r\n','\n')+'\n')
    create=(ROOT/'sql/final/00_crear_base.sql').read_text(encoding='utf-8')
    (output/'00_crear_base.sql').write_text(create,encoding='utf-8')
    all_in_one=output/'instalar_todo_psql.sql'
    with all_in_one.open('w',encoding='utf-8',newline='\n') as stream:
        stream.write('\\set ON_ERROR_STOP on\n'+create+'\n\\connect yakukhipu_final\n')
        stream.write(target.read_text(encoding='utf-8'))
    report={'lote_fuentes':manifest['lote'],'archivos_fuente':manifest['archivos'],'conteos':manifest['conteos'],
        'partes_sql':hashes,'perfiles':['analista_srt','coordinacion_dre','jefatura_dre','eps'],
        'procedimientos_portal':['CPI','UFI','RP'],'cuentas_precargadas':0,
        'entregables':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
                       for p in (target,all_in_one,output/'00_crear_base.sql')}}
    (output/'manifiesto_final.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'directorio':str(output),'entregables':report['entregables']},ensure_ascii=True))


if __name__=='__main__':main()
