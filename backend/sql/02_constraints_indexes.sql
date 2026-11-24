CREATE INDEX tramite_eps ON tramite(eps_id);
CREATE INDEX documento_tramite ON documento(tramite_id);
CREATE INDEX fragmento_tramite ON fragmento(tramite_id);
CREATE INDEX actuacion_tramite ON actuacion(tramite_id,id);
CREATE INDEX registro_datos ON registro_fuente USING gin(datos);
CREATE INDEX mensaje_conversacion ON mensaje(conversacion_id,id);
