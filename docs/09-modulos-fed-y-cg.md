# 09 — Módulos FED y CG

## Objetivo

Mapear reportes FED/CG entre rutas frontend, páginas, servicios y endpoints backend.

## Alcance

- Correspondencia route ↔ page ↔ service ↔ API prefix
- Clasificación MC / SI / VI / HIS / oportunidad
- CG-10 y reutilización de CG-11 en UI

**No incluye:** definición epidemiológica oficial de cada indicador (solo lo que aparece en código/comentarios).

## Responsabilidades

| Capa | Responsabilidad |
|------|-----------------|
| `AppRoutes.tsx` + Sidebar | Navegación y permisos `fed:read` / `cg:read` |
| Páginas `pages/FED/*`, `pages/CG/*` | UI de cada reporte |
| `servicesFED/*`, `servicesCG/*` | HTTP al Backend |
| Routers Backend | Consultas SQL y JSON/PDF |
| Registries | Lista de routers montados |

## Dependencias

- Permiso `fed:read` o `cg:read`
- Bases `DBFED2026` / `DBCGESTION_26` (literales SQL)
- Config FED opcional vía `/config/fed/all`

## Archivos relacionados

| Área | Rutas |
|------|-------|
| Registry FED | `Backend/app/api/fed/registry.py` |
| Registry CG | `Backend/app/api/cg/registry.py` |
| Páginas | `Frontend/src/pages/FED/`, `Frontend/src/pages/CG/` |
| Servicios | `Frontend/src/services/servicesFED/`, `servicesCG/` |
| Mapa histórico | `Frontend/docs/MODULOS-Y-RUTAS.md` |

## Mapa FED

| Ruta UI | Página | Servicio FE | Prefijo API |
|---------|--------|-------------|-------------|
| `/reportesFED/fed01` | `FedMC0101Page.tsx` | `fedMC0101Service.ts` | `/fed/mc0101` |
| `/reportesFED/fed02` | `FedMC0201Page.tsx` | `fedMC0201Service.ts` | `/fed/mc0201` |
| `/reportesFED/fed03` | `FedMC0301Page.tsx` | `fedMC0301Service.ts` | `/fed/mc0301` |
| `/reportesFED/fed04` | `FedSI0101Page.tsx` | `fedSI0101Service.ts` | `/fed/si0101` |
| `/reportesFED/fed05` | `FedSI0102Page.tsx` | `fedSI0102Service.ts` | `/fed/si0102` |
| `/reportesFED/fed06` | `FedSI0103Page.tsx` | `fedSI0103Service.ts` | `/fed/si0103` |
| `/reportesFED/fed07` | `FedSI0201Page.tsx` | `fedSI0201Service.ts` | `/fed/si0201` |
| `/reportesFED/fed08` | `FedSI0202Page.tsx` | `fedSI0202Service.ts` | `/fed/si0202` |
| `/reportesFED/fed09` | `FedSI0203Page.tsx` | `fedSI0203Service.ts` | `/fed/si0203` |
| `/reportesFED/fed10` | `FedSI0204Page.tsx` | `fedSI0204Service.ts` | `/fed/si0204` |
| `/reportesFED/fed11` | `FedSI0301Page.tsx` | `fedSI0301Service.ts` | `/fed/si0301` |
| `/reportesFED/fed12` | `FedSI0302Page.tsx` | `fedSI0302Service.ts` | `/fed/si0302` |
| `/reportesFED/fed13` | `FedVI0101Page.tsx` | `fedVI0101Service.ts` | `/fed/vi0101` |
| `/reportesFED/fed14` | `FedVI0102Page.tsx` | `fedVI0102Service.ts` | `/fed/vi0102` |
| `/reportesFED/fed015` | `HisDiarioPage.tsx` | `hisDiarioService.ts` | `/fed/his-diario` |
| `/reportesFED/fed016` | `OportunidadModificacionesPage.tsx` | `oportunidad_modificaciones.ts` | `/fed/oportunidad-modificaciones` |

Servicio auxiliar: `configFedService.ts` → `/config/fed/all`.

## Mapa CG

| Ruta UI | Página | Servicio | Prefijo API |
|---------|--------|----------|-------------|
| `/reportesCG/cg10` | `CG10Page.tsx` | `cgCG10Service.ts` | `/cg/cg10` |
| `/reportesCG/cg11` | `CG10Page.tsx` (mismo componente) | `cgCG10Service.ts` | `/cg/cg10` |

**No existe** backend dedicado a CG-11.

## Cómo se registra un reporte nuevo (estado actual del código)

Backend:

1. Crear módulo router con prefijo `/fed/...` o `/cg/...`
2. Añadirlo a `FED_ROUTERS` o `CG_ROUTERS`

Frontend:

1. Crear `*Service.ts` y `*Page.tsx`
2. Registrar ruta lazy en `AppRoutes.tsx` (no en `App.tsx`)
3. Añadir entrada de menú en Sidebar si aplica
4. Añadir permiso en `ROUTE_PERMISSIONS`

`Frontend/CONTRIBUTING.md` aún menciona `App.tsx` — desfasado respecto al código.

## Riesgos

- Numeración inconsistente (`fed01`…`fed14` vs `fed015`/`fed016`).
- Duplicación de código entre módulos FED casi idénticos.
- CG-11 puede confundir (misma UI/API que CG-10).
- Headers/comentarios incorrectos en algunos archivos Backend.

## Mejoras posibles

- Factorizar un generador/plantilla de indicador FED.
- Aclarar producto: ¿CG-11 es alias temporal o indicador distinto?
- Homogeneizar IDs de rutas (`fed15`/`fed16`).
