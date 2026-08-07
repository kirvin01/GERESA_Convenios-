# 01 — Visión y contexto

## Objetivo

Describir qué es GERESA Convenios, para qué sirve y en qué entornos opera, según la evidencia del repositorio.

## Alcance

- Propósito funcional declarado en `README.md`
- Estructura del monorepo
- Entornos de desarrollo y producción documentados
- Enlace al repositorio remoto

**No incluye:** roadmap de producto no escrito, SLAs, ni organigrama institucional (no existen en el repo).

## Responsabilidades

| Actor / componente | Responsabilidad |
|--------------------|-----------------|
| Sistema | Consulta de historial de atenciones, reportes FED, convenios de gestión (CG), pacientes y administración de usuarios |
| `Frontend/` | SPA React para operadores |
| `Backend/` | API FastAPI contra SQL Server |
| `deploy/` | Empaquetado Docker + nginx para Ubuntu |
| Portal Intranet | El README indica que el módulo también aparece en Intranet GERESA Cusco (`http://38.210.173.251/`); la integración interna **no está detallada** en este monorepo |

## Dependencias

- Acceso a SQL Server (dev y prod según tabla de entornos)
- ODBC Driver 17 (Windows) / 18 (Docker Ubuntu)
- Node.js y Python según guías de setup

## Archivos relacionados

| Archivo | Relación |
|---------|----------|
| `README.md` | Fuente principal de visión y tabla de entornos |
| `Frontend/README.md` | Descripción orientada a UI |
| `deploy/README.md` | Dominio y topología de producción |
| `docs/02-arquitectura.md` | Detalle técnico de capas |

## Contexto factual (desde `README.md`)

| Aspecto | Desarrollo (Windows 10) | Producción (Ubuntu) |
|---------|-------------------------|---------------------|
| PC / servidor | `192.168.1.254` | `172.16.20.3` (local), `38.210.173.251` (pública) |
| SQL Server | `192.168.0.3` | `172.16.20.5` |
| URL frontend | `http://192.168.1.254:5173` | `http://indicadores.diresacusco.gob.pe` (también HTTPS en ejemplos SSL) |
| URL API | `http://192.168.1.254:8000` | dominio + prefijo `/api` |
| `VITE_CON_PREFIJO` | `NO` | `SI` |
| Driver ODBC | 17 | 18 |

Repositorio GitHub indicado: `https://github.com/kirvin01/GERESA_Convenios-`

## Riesgos

- Confundir IP de desarrollo local (`127.0.0.1` en un `.env` personal) con el SQL institucional (`192.168.0.3`).
- Asumir que Intranet y este monorepo comparten el mismo despliegue sin evidencia.

## Mejoras posibles

- Documentar formalmente el vínculo con Intranet (si aplica).
- Añadir diagrama de red institucional validado por infraestructura.
- Mantener una sola tabla de entornos como fuente de verdad (raíz + `docs/`).
