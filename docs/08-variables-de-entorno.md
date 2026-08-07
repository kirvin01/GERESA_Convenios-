# 08 — Variables de entorno

## Objetivo

Catalogar variables de entorno usadas por Backend, Frontend y deploy, sin revelar secretos.

## Alcance

- Variables leídas por código (`python-decouple`, `import.meta.env`)
- Plantillas `.env.example` en git
- Estado de archivos en working tree cuando difiere de git

**No incluye:** valores reales de contraseñas o `SECRET_KEY` de ningún entorno.

## Responsabilidades

| Archivo env | Responsabilidad |
|-------------|-----------------|
| `Backend/.env` | Runtime local API (gitignored) |
| `Frontend/.env` | Build/dev Vite (gitignored) |
| `deploy/.env` | Compose + contenedor API (gitignored) |
| `*.env.example` | Plantillas sin secretos reales |

## Dependencias

- `python-decouple` en Backend
- Prefijo `VITE_` en Frontend (inyección en build)
- `env_file: .env` en `deploy/docker-compose.yml`

## Archivos relacionados

| Archivo | Estado observado |
|---------|------------------|
| `deploy/.env.example` | Presente en disco |
| `Backend/.env.example` | En `git HEAD`; puede faltar en working tree (`git status` lo muestra eliminado) |
| `Frontend/.env.example` | En `git HEAD`; puede faltar en working tree |
| `Backend/.env` / `Frontend/.env` / `deploy/.env` | Locales; **no** documentar valores |
| `Frontend/src/config.ts` | Consume `VITE_*` |
| `Frontend/src/vite-env.d.ts` | Tipos TS de env |
| `Backend/database.py`, `auth.py`, `factory.py` | Consumen env Backend |

## Backend

| Variable | Uso | Default en código |
|----------|-----|-------------------|
| `DB_HOST` | Servidor SQL | **Requerida** |
| `DB_PORT` | Puerto SQL | **Requerida** |
| `DB_USER` | Usuario SQL | **Requerida** |
| `DB_PASSWORD` | Password SQL | **Requerida** |
| `DB_DATABASE` | BD GERESA | `DBGERESA` |
| `DB_FED` | Nombre lógico FED | `DBFED2026` |
| `DB_CG` | Nombre lógico CG | `DBCGESTION_26` |
| `DRIVER` | Driver ODBC | **Requerida** |
| `SECRET_KEY` | Firma JWT | **Requerida** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración token | `60` |
| `CORS_ORIGINS` | Orígenes CSV | Lista larga en `factory.py` |
| `APP_TITLE` | Título OpenAPI | `GERESAPI` |
| `APP_DESCRIPTION` | Descripción OpenAPI | texto default en factory |
| `APP_VERSION` | Versión OpenAPI | `1.0.0` |

Plantilla git `Backend/.env.example` (DEV): host ejemplo `192.168.0.3`, driver 17; bloque PROD comentado con driver 18.

## Frontend

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | URL base del API **sin** `/api` final; debe incluir esquema (`http://` o `https://`) |
| `VITE_CON_PREFIJO` | `SI` → añade `/api`; `NO` → acceso directo |

Tras cambiar `.env` de Frontend: `npm run build` o reiniciar `npm run dev` (las vars se embeben en build).

## Deploy

Además de variables de API, `deploy/.env.example` documenta:

| Variable | Uso |
|----------|-----|
| `NGINX_PORT` | Puerto publicado en host (default compose `8082`) |

## Riesgos

- Commitear `.env` reales (están en `.gitignore`, pero el error humano existe).
- `VITE_API_URL=localhost:8000` sin esquema → fallo Fetch.
- CORS sin origen del preview (`4173`) o LAN.
- README pide `copy .env.example` cuando el archivo puede no estar en working tree.

## Mejoras posibles

- Restaurar `.env.example` de Backend/Frontend en el working tree.
- Validar al arranque que `VITE_API_URL` tenga esquema.
- Separar claramente env de app vs env de compose.
