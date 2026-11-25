# YakuKhipu

Portal de expedientes para CPI, UFI y revisión periódica. La fuente de instalación es el único archivo `backend/sql/yakukhipu_final.sql`; Python no crea bases ni tablas.

- [Instalación del backend](backend/README.md)
- [Contrato de integración](docs/contrato_frontend.md)
- [Arquitectura](docs/arquitectura_fuentes.md)
- [Estado y verificación de la corrección](docs/correccion_backend.md)
- [Frontend existente](frontend/README.md)
- [Contribución](CONTRIBUTING.md)

Hay cuatro roles autenticados: Analista SRT, Coordinación DRE, Jefatura DRE y EPS. Ciudadanía consulta publicaciones sin una cuenta institucional. Gerencia y Consejo son actores documentales externos.

La API aplica permisos y ámbitos; el frontend existente todavía necesita integrar la sesión y los roles. Los cambios de esta corrección se limitan al backend y documentación.
