# 04 — Frontend (React + Vite)

## Objetivo

Documentar la estructura, scripts, configuración y patrones reales del Frontend.

## Alcance

- Stack y scripts de `package.json`
- Árbol `src/`
- Rutas, auth UI, servicios HTTP
- Variables `VITE_*`
- Diferencias frente a docs antiguas en `Frontend/docs/`

## Responsabilidades

| Componente | Responsabilidad |
|------------|-----------------|
| `src/main.tsx` | Bootstrap React |
| `src/App.tsx` | Theme MUI, QueryClient, Router, AuthProvider, Suspense |
| `src/AppRoutes.tsx` | Definición de rutas + `RequireAuth` / `RequirePermission` |
| `src/config.ts` | `API_CONFIG.baseURL` desde env |
| `src/context/AuthContext.tsx` | Estado de sesión y `can(permission)` |
| `src/services/authService.ts` | Login, token `localStorage`, headers |
| `src/services/apiClient.ts` | `apiFetch` compartido + handler 401 (poco usado por servicios) |
| `src/services/servicesFED/*` | Llamadas a endpoints FED |
| `src/services/servicesCG/*` | Llamadas a CG-10 |
| `src/pages/*` | Pantallas |
| `src/components/layout/*` | Header, Sidebar, Footer, AppLayout |
| `src/config/permissions.ts` | Mapa rol→permisos y rutas→permisos |

## Dependencias

Desde `Frontend/package.json`:

| Tipo | Paquetes |
|------|----------|
| UI | `@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`, `@emotion/*` |
| App | `react`, `react-dom`, `react-router-dom` |
| Datos | `@tanstack/react-query`, `recharts` |
| Build | `vite`, `typescript` |

**Scripts:** `dev`, `dev:host`, `build` (`tsc && vite build`), `preview`.

**No existe** script de tests ni runner de pruebas en `package.json`.

## Archivos relacionados

| Ruta | Notas |
|------|-------|
| `Frontend/package.json` | name: `atenciones` |
| `Frontend/src/` | Código fuente |
| `Frontend/index.html` | Título: Sistema de Consultas |
| `Frontend/.env` | Local (gitignored) |
| `Frontend/.env.example` | En git `HEAD`; puede faltar en working tree |
| `Frontend/vite.config.*` | **No existe** (Vite por defecto) |
| `Frontend/public/` | **No existe** |
| `Frontend/docs/` | Docs históricas |
| `Frontend/CONTRIBUTING.md` | Guía de contribución (parcialmente desfasada) |

## Árbol `src/` (resumen)

```
src/
  App.tsx, AppRoutes.tsx, config.ts, main.tsx
  components/layout/, components/ui/
  config/permissions.ts
  context/AuthContext.tsx
  hooks/useInactivityLogout.ts
  pages/ (Login, Patients, Admin, Forbidden, FED/*, CG/)
  services/ (apiClient, authService, servicesFED, servicesCG)
  theme/, types/, assets/
```

## Resolución de API URL

En `src/config.ts`:

1. Lee `VITE_API_URL` (sin `/` final).
2. En producción, si la página es HTTPS y la URL es HTTP → fuerza HTTPS.
3. Si `VITE_CON_PREFIJO` ∈ {`SI`,`S`,`TRUE`,`1`,`YES`} → concatena `/api`.

## Patrón de fetch observado

- Servicios FED/CG definen un `apiFetch` **local** con `fetch` + `authHeader()`.
- `apiClient.ts` existe con dedupe GET y logout en 401, pero los servicios revisados **no** lo importan.
- React Query está cableado; no hay hooks `useQuery` en `src/` según exploración.

## Riesgos

- Docs internas desactualizadas (rutas en `App.tsx`, roles solo `admin`/`user`, etc.).
- `VITE_API_URL` sin esquema `http://` rompe el Fetch API (error de “URL scheme”).
- Logout por 401 del `apiClient` no se dispara si los servicios usan fetch local.

## Mejoras posibles

- Unificar todas las llamadas en `apiClient`.
- Actualizar `Frontend/docs/` o apuntarlas a `docs/` raíz.
- Añadir `vite.config.ts` y `.env.example` en working tree.
- Usar React Query o eliminarlo si no se usará.
