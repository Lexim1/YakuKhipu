-- Complemento del esquema operativo. Instalación NUEVA, sin usuarios de demostración.
BEGIN;
CREATE SCHEMA seguridad;
CREATE TABLE seguridad.rol (
 id varchar(30) PRIMARY KEY CHECK(id IN ('analista_srt','coordinacion_dre','jefatura_dre','eps')),
 nombre text NOT NULL, perfil text NOT NULL CHECK(perfil IN ('sunass','eps')),
 UNIQUE(id,perfil), CHECK((id='eps')=(perfil='eps'))
);
CREATE TABLE seguridad.permiso (
 id varchar(60) PRIMARY KEY, descripcion text NOT NULL
);
CREATE TABLE seguridad.rol_permiso (
 rol_id varchar(30) NOT NULL REFERENCES seguridad.rol(id),
 permiso_id varchar(60) NOT NULL REFERENCES seguridad.permiso(id),
 PRIMARY KEY(rol_id,permiso_id)
);
CREATE TABLE seguridad.vista (
 id varchar(30) PRIMARY KEY, nombre text NOT NULL,
 permiso_id varchar(60) NOT NULL REFERENCES seguridad.permiso(id)
);

INSERT INTO seguridad.rol VALUES
 ('analista_srt','Analista SRT','sunass'),('coordinacion_dre','Coordinación DRE','sunass'),
 ('jefatura_dre','Jefatura DRE','sunass'),('eps','Responsable de EPS','eps');
INSERT INTO seguridad.permiso VALUES
 ('expediente.consultar','Consultar ficha y documentos dentro del ámbito autorizado'),
 ('trazabilidad.consultar','Consultar historia, responsables, hitos, fuentes y plazos'),
 ('bandeja.consultar','Consultar tareas del perfil'),('alerta.consultar','Consultar alertas autorizadas'),
 ('ficha360.consultar','Consultar contexto de EPS dentro del ámbito autorizado'),
 ('agente.consultar','Consultar el agente con las mismas fuentes autorizadas'),
 ('evaluacion.validar','Validar información y vínculos documentales'),
 ('requerimiento.registrar','Registrar un requerimiento emitido por el canal oficial'),
 ('respuesta.verificar','Verificar la incorporación de la presentación de una EPS'),
 ('recepcion.gestionar','Incorporar y vincular documentos recibidos por canal oficial'),
 ('asignacion.gestionar','Asignar y reasignar expedientes a analistas'),
 ('acto_externo.registrar','Registrar avances, decisiones o notificaciones ya emitidos fuera del portal'),
 ('dashboard.consultar','Consultar la cartera DRE de los tres procedimientos'),
 ('reporte.consultar','Consultar reportes de gestión'),
 ('encargo.consultar','Consultar encargos autorizados'),('encargo.actualizar','Registrar seguimiento con evidencia'),
 ('encargo.gestionar','Crear y organizar encargos documentados'),
 ('publicacion.gestionar','Publicar o retirar contenido ciudadano revisado'),
 ('configuracion.consultar','Consultar reglas y configuración'),
 ('configuracion.gestionar','Administrar reglas de gestión con auditoría'),
 ('eps.respuesta_informar','Informar una presentación externa de la propia EPS');

INSERT INTO seguridad.rol_permiso
 SELECT 'analista_srt',id FROM seguridad.permiso WHERE id IN
 ('expediente.consultar','trazabilidad.consultar','bandeja.consultar','alerta.consultar','ficha360.consultar',
  'agente.consultar','evaluacion.validar','requerimiento.registrar','respuesta.verificar','encargo.consultar','encargo.actualizar');
INSERT INTO seguridad.rol_permiso
 SELECT 'coordinacion_dre',id FROM seguridad.permiso WHERE id IN
 ('expediente.consultar','trazabilidad.consultar','bandeja.consultar','alerta.consultar','ficha360.consultar','agente.consultar',
  'recepcion.gestionar','asignacion.gestionar','acto_externo.registrar','dashboard.consultar','reporte.consultar',
  'encargo.consultar','encargo.actualizar','encargo.gestionar','publicacion.gestionar');
INSERT INTO seguridad.rol_permiso
 SELECT 'jefatura_dre',id FROM seguridad.permiso WHERE id!='eps.respuesta_informar';
INSERT INTO seguridad.rol_permiso
 SELECT 'eps',id FROM seguridad.permiso WHERE id IN
 ('expediente.consultar','trazabilidad.consultar','agente.consultar','eps.respuesta_informar');

INSERT INTO seguridad.vista VALUES
 ('bandeja','Te toca actuar','bandeja.consultar'),('expedientes','Expedientes y ficha','expediente.consultar'),
 ('trazabilidad','Línea de tiempo, documentos y plazos','trazabilidad.consultar'),
 ('alertas','Alertas','alerta.consultar'),('ficha360','Ficha 360 de EPS','ficha360.consultar'),
 ('dashboard','Dashboard','dashboard.consultar'),('recepcion','Recepción de documentos','recepcion.gestionar'),
 ('encargos','Encargos posteriores','encargo.consultar'),('reportes','Reportes','reporte.consultar'),
 ('configuracion','Configuración','configuracion.consultar'),('mis_tramites','Mis trámites y siguiente paso EPS','eps.respuesta_informar'),
 ('agente','Asistente con fuentes autorizadas','agente.consultar');

