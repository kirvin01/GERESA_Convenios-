# 02 — Arquitectura

## Objetivo

Explicar cómo se organizan las capas del sistema y cómo fluye una petición típica autenticada.

## Alcance

- Monorepo de tres carpetas principales
- Separación Frontend / Backend / Deploy
- Flujo login → JWT → consulta API → SQL Server
- Prefijo `/api` en producción (nginx), no en FastAPI

**No incluye:** diagramas UML formales (no existen en el repo) ni arquitectura de microservicios (el backend es una sola app FastAPI).

## Responsabilidades

| Capa | Responsabilidad |
|------|-----------------|
| Navegador (SPA) | UI, guards de ruta, almacenamiento JWT en `localStorage` |
| Vite (dev/preview) o nginx (prod) | Servir estáticos |
| nginx (prod) | Proxy `/api/` → contenedor `api:8000`; SPA `try_files` |
| FastAPI | Auth, autorización, consultas SQL, PDF certificados |
| SQL Server | Datos GERESA / FED / CG |

## Dependencias

- Frontend depende del Backend HTTP (CORS + JWT)
- Backend depende de SQL Server vía `pyodbc` + SQLAlchemy
- Producción depende de Docker Compose y nginx host/container

## Archivos relacionados

| Archivo | Relación |
|---------|----------|
| `Backend/main.py` | Entry ASGI |
| `Backend/app/factory.py` | Creación app + CORS |
| `Backend/app/api/router.py` | Montaje de routers |
| `Backend/database.py` | Engines SQL |
| `Frontend/src/App.tsx` | Providers (theme, QueryClient, Auth, Router) |
| `Frontend/src/AppRoutes.tsx` | Rutas y guards |
| `Frontend/src/config.ts` | Resolución `baseURL` |
| `deploy/docker-compose.yml` | Orquestación `api` + `nginx` |
| `deploy/nginx.conf` | Proxy interno `/api/` |
| `Frontend/docs/ARQUITECTURA.md` | Documento histórico (parcialmente desfasado) |

## Vista lógica

```
[Browser]
    |  HTTP(S)
    v
[Frontend estático] ---- JWT Bearer ----> [FastAPI :8000]
                                              |
                         (prod: nginx reescribe /api/* -> /*)
                                              |
                                              v
                                         [SQL Server]
                                    DBGERESA / DBFED2026 / DBCGESTION_26
```

### Hallazgos verificados

1. FastAPI **no** define `root_path` ni prefijo global `/api`; el prefijo lo agrega nginx en producción y el frontend vía `VITE_CON_PREFIJO=SI`.
2. No hay capa de servicios en Backend: SQL y lógica viven en handlers de rutas.
3. `@tanstack/react-query` está montado en `App.tsx` pero **no** se observó uso de `useQuery` en `src/`.
4. No existe CI/CD en el repositorio (sin `.github/workflows`).

## Riesgos

- Documentación histórica (`Frontend/docs/ARQUITECTURA.md`) describe auth en `App.tsx` y edición manual de `config.ts`; el código actual usa `AuthContext`, `AppRoutes.tsx` y `VITE_*`.
- Mezclar origen CORS incorrecto produce errores de red que parecen fallas de API.

## Mejoras posibles

- Introducir capa de servicios/repositorios en Backend (hoy no existe).
- Usar React Query de forma consistente o retirarlo de dependencias.
- Unificar documentación arquitectónica en `docs/` y marcar `Frontend/docs/` como legacy.
