# 05 — API endpoints

## Objetivo

Inventariar los endpoints HTTP expuestos por el Backend según el código de routers.

## Alcance

- Rutas montadas por `app/api/router.py` y registries FED/CG
- Método, path, permiso/auth cuando es observable
- Endpoints framework (`/docs`, etc.)

**No incluye:** contratos de respuesta JSON completos campo a campo (parcialmente descritos en `Frontend/docs/API-BACKEND.md`; no se inventan aquí).

## Responsabilidades

| Módulo | Prefijo / rutas | Auth |
|--------|-----------------|------|
| Auth | `/login`, `/me` | Público / Bearer |
| Usuarios | `/usuarios` | `require_admin` |
| Pacientes | `/paciente`, `/atenciones` | `pacientes:read` |
| Certificados | `/certificado/` | usuario autenticado |
| Config FED | `/config/fed/all` | usuario autenticado |
| FED | `/fed/*` | `fed:read` (salvo que se indique) |
| CG | `/cg/cg10/*` | `cg:read` |

## Dependencias

- Tabla `dbo.Usuarios` (login y admin)
- Tablas FED/CG referenciadas en cada módulo (nombres en SQL de cada archivo)
- CORS configurado para orígenes del frontend

## Archivos relacionados

| Archivo | Endpoints |
|---------|-----------|
| `Backend/app/api/routes/auth.py` | `/login`, `/me` |
| `Backend/app/api/routes/users.py` | `/usuarios` |
| `Backend/app/api/routes/pacientes.py` | `/paciente`, `/atenciones` |
| `Backend/app/api/routes/certificados.py` | `/certificado/` |
| `Backend/app/api/routes/config_fed.py` | `/config/fed/all` |
| `Backend/app/api/fed/registry.py` | Registro FED |
| `Backend/app/api/cg/registry.py` | Registro CG |
| `Frontend/docs/API-BACKEND.md` | Contrato esperado por frontend (puede divergir) |

## Core

| Método | Path | Auth | Notas |
|--------|------|------|-------|
| `POST` | `/login` | Público | `OAuth2PasswordRequestForm` |
| `GET` | `/me` | Bearer | `{username, role}` |
| `GET` | `/usuarios` | admin | Lista |
| `POST` | `/usuarios` | admin | Query: `username`, `password`, `role` |
| `PUT` | `/usuarios/{user_id}` | admin | Actualiza |
| `DELETE` | `/usuarios/{user_id}` | admin | Elimina |
| `GET` | `/paciente` | `pacientes:read` | Query `ndoc` |
| `GET` | `/atenciones` | `pacientes:read` | `anio`, `ndoc`, `mes`, paginación |
| `GET` | `/certificado/` | autenticado | Genera PDF |
| `GET` | `/config/fed/all` | autenticado | Fuentes desde `DBFED2026.dbo.Config` |

## FED — patrón común

La mayoría de indicadores bajo `/fed/{codigo}` exponen:

| Path relativo | Uso |
|---------------|-----|
| `/filtros` | Valores de filtros |
| `/tabla-completa` | Jerarquía geográfica |
| `/tabla-redes` | Redes / microredes / establecimientos |
| `/resumen` | Serie mensual |

| Prefijo | Módulo (archivo) | Extras observados |
|---------|------------------|-------------------|
| `/fed/mc0101` | `fed_mc_01_01.py` | — |
| `/fed/mc0201` | `FED/fed_mc_02_01.py` | — |
| `/fed/mc0301` | `FED/fed_mc_03_01.py` | — |
| `/fed/si0101` | `FED/fed_si_01_01.py` | — |
| `/fed/si0102` | `FED/fed_si_01_02.py` | — |
| `/fed/si0103` | `FED/fed_si_01_03.py` | `/nominal` |
| `/fed/si0201` | `FED/fed_si_02_01.py` | — |
| `/fed/si0202` | `FED/fed_si_02_02.py` | — |
| `/fed/si0203` | `FED/fed_si_02_03.py` | — |
| `/fed/si0204` | `FED/fed_si_02_04.py` | — |
| `/fed/si0301` | `FED/fed_si_03_01.py` | `/tabla-nominal` |
| `/fed/si0302` | `FED/fed_si_03_02.py` | — |
| `/fed/vi0101` | `FED/fed_vi_01_01.py` | `/nominal` |
| `/fed/vi0102` | `FED/fed_vi_01_02.py` | `/resumen-unidades-ejecutoras` |
| `/fed/his-diario` | `his_diario.py` | `/grafico`, `/resumen-mes`, `/por-sistema`, `/por-red` (no el patrón 4 estándar) |
| `/fed/oportunidad-modificaciones` | `FED/Oportunidad_Modificaciones.py` | `/oportunidad`, `/modificaciones`, `/resumen-mensual` |

## CG

| Método | Path | Auth |
|--------|------|------|
| `GET` | `/cg/cg10/filtros` | `cg:read` |
| `GET` | `/cg/cg10/tabla-completa` | `cg:read` |
| `GET` | `/cg/cg10/tabla-redes` | `cg:read` |
| `GET` | `/cg/cg10/resumen` | `cg:read` |
| `GET` | `/cg/cg10/subindicadores` | `cg:read` |

**No existe** módulo backend `cg11`. El frontend reutiliza `CG10Page` para `/reportesCG/cg11`.

## Framework

| Path | Origen |
|------|--------|
| `/docs`, `/redoc`, `/openapi.json` | FastAPI por defecto |

## Riesgos

- Inventario incompleto si se agregan routers sin actualizar registry + este doc.
- `Frontend/docs/API-BACKEND.md` lista roles/endpoints parciales; no usarlo como única fuente.
- Prefijo `/api` solo en despliegue con nginx / `VITE_CON_PREFIJO=SI`.

## Mejoras posibles

- Generar este inventario desde OpenAPI automáticamente.
- Documentar esquemas de respuesta por endpoint.
- Alinear headers de módulos FED con descripciones reales (hay placeholders).
