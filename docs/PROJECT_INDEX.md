# PROJECT_INDEX — Punto de entrada del monorepo

> Índice estructural de **GERESA Convenios**.  
> Generado a partir de carpetas y archivos (sin análisis de lógica interna del código fuente).  
> Para detalle funcional ver el resto de `docs/` (01–12).

---

## Objetivo de este documento

Servir como mapa de navegación del repositorio para consultas futuras (humanas y Cursor AI).

---

## Árbol del proyecto

Excluye: `node_modules/`, `venv/`, `dist/`, `__pycache__/`, `.git/`.

```text
GERESA_Convenios/
├── .cursor/
│   └── rules/
│       ├── backend.mdc
│       ├── deploy.mdc
│       ├── documentation.mdc
│       ├── frontend.mdc
│       ├── no-inventar.mdc
│       ├── project-context.mdc
│       └── secrets-and-env.mdc
├── .gitignore
├── README.md
├── Backend/
│   ├── .env                          # local (gitignored)
│   ├── .gitignore
│   ├── requirements.txt
│   ├── main.py
│   ├── auth.py
│   ├── permissions.py
│   ├── models.py
│   ├── database.py
│   ├── conexion.py
│   ├── fed_mc_01_01.py               # reporte FED en raíz
│   ├── his_diario.py
│   ├── cg_10.py
│   ├── run-server.bat
│   ├── GitUp.bat
│   ├── app/
│   │   ├── factory.py
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   ├── router.py
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── pacientes.py
│   │   │   │   ├── certificados.py
│   │   │   │   └── config_fed.py
│   │   │   ├── fed/
│   │   │   │   └── registry.py
│   │   │   └── cg/
│   │   │       └── registry.py
│   │   └── core/
│   │       ├── deps.py
│   │       └── db.py
│   ├── FED/
│   │   ├── fed_mc_02_01.py
│   │   ├── fed_mc_03_01.py
│   │   ├── fed_si_01_01.py … fed_si_03_02.py
│   │   ├── fed_vi_01_01.py
│   │   ├── fed_vi_01_02.py
│   │   └── Oportunidad_Modificaciones.py
│   └── Plantillas/
│       └── certificado.pdf
├── Frontend/
│   ├── .env                          # local (gitignored)
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── index.html
│   ├── README.md
│   ├── CONTRIBUTING.md
│   ├── docs/
│   │   ├── API-BACKEND.md
│   │   ├── ARQUITECTURA.md
│   │   └── MODULOS-Y-RUTAS.md
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── AppRoutes.tsx
│       ├── App.css
│       ├── config.ts
│       ├── vite-env.d.ts
│       ├── assets/
│       │   ├── logo.webp
│       │   └── svgatenciones.svg
│       ├── components/
│       │   ├── layout/ (AppLayout, Header, Sidebar, Footer)
│       │   └── ui/ (InfoCard)
│       ├── config/
│       │   └── permissions.ts
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── hooks/
│       │   └── useInactivityLogout.ts
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── PatientsPage.tsx
│       │   ├── AdminUsersPage.tsx
│       │   ├── ForbiddenPage.tsx
│       │   ├── FED/ (16 páginas de reportes)
│       │   └── CG/ (CG10Page.tsx)
│       ├── services/
│       │   ├── apiClient.ts
│       │   ├── authService.ts
│       │   ├── servicesFED/ (16 servicios + configFed)
│       │   └── servicesCG/ (cgCG10Service.ts)
│       ├── theme/
│       └── types/
├── deploy/
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── nginx-host.conf.example
│   ├── nginx-indicadores-http-only.conf.example
│   ├── nginx-indicadores-ssl.conf.example
│   └── README.md
└── docs/
    ├── README.md
    ├── PROJECT_INDEX.md              # este archivo
    ├── 01-vision-y-contexto.md … 12-gaps-y-deuda-documental.md
```

### Conteos estructurales (aprox.)

| Ámbito | Cantidad / nota |
|--------|-----------------|
| Backend `*.py` (sin venv) | ~40 |
| Frontend `src` `*.ts`/`*.tsx` | ~56 |
| Páginas Frontend | 21 archivos |
| Módulos en `Backend/FED/` | 14 archivos |
| Reportes FED adicionales en raíz Backend | `fed_mc_01_01.py`, `his_diario.py` |
| Reportes CG en raíz Backend | `cg_10.py` |

