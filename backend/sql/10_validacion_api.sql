-- Solo si ya instalaste una versión anterior del esquema. No contiene datos demo.
-- En una base nueva 01_schema.sql ya incluye estas columnas.
BEGIN;
ALTER TABLE conversacion ADD COLUMN IF NOT EXISTS visitante_id varchar(36);
ALTER TABLE actuacion ADD COLUMN IF NOT EXISTS peticion_hash varchar(64);
COMMIT;
