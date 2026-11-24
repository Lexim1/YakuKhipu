-- Todas estas consultas son de solo lectura. Cero filas huérfanas esperado.
SELECT d.id FROM documento d LEFT JOIN tramite t ON t.id=d.tramite_id WHERE t.id IS NULL;
SELECT a.id FROM actuacion a LEFT JOIN documento d ON d.id=a.documento_id AND d.tramite_id=a.tramite_id
 WHERE a.documento_id IS NOT NULL AND d.id IS NULL;
SELECT source_type,count(*) FROM v_procedencia GROUP BY source_type;
SELECT procedimiento,count(*) FROM tramite GROUP BY procedimiento ORDER BY procedimiento;
SELECT codigo,count(*) FROM error_calidad_datos GROUP BY codigo;
SELECT count(*) AS documentos,count(*) FILTER(WHERE visibilidad='publica') AS publicos FROM documento;
SELECT count(*) AS paginas,count(*) FILTER(WHERE requiere_ocr) AS paginas_ocr FROM fragmento;
SELECT p.id FROM publicacion p JOIN tramite t ON t.id=p.tramite_id
 WHERE p.publicada AND NOT t.publicable;
SELECT * FROM v_colisiones_origen;
-- No sumar población por todas las filas/años: el mismo proyecto se repite.
SELECT eps_id,cod_proyecto,count(*) FROM programa_inversion GROUP BY eps_id,cod_proyecto;
