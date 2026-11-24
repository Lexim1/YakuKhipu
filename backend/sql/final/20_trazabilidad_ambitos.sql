BEGIN;
CREATE TABLE procedimiento_portal (
 id text PRIMARY KEY CHECK(id IN ('CPI','UFI','RP')), nombre text NOT NULL
);
INSERT INTO procedimiento_portal VALUES
 ('CPI','Cambio del programa de inversiones'),('UFI','Uso excepcional del Fondo de Inversiones y reservas'),
 ('RP','Revisión periódica');
-- Los otros procedimientos del dataset permanecen en tramite y sus tablas fuente.
CREATE VIEW v_expedientes_portal AS
 SELECT t.* FROM tramite t JOIN procedimiento_portal p ON p.id=t.procedimiento
 JOIN registro_fuente r ON r.canonical_id=t.id WHERE r.presente;

CREATE TABLE asignacion_tramite (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 tramite_id varchar(80) NOT NULL REFERENCES tramite(id),
 usuario_id varchar(80) NOT NULL REFERENCES usuario(id),
 asignado_por varchar(80) NOT NULL REFERENCES usuario(id),
 inicio timestamptz NOT NULL DEFAULT now(), fin timestamptz, motivo text,
 CHECK(fin IS NULL OR fin>=inicio)
);
CREATE UNIQUE INDEX asignacion_activa_unica ON asignacion_tramite(tramite_id) WHERE fin IS NULL;
CREATE INDEX asignacion_usuario ON asignacion_tramite(usuario_id,tramite_id) WHERE fin IS NULL;
CREATE FUNCTION validar_asignacion_portal() RETURNS trigger LANGUAGE plpgsql
 SET search_path=pg_catalog,public,seguridad AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.tramite_id IS DISTINCT FROM OLD.tramite_id OR NEW.usuario_id IS DISTINCT FROM OLD.usuario_id
     OR NEW.asignado_por IS DISTINCT FROM OLD.asignado_por OR NEW.inicio IS DISTINCT FROM OLD.inicio
     OR OLD.fin IS NOT NULL THEN
   RAISE EXCEPTION 'La asignación histórica no se reemplaza; cerrar e insertar otra' USING ERRCODE='23514';
  END IF;
  -- Permite cerrar una asignación aunque el analista o asignador ya estén inactivos.
  IF NEW.fin IS NOT NULL THEN RETURN NEW; END IF;
 END IF;
 IF NOT EXISTS(SELECT FROM public.usuario WHERE id=NEW.usuario_id AND activo AND rol_id='analista_srt') THEN
  RAISE EXCEPTION 'La asignación requiere un analista SRT activo' USING ERRCODE='23514';
 END IF;
 IF NOT seguridad.tiene_permiso(NEW.asignado_por,'asignacion.gestionar') THEN
  RAISE EXCEPTION 'El asignador no tiene permiso' USING ERRCODE='23514';
 END IF;
 IF NOT EXISTS(SELECT FROM public.v_expedientes_portal WHERE id=NEW.tramite_id) THEN
  RAISE EXCEPTION 'Expediente fuera de los tres procedimientos del portal' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER asignacion_valida BEFORE INSERT OR UPDATE ON asignacion_tramite
 FOR EACH ROW EXECUTE FUNCTION validar_asignacion_portal();

CREATE FUNCTION seguridad.puede_tramite(p_usuario text,p_tramite text,p_permiso text DEFAULT 'expediente.consultar')
 RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog,public,seguridad AS $$
 SELECT EXISTS(SELECT FROM public.usuario u JOIN public.v_expedientes_portal t ON t.id=p_tramite
 WHERE u.id=p_usuario AND u.activo AND seguridad.tiene_permiso(u.id,p_permiso) AND
 ((u.rol_id IN ('coordinacion_dre','jefatura_dre')) OR
  (u.rol_id='analista_srt' AND EXISTS(SELECT FROM public.asignacion_tramite a
    WHERE a.tramite_id=t.id AND a.usuario_id=u.id AND a.fin IS NULL)) OR
  (u.rol_id='eps' AND u.eps_id=t.eps_id)))
$$;
CREATE FUNCTION seguridad.puede_documento(p_usuario text,p_documento text) RETURNS boolean
 LANGUAGE sql STABLE SET search_path=pg_catalog,public,seguridad AS $$
 SELECT EXISTS(SELECT FROM public.documento d JOIN public.usuario u ON u.id=p_usuario
 JOIN public.registro_fuente r ON r.canonical_id=d.id AND r.presente
 WHERE d.id=p_documento AND seguridad.puede_tramite(u.id,d.tramite_id)
 AND (u.perfil='sunass' OR d.visibilidad IN ('partes','publica')))
