# Arquitectura vigente

El único esquema instalable es backend/sql/yakukhipu_final.sql, ejecutado manualmente con psql. No se utiliza Alembic ni Base.metadata.create_all. Los modelos Python son mapeos, no la fuente del DDL.

La API vive en app/api; auth centraliza sesiones y permisos; modules implementa reglas de negocio; repositories aplica alcance por expediente y visibilidad documental antes de devolver fuentes. agent contiene recuperación, grafo y transporte de IA. La caché incluye usuario, rol, permisos, expediente, pregunta, historial y versión.

Los tres roles SUNASS comparten trazabilidad, con ámbitos diferentes. El Analista requiere asignación activa. Coordinación/Jefatura ven la cartera de los tres procedimientos; EPS solo su empresa y Ciudadanía solo publicaciones habilitadas. Los demás procedimientos del dataset se conservan en BD pero no aparecen en el portal.

Las fuentes conservan hashes, lotes y procedencia. No se convierten automáticamente en información oficial. Las publicaciones requieren revisión explícita y los metadatos candidatos siguen pendientes hasta acreditación humana.

Los archivos en docs/archive documentan estados históricos; no son instrucciones de instalación ni resultados vigentes. Las verificaciones actuales están en docs/correccion_backend.md.
