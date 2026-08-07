# 12 — Gaps y deuda documental

## Objetivo

Dejar explícito qué **no existe**, qué está **desactualizado** y qué **diverge** entre docs y código, para que Cursor AI no invente ni confíe en fuentes obsoletas.

## Alcance

- Ausencias estructurales (tests, CI, migraciones, configs)
- Desalineaciones Frontend/docs vs código
- Inconsistencias Backend internas
- Estado de plantillas `.env.example`

## Responsabilidades

| Artefacto | Debe usarse como |
|-----------|------------------|
| `docs/` (esta carpeta) | Fuente preferente para el agente |
| `Frontend/docs/*` | Histórica; verificar contra código |
| Código fuente | Fuente de verdad final |
| Este documento | Lista de advertencias |

## Dependencias

- Exploración del árbol de archivos y lectura de fuentes citadas
- `git show HEAD` para `.env.example` eliminados del working tree

## Archivos relacionados

| Path | Observación |
|------|-------------|
| `Frontend/docs/ARQUITECTURA.md` | Desfasada en auth/rutas/env |
| `Frontend/docs/API-BACKEND.md` | Roles incompletos vs código |
| `Frontend/docs/MODULOS-Y-RUTAS.md` | Útil; contrastar con `AppRoutes.tsx` |
| `Frontend/CONTRIBUTING.md` | Menciona `App.tsx` y hooks inexistentes |
| `Backend/README.md` | **No existe** |
| `.github/` | **No existe** |
| `**/tests` | **No existen** |

## No existe en el repositorio

| Ítem | Estado |
|------|--------|
| Carpeta raíz `docs/` previa a esta entrega | No existía |
| Carpeta `.cursor/` previa a esta entrega | No existía |
| `Backend/README.md` | No existe |
| Migraciones / Alembic / SQL versionado de esquema | No existen |
| Suites de test Frontend/Backend | No existen |
| CI/CD (GitHub Actions, etc.) | No existe |
| `Frontend/vite.config.*` | No existe |
| `Frontend/public/` | No existe |
| Hooks `useAuth` / `useApiFetch` | No existen (sí `useInactivityLogout`) |
| Backend router CG-11 | No existe |
| Refresh token / SSO / MFA | No existen |
| Capa de servicios Backend | No existe |

## Working tree vs git (plantillas env)

| Archivo | En `git HEAD` | En disco (al documentar) |
|---------|---------------|---------------------------|
| `Backend/.env.example` | Sí | Puede estar eliminado (`D` en status) |
| `Frontend/.env.example` | Sí | Puede estar eliminado |
| `deploy/.env.example` | Sí | Presente |

Root README aún instruye `copy .env.example .env` para Backend/Frontend.

## Desalineaciones docs ↔ código

| Afirmación antigua | Realidad en código |
|--------------------|--------------------|
| Rutas en `App.tsx` | Rutas en `AppRoutes.tsx` |
| Auth state solo en App sin Context | `AuthContext` |
| Solo roles `admin` / `user` | También `fed`, `cg`, `atenciones` |
| Editar `config.ts` a mano para API URL | `VITE_API_URL` / `VITE_CON_PREFIJO` |
| `/` siempre → `/pacientes` | `getDefaultRoute(role)` |
| `apiClient` es el cliente único | Servicios usan `fetch` local |
| React Query usado para datos | Provider presente; sin `useQuery` observado |

## Inconsistencias internas Backend

| Hallazgo | Detalle |
|----------|---------|
| Layout FED | Algunos módulos en raíz (`fed_mc_01_01.py`, `his_diario.py`, `cg_10.py`), otros en `FED/` |
| `DB_FED` / `DB_CG` | En env/`DB_NAMES`, pero SQL hardcodea nombres de BD |
| CG-10 | Comentario vs tabla `DBCGESTION_26.dbo.ID_10_Salud_Bucal` |
| `Oportunidad_Modificaciones.py` | Header aún menciona otro nombre de archivo |
| `fed_si_02_02` | Descripción placeholder en header |
| Login SQL | `FROM Usuarios` vs otros archivos `dbo.Usuarios` |

## Riesgos

- El agente siga `Frontend/docs/` o CONTRIBUTING sin cruzar con código.
- Se asuma que existen tests/CI/migraciones.
- Se “invente” CG-11 backend o hooks documentados pero ausentes.

## Mejoras posibles

- Marcar `Frontend/docs/` como legacy o redirigir a `docs/`.
- Restaurar `.env.example` en working tree.
- Resolver inconsistencias de comentarios/SQL en Backend.
- Añadir checklist de “definición de terminado” que incluya actualizar `docs/`.