$$;
CREATE FUNCTION seguridad.documento_publicado(p_documento text) RETURNS boolean
 LANGUAGE sql STABLE SET search_path=pg_catalog,public,seguridad AS $$
 SELECT EXISTS(SELECT FROM public.documento d JOIN public.v_expedientes_portal t ON t.id=d.tramite_id
 JOIN public.publicacion p ON p.tramite_id=t.id JOIN public.registro_fuente r ON r.canonical_id=d.id
 WHERE d.id=p_documento AND d.visibilidad='publica' AND p.publicada AND t.publicable AND r.presente)
$$;

CREATE TABLE interviniente_documental (
 id text PRIMARY KEY, nombre text NOT NULL
);
INSERT INTO interviniente_documental VALUES
 ('eps','EPS'),('mesa_partes','Mesa de Partes'),('dre','DRE'),('srt','SRT'),('equipo_srt','Equipo SRT'),
 ('oaj','Oficina de Asesoría Jurídica'),('gerencia','Gerencia General'),('consejo','Consejo Directivo'),
 ('du','Dirección de Usuarios'),('ods','Oficina Desconcentrada');
ALTER TABLE actuacion ADD COLUMN interviniente_id text REFERENCES interviniente_documental(id);
COMMENT ON COLUMN actuacion.usuario_id IS 'Persona del portal que registra; no equivale al emisor del acto externo.';
COMMENT ON COLUMN actuacion.interviniente_id IS 'Área o actor acreditado por el documento; no concede acceso al portal.';

CREATE TABLE encargo (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tramite_id varchar(80) NOT NULL REFERENCES tramite(id),
 titulo text NOT NULL, responsable_interviniente text NOT NULL REFERENCES interviniente_documental(id),
 responsable_nombre text, fecha_limite date,
 estado text NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','en_curso','hecho','cancelado')),
 documento_id varchar(120) NOT NULL, fecha_acreditada date NOT NULL,
 registrado_por varchar(80) NOT NULL REFERENCES usuario(id), version integer NOT NULL DEFAULT 1 CHECK(version>0),
 FOREIGN KEY(documento_id,tramite_id) REFERENCES documento(id,tramite_id)
);
CREATE INDEX encargo_tramite ON encargo(tramite_id,estado);
CREATE TABLE encargo_evento (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, encargo_id uuid NOT NULL REFERENCES encargo(id),
 estado text NOT NULL CHECK(estado IN ('pendiente','en_curso','hecho','cancelado')),
 documento_id varchar(120) NOT NULL REFERENCES documento(id), fecha_acreditada date NOT NULL,
 registrado_por varchar(80) NOT NULL REFERENCES usuario(id), registrado timestamptz NOT NULL DEFAULT now(), detalle text
);
CREATE FUNCTION validar_encargo_evento() RETURNS trigger LANGUAGE plpgsql
 SET search_path=pg_catalog,public,seguridad AS $$
BEGIN
 IF NOT EXISTS(SELECT FROM public.encargo e JOIN public.documento d ON d.tramite_id=e.tramite_id
  WHERE e.id=NEW.encargo_id AND d.id=NEW.documento_id) THEN
  RAISE EXCEPTION 'Evidencia de otro expediente' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER encargo_evento_valido BEFORE INSERT OR UPDATE ON encargo_evento
 FOR EACH ROW EXECUTE FUNCTION validar_encargo_evento();

CREATE VIEW v_trazabilidad_portal AS
 SELECT a.id,a.tramite_id,a.tipo,a.titulo,a.detalle,a.fecha_acreditada,a.fecha_por_validar,
 a.documento_id,a.fuente,a.verificada,a.estado_origen,a.estado_destino,a.paso_origen,a.paso_destino,
 a.usuario_id AS registrado_por,u.nombre_visible AS nombre_registrador,a.interviniente_id,
 i.nombre AS interviniente_documental,a.actor AS actor_fuente,a.registrado
 FROM actuacion a JOIN v_expedientes_portal t ON t.id=a.tramite_id
 LEFT JOIN usuario u ON u.id=a.usuario_id LEFT JOIN interviniente_documental i ON i.id=a.interviniente_id;
COMMIT;