ALTER TABLE usuario ADD COLUMN rol_id varchar(30) NOT NULL;
ALTER TABLE usuario ADD COLUMN credenciales_version integer NOT NULL DEFAULT 1 CHECK(credenciales_version>0);
ALTER TABLE usuario ADD COLUMN creado timestamptz NOT NULL DEFAULT now();
ALTER TABLE usuario ADD CONSTRAINT usuario_rol_perfil_fk FOREIGN KEY(rol_id,perfil) REFERENCES seguridad.rol(id,perfil);
ALTER TABLE usuario ADD CONSTRAINT usuario_hash_seguro CHECK
 (password_hash IS NULL OR password_hash ~ '^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$');
ALTER TABLE usuario ADD CONSTRAINT usuario_activo_con_credencial CHECK(NOT activo OR password_hash IS NOT NULL);

CREATE TABLE seguridad.sesion (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), usuario_id varchar(80) NOT NULL REFERENCES usuario(id),
 refresh_hash varchar(64) NOT NULL UNIQUE CHECK(refresh_hash ~ '^[0-9a-f]{64}$'),
 credenciales_version integer NOT NULL CHECK(credenciales_version>0),
 creada timestamptz NOT NULL DEFAULT now(), vence timestamptz NOT NULL,
 revocada_en timestamptz, motivo_revocacion text, CHECK(vence>creada),
 CHECK(revocada_en IS NULL OR revocada_en>=creada)
);
CREATE INDEX sesion_usuario ON seguridad.sesion(usuario_id);
CREATE INDEX sesion_activa_vence ON seguridad.sesion(vence) WHERE revocada_en IS NULL;
CREATE TABLE seguridad.intento_acceso (
 clave_hash varchar(64) PRIMARY KEY CHECK(clave_hash ~ '^[0-9a-f]{64}$'),
 intentos integer NOT NULL CHECK(intentos>0), ventana_fin timestamptz NOT NULL
);
CREATE TABLE seguridad.evento_acceso (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, usuario_id varchar(80) REFERENCES usuario(id),
 evento text NOT NULL CHECK(evento IN ('login_correcto','login_fallido','logout','renovacion','revocacion')),
 registrado timestamptz NOT NULL DEFAULT now(), detalle text
);

CREATE FUNCTION seguridad.revocar_por_cambio_usuario() RETURNS trigger
 LANGUAGE plpgsql SET search_path=pg_catalog,public,seguridad AS $$
BEGIN
 IF NEW.password_hash IS DISTINCT FROM OLD.password_hash OR NEW.rol_id IS DISTINCT FROM OLD.rol_id
    OR NEW.eps_id IS DISTINCT FROM OLD.eps_id OR NEW.activo IS DISTINCT FROM OLD.activo THEN
  NEW.credenciales_version=OLD.credenciales_version+1;
 END IF;
 IF NEW.credenciales_version IS DISTINCT FROM OLD.credenciales_version THEN
  UPDATE seguridad.sesion SET revocada_en=COALESCE(revocada_en,now()),motivo_revocacion='Cambio de cuenta o credenciales'
   WHERE usuario_id=OLD.id AND revocada_en IS NULL;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER usuario_revoca BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION seguridad.revocar_por_cambio_usuario();

CREATE VIEW seguridad.v_usuario_permisos AS
 SELECT u.id AS usuario_id,u.rol_id,u.perfil,u.eps_id,rp.permiso_id
 FROM public.usuario u JOIN seguridad.rol_permiso rp ON rp.rol_id=u.rol_id WHERE u.activo;
CREATE VIEW seguridad.v_usuario_vistas AS
 SELECT DISTINCT p.usuario_id,v.id,v.nombre FROM seguridad.v_usuario_permisos p
 JOIN seguridad.vista v ON v.permiso_id=p.permiso_id
 WHERE (p.perfil='eps' AND v.id IN ('mis_tramites','trazabilidad','agente')) OR p.perfil='sunass';

CREATE FUNCTION seguridad.tiene_permiso(p_usuario text,p_permiso text) RETURNS boolean
 LANGUAGE sql STABLE SET search_path=pg_catalog,public,seguridad AS $$
 SELECT EXISTS(SELECT FROM seguridad.v_usuario_permisos WHERE usuario_id=p_usuario AND permiso_id=p_permiso)
$$;
CREATE FUNCTION seguridad.sesion_valida(p_sesion uuid) RETURNS boolean
 LANGUAGE sql STABLE SET search_path=pg_catalog,public,seguridad AS $$
 SELECT EXISTS(SELECT FROM seguridad.sesion s JOIN public.usuario u ON u.id=s.usuario_id
  WHERE s.id=p_sesion AND u.activo AND s.revocada_en IS NULL AND s.vence>now()
    AND s.credenciales_version=u.credenciales_version)
$$;
COMMIT;
