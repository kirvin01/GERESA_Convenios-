# GERESA Convenios

Sistema de consulta de historial de atenciones, reportes FED, convenios de gestión (CG), pacientes y administración de usuarios.

## Repositorio

https://github.com/kirvin01/GERESA_Convenios-

## Estructura del monorepo

| Carpeta | Descripción |
|---------|-------------|
| `Frontend/` | React + TypeScript + Vite + MUI |
| `Backend/` | FastAPI + SQL Server |
| `deploy/` | Docker, nginx y guía de despliegue en Ubuntu |

## Entornos

| Variable / aspecto | Desarrollo (Windows 10) | Producción (Ubuntu) |
|--------------------|-------------------------|---------------------|
| PC / servidor | `192.168.1.254` | `172.16.20.3` (local), `38.210.173.251` (pública) |
| SQL Server | `192.168.0.3` | `172.16.20.5` |
| URL frontend | `http://192.168.1.254:5173` | `http://indicadores.diresacusco.gob.pe` |
| URL API (desde el frontend) | `http://192.168.1.254:8000` | `http://indicadores.diresacusco.gob.pe` + prefijo `/api` |
| `VITE_CON_PREFIJO` | `NO` | `SI` |
| Backend `DB_HOST` | `192.168.0.3` | `172.16.20.5` |
| Backend `DRIVER` | `ODBC Driver 17 for SQL Server` | `ODBC Driver 18 for SQL Server` |

Los archivos `.env` **no van a git**; use las plantillas `.env.example` en cada carpeta.

---

## Desarrollo local (Windows 10)

### Prerrequisitos

- Python 3.11+
- Node.js 20+
- ODBC Driver 17 for SQL Server
- Acceso de red a SQL Server en `192.168.0.3`

### Backend

```powershell
cd Backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Editar .env con credenciales de desarrollo
.\run-server.bat
```

API: http://192.168.1.254:8000 — Docs: http://192.168.1.254:8000/docs

### Frontend

```powershell
cd Frontend
npm install
copy .env.example .env
# Editar .env: VITE_API_URL=http://192.168.1.254:8000, VITE_CON_PREFIJO=NO
npm run dev
# Para acceso desde otras PCs en la LAN:
npm run dev:host
```

UI: http://192.168.1.254:5173

La URL del API se configura en `Frontend/.env` (no editar `src/config.ts` manualmente).

---

## Producción (Ubuntu + Docker + nginx)

- **Dominio:** `indicadores.diresacusco.gob.pe`
- **Resumen:** `git pull` → configurar `.env` → `npm run build` → `docker compose up -d`

Pasos detallados en [`deploy/README.md`](deploy/README.md).

---

## Flujo Git recomendado

1. Rama `main` estable en producción.
2. Desarrollo en ramas `feature/nombre` → commit → push → merge o Pull Request.
3. En el servidor: `git pull origin main`, rebuild del frontend si aplica, y `docker compose up -d --build` en `deploy/`.

---

## Documentación adicional

- [`Frontend/docs/ARQUITECTURA.md`](Frontend/docs/ARQUITECTURA.md)
- [`Frontend/CONTRIBUTING.md`](Frontend/CONTRIBUTING.md)
- [`deploy/README.md`](deploy/README.md)

## Intranet institucional

El módulo Convenios/FED también aparece en el portal [Intranet GERESA Cusco](http://38.210.173.251/).
