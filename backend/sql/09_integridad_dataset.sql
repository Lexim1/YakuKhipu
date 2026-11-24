-- Ejecutar después de cargar las tablas de datos.
ALTER TABLE programa_inversion ADD FOREIGN KEY(eps_id,cod_proyecto) REFERENCES proyecto_inversion(eps_id,cod_proyecto);
ALTER TABLE ejecucion_inversion ADD CONSTRAINT ejecucion_proyecto_fk
 FOREIGN KEY(eps_id,cod_proyecto) REFERENCES proyecto_inversion(eps_id,cod_proyecto);
ALTER TABLE programa_inversion ADD CHECK(monto_programado_original>=0 AND monto_programado_vigente>=0);
ALTER TABLE procedimiento_fuente ADD CHECK(monto_solicitado>=0 AND monto_aprobado>=0);
ALTER TABLE ejecucion_inversion ADD CHECK(avance_fisico_acumulado_pct BETWEEN 0 AND 100);
ALTER TABLE fondo_inversion ADD CHECK(uso_excepcional>=0 AND deposito_programado>=0);
ALTER TABLE meta_gestion ADD CHECK(cumplimiento_pct>=0);
CREATE INDEX hito_tramite ON hito(tramite_id,nro_hito);
CREATE INDEX programa_eps_proyecto ON programa_inversion(eps_id,cod_proyecto);
CREATE INDEX ejecucion_eps_proyecto ON ejecucion_inversion(eps_id,cod_proyecto);
ALTER TABLE catalogo_eps ADD UNIQUE(cod_eps);
ALTER TABLE localidad_eps ADD UNIQUE NULLS NOT DISTINCT(cod_eps,localidad,ubigeo);
ALTER TABLE procedimiento_fuente ADD UNIQUE(id_expediente);
ALTER TABLE hito ADD UNIQUE(id_expediente,nro_hito);
ALTER TABLE programa_inversion ADD UNIQUE NULLS NOT DISTINCT(cod_eps,periodo_regulatorio,cod_proyecto,anio);
ALTER TABLE ejecucion_inversion ADD UNIQUE(cod_eps,cod_proyecto,anio_trimestre);
ALTER TABLE fondo_inversion ADD UNIQUE(cod_eps,anio_mes,tipo_fondo);
ALTER TABLE estado_financiero ADD UNIQUE(cod_eps,anio);
ALTER TABLE meta_gestion ADD UNIQUE NULLS NOT DISTINCT(cod_eps,periodo_regulatorio,cod_meta,nivel,localidad,anio);
ALTER TABLE inversion_mef ADD UNIQUE(cui);
ALTER TABLE ipm ADD UNIQUE(anio_mes);
ALTER TABLE programa_inversion ADD COLUMN tramite_modificacion_id varchar(80);
UPDATE programa_inversion p SET tramite_modificacion_id=e.tramite_id FROM procedimiento_fuente e
 WHERE p.id_expediente_modificacion=e.id_expediente AND p.eps_id=e.eps_id;
ALTER TABLE programa_inversion ADD FOREIGN KEY(tramite_modificacion_id,eps_id) REFERENCES tramite(id,eps_id);
ALTER TABLE fondo_inversion ADD COLUMN tramite_uso_id varchar(80);
UPDATE fondo_inversion f SET tramite_uso_id=e.tramite_id FROM procedimiento_fuente e
 WHERE f.id_expediente_uso_excepcional=e.id_expediente AND f.eps_id=e.eps_id;
ALTER TABLE fondo_inversion ADD FOREIGN KEY(tramite_uso_id,eps_id) REFERENCES tramite(id,eps_id);
CREATE FUNCTION vincular_programa() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 SELECT e.tramite_id INTO NEW.tramite_modificacion_id FROM procedimiento_fuente e
 WHERE e.id_expediente=NEW.id_expediente_modificacion AND e.eps_id=NEW.eps_id;
 RETURN NEW;
END;
$$;
CREATE TRIGGER programa_vinculo BEFORE INSERT OR UPDATE ON programa_inversion
 FOR EACH ROW EXECUTE FUNCTION vincular_programa();
CREATE FUNCTION vincular_fondo() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 SELECT e.tramite_id INTO NEW.tramite_uso_id FROM procedimiento_fuente e
 WHERE e.id_expediente=NEW.id_expediente_uso_excepcional AND e.eps_id=NEW.eps_id;
 RETURN NEW;
END;
$$;
CREATE TRIGGER fondo_vinculo BEFORE INSERT OR UPDATE ON fondo_inversion
 FOR EACH ROW EXECUTE FUNCTION vincular_fondo();
