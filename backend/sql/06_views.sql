-- Vistas de lectura. Ninguna publicación se habilita automáticamente.
CREATE OR REPLACE VIEW expedientes AS SELECT * FROM tramite;
CREATE OR REPLACE VIEW actuaciones AS SELECT * FROM actuacion;
CREATE OR REPLACE VIEW documentos AS SELECT * FROM documento;
CREATE OR REPLACE VIEW fuentes AS SELECT * FROM fuente;
CREATE OR REPLACE VIEW v_procedencia AS
 SELECT r.canonical_id,r.source_record_id,r.source_hash,r.lote_id,
 f.source_type,f.source_file,f.source_hash AS archivo_hash
 FROM registro_fuente r JOIN fuente f ON f.id=r.fuente_id WHERE r.presente;
CREATE OR REPLACE VIEW v_expediente_360 AS
 SELECT t.id,t.procedimiento,t.estado,t.etapa,t.eps_id,e.nombre AS eps,
 p.source_type,p.source_record_id,p.source_file,t.publicable,t.version
 FROM tramite t JOIN eps e ON e.id=t.eps_id JOIN v_procedencia p ON p.canonical_id=t.id;
CREATE OR REPLACE VIEW v_proyecto_ejecucion AS
 SELECT p.canonical_id AS programa_id,p.eps_id,p.cod_proyecto,p.anio,p.nombre_proyecto,
 p.monto_programado_vigente,p.poblacion_beneficiaria,x.anio_trimestre,
 x.ejecucion_financiera_acumulada,x.avance_fisico_acumulado_pct
 FROM programa_inversion p LEFT JOIN ejecucion_inversion x
 ON p.eps_id=x.eps_id AND p.cod_proyecto=x.cod_proyecto AND left(x.anio_trimestre,4)::integer=p.anio;
CREATE OR REPLACE VIEW v_colisiones_origen AS
 SELECT source_record_id,count(*) AS cantidad,array_agg(canonical_id) AS registros
 FROM registro_fuente GROUP BY source_record_id HAVING count(*)>1;