---

## Tecnologías utilizadas

| Capa | Tecnología (detectada por manifiestos / nombres) |
|------|--------------------------------------------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy, pyodbc |
| Datos | Microsoft SQL Server (vía ODBC) |
| UI | MUI (Material UI), Emotion, Recharts, MUI X Data Grid |
| Auth | JWT (`python-jose`), bcrypt/passlib |
| Deploy | Docker, Docker Compose, nginx |
| Docs / AI | Markdown en `docs/`, reglas Cursor en `.cursor/rules/` |

---

## Frameworks

| Framework | Ubicación / evidencia |
|-----------|----------------------|
| **React** | `Frontend/package.json`, `src/*.tsx` |
| **Vite** | scripts `dev` / `build` / `preview` en `package.json` |
| **FastAPI** | `Backend/requirements.txt`, `Backend/main.py`, `app/factory.py` |
| **SQLAlchemy** | `requirements.txt`, `database.py` |
| **React Router** | `react-router-dom` + `AppRoutes.tsx` |
| **TanStack React Query** | dependencia en `package.json` (+ provider en árbol `App.tsx`) |
| **Docker Compose** | `deploy/docker-compose.yml` |

**No detectado en estructura:** Next.js, NestJS, Django, Flask, Express, Angular, Vue.

---

## Librerías

### Frontend (`package.json`)

**dependencies:** `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `@mui/material`, `@mui/x-data-grid`, `@tanstack/react-query`, `react`, `react-dom`, `react-router-dom`, `recharts`

**devDependencies:** `@types/react`, `@types/react-dom`, `typescript`, `vite`

### Backend (`requirements.txt`) — grupos por nombre

| Grupo | Paquetes |
|-------|----------|
| API / ASGI | `fastapi`, `starlette`, `uvicorn`, `anyio`, … |
| Validación | `pydantic`, `pydantic_core`, … |
| SQL | `SQLAlchemy`, `pyodbc`, `greenlet` |
| Auth | `python-jose[cryptography]`, `passlib[bcrypt]`, `bcrypt`, `python-multipart` |
| Config | `python-decouple` |
| PDF | `PyPDF2`, `reportlab` |
| Datos | `pandas`, `numpy` |
| Windows / notebook tooling | `pywin32`, `ipykernel`, `ipython`, `jupyter_*`, `debugpy`, … |

---

## Lenguajes

| Lenguaje | Extensiones / uso |
|----------|-------------------|
| TypeScript / TSX | Frontend (`Frontend/src`) |
| Python | Backend (`Backend/**/*.py`) |
| Markdown | `docs/`, `README*`, `Frontend/docs/`, `deploy/README.md` |
| HTML | `Frontend/index.html` |
| CSS | `Frontend/src/App.css` |
| YAML | `deploy/docker-compose.yml` |
| Dockerfile | `deploy/Dockerfile` |
| nginx conf | `deploy/*.conf*` |
| Batch | `Backend/*.bat` |
| Cursor rules | `.cursor/rules/*.mdc` |

---

## Carpetas importantes

| Carpeta | Rol estructural |
|---------|-----------------|
| `Frontend/` | SPA React |
| `Frontend/src/pages/` | Pantallas (Login, Pacientes, Admin, FED, CG) |
| `Frontend/src/services/` | Clientes HTTP por módulo |
| `Frontend/src/components/` | Layout y UI reutilizable |
| `Backend/` | API FastAPI |
| `Backend/app/` | Factory, router, deps |
| `Backend/app/api/routes/` | Auth, usuarios, pacientes, certificados, config FED |
| `Backend/FED/` | Routers de reportes FED |
| `Backend/Plantillas/` | Plantilla PDF |
| `deploy/` | Docker + nginx |
| `docs/` | Documentación canónica del monorepo |
| `.cursor/rules/` | Reglas permanentes para Cursor AI |

**No existen (estructura):** `tests/`, `__tests__/`, `.github/`, `Frontend/public/`, `Frontend/vite.config.*`, carpeta `cron/`.

---

## Módulos detectados

### Frontend — páginas

| Módulo | Archivos |
|--------|----------|
| Auth / sistema | `LoginPage.tsx`, `ForbiddenPage.tsx` |
| Pacientes / atenciones | `PatientsPage.tsx` |
| Admin | `AdminUsersPage.tsx` |
| FED | `FedMC0101…0301`, `FedSI0101…0302`, `FedVI0101/0102`, `HisDiarioPage`, `OportunidadModificacionesPage` |
| CG | `CG10Page.tsx` |

### Frontend — servicios

| Carpeta | Contenido |
|---------|-----------|
| `services/` | `apiClient.ts`, `authService.ts` |
| `servicesFED/` | un service por indicador + `configFedService.ts` + HIS + oportunidad |
| `servicesCG/` | `cgCG10Service.ts` |

### Backend — API core

| Archivo | Módulo inferido por nombre |
|---------|----------------------------|
| `routes/auth.py` | Autenticación |
| `routes/users.py` | Usuarios |
| `routes/pacientes.py` | Pacientes / atenciones |
| `routes/certificados.py` | Certificados PDF |
| `routes/config_fed.py` | Config FED |
| `auth.py` / `permissions.py` | JWT / RBAC |
| `database.py` / `conexion.py` | Conexión BD |

### Backend — reportes

| Grupo | Archivos |
|-------|----------|
| FED (carpeta) | `fed_mc_*`, `fed_si_*`, `fed_vi_*`, `Oportunidad_Modificaciones.py` |
| FED (raíz) | `fed_mc_01_01.py`, `his_diario.py` |
| CG (raíz) | `cg_10.py` |
| Registros | `app/api/fed/registry.py`, `app/api/cg/registry.py` |

---

## Configuración

| Archivo | Tipo |
|---------|------|
| `Frontend/package.json` | npm scripts + deps |
| `Frontend/tsconfig.json` | TypeScript |
| `Frontend/.env` | Env local Vite (gitignored) |
| `Frontend/.gitignore` | Ignore FE |
| `Backend/requirements.txt` | deps Python |
| `Backend/.env` | Env local API (gitignored) |
| `Backend/.gitignore` | Ignore BE |
| `deploy/.env.example` | Plantilla deploy |
| `deploy/docker-compose.yml` | Orquestación |
| `deploy/Dockerfile` | Imagen API |
| `deploy/nginx.conf` | Nginx contenedor |
| `deploy/nginx-*.conf.example` | Nginx host / SSL / HTTP-only |
| `.gitignore` (raíz) | Ignore monorepo |
| `.cursor/rules/*.mdc` | Reglas AI |

**Estado observado en disco:**

- `Backend/.env.example` / `Frontend/.env.example`: **no listados** en el árbol actual del working tree (pueden existir solo en git).
- `Frontend/vite.config.*`: **no existe**.

---

## Recursos

| Recurso | Ruta |
|---------|------|
| Logo | `Frontend/src/assets/logo.webp` |
| Ícono SVG | `Frontend/src/assets/svgatenciones.svg` |
| Plantilla certificado PDF | `Backend/Plantillas/certificado.pdf` |
| Docs históricas FE | `Frontend/docs/*.md` |
| Docs canónicas | `docs/*.md` |
| README ops | `README.md`, `deploy/README.md`, `Frontend/README.md` |

---

## Scripts

### npm (`Frontend/package.json`)

| Script | Comando |
|--------|---------|
| `dev` | `vite` |
| `dev:host` | `vite --host 0.0.0.0` |
| `build` | `tsc && vite build` |
| `preview` | `vite preview` |

### Batch (`Backend/`)

| Script | Nombre |
|--------|--------|
| Arranque API | `run-server.bat` |
| Helper git | `GitUp.bat` |

### Docker

| Artefacto | Uso |
|-----------|-----|
| `deploy/docker-compose.yml` | `api` + `nginx` |
| `deploy/Dockerfile` | Build imagen API |

**No detectado:** scripts `test`, `lint`, `migrate`, Makefile, `*.sh` de cron.

---

## Cron

| Ítem | Estado |
|------|--------|
| Archivos `*cron*` | **No existen** |
| Crontab en repo | **No existe** |
| Jobs programados en Compose | **No detectados** por nombre |

> Las tareas programadas, si existen, están **fuera** de este repositorio (no inventar).

---

## API

Estructura de montaje (por nombres de archivo):

```text
Backend/main.py
  └── app/factory.py
        └── app/api/router.py
              ├── routes/auth.py
              ├── routes/users.py
              ├── routes/pacientes.py
              ├── routes/certificados.py
              ├── routes/config_fed.py
              ├── fed/registry.py  → Backend/FED/* + fed_mc_01_01 + his_diario
              └── cg/registry.py   → cg_10.py
```

Documentación de endpoints detallada: `docs/05-api-endpoints.md`  
Contrato histórico FE: `Frontend/docs/API-BACKEND.md`

OpenAPI runtime típico FastAPI: `/docs` (cuando el servidor corre) — no es un archivo del repo.

---

## Base de datos

| Evidencia estructural | Inferencia |
|-----------------------|------------|
| `Backend/database.py` | Capa de conexión / engines |
| `Backend/conexion.py` | Compat / reexport |
| `Backend/app/core/deps.py`, `db.py` | Dependencias de request |
| `requirements.txt`: `SQLAlchemy`, `pyodbc` | Acceso SQL Server vía ODBC |
| Env plantilla deploy | vars `DB_*`, `DRIVER` |
| Scripts SQL / migraciones / Alembic | **No existen** en el árbol |

Detalle de nombres de BD/tablas: `docs/07-base-de-datos.md` (documento aparte; no re-analizado aquí).

---

## Dashboard

| Búsqueda | Resultado |
|----------|-----------|
| Archivos con nombre `*Dashboard*` / `*dashboard*` | **Ninguno** en el árbol (fuera de `node_modules`/`venv`/`dist`) |
| Página home tipo dashboard dedicada | **No detectada** por nombre de archivo |

La UI de entrada operativa se organiza por páginas (`PatientsPage`, reportes FED/CG, admin), no por un módulo llamado Dashboard.

---

## Reportes

### Frontend (`src/pages/FED/` + `CG/`)

| Tipo | Páginas (nombre de archivo) |
|------|-----------------------------|
| FED MC | `FedMC0101Page`, `FedMC0201Page`, `FedMC0301Page` |
| FED SI | `FedSI0101` … `FedSI0302` (8 archivos) |
| FED VI | `FedVI0101Page`, `FedVI0102Page` |
| FED otros | `HisDiarioPage`, `OportunidadModificacionesPage` |
| CG | `CG10Page` |

### Backend

| Tipo | Archivos |
|------|----------|
| FED | `Backend/FED/*` + `fed_mc_01_01.py` + `his_diario.py` |
| CG | `cg_10.py` |
| PDF certificado | `routes/certificados.py` + `Plantillas/certificado.pdf` |

Mapa ruta↔página↔API: `docs/09-modulos-fed-y-cg.md`.

---

## Mapa rápido hacia otros docs

| Necesitas… | Ir a |
|------------|------|
| Visión / entornos | `docs/01-vision-y-contexto.md` |
| Arquitectura | `docs/02-arquitectura.md` |
| Backend | `docs/03-backend.md` |
| Frontend | `docs/04-frontend.md` |
| Endpoints | `docs/05-api-endpoints.md` |
| Auth | `docs/06-autenticacion-y-autorizacion.md` |
| BD | `docs/07-base-de-datos.md` |
| Variables `.env` | `docs/08-variables-de-entorno.md` |
| FED/CG | `docs/09-modulos-fed-y-cg.md` |
| Deploy | `docs/10-despliegue.md` |
| Desarrollo local | `docs/11-flujo-de-desarrollo.md` |
| Gaps / lo que no existe | `docs/12-gaps-y-deuda-documental.md` |

---

## Nota para Cursor AI

1. Empezar por **este archivo** (`docs/PROJECT_INDEX.md`).  
2. Profundizar en el doc numerado del dominio.  
3. Contrastar siempre con el árbol real de archivos.  
4. Si un artefacto no aparece arriba, tratarlo como **No existe** hasta verificar.
