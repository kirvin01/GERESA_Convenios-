# GERESA Convenios

Sistema de consulta de historial de atenciones, reportes FED, convenios de gestión (CG) y administración de usuarios.

## Estructura

| Carpeta | Descripción |
|---------|-------------|
| `Frontend/` | React + TypeScript + Vite + MUI |
| `Backend/` | FastAPI + SQL Server |

## Inicio rápido

### Backend

```powershell
cd Backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
# Configurar Backend\.env
.\run-server.bat
```

API: http://127.0.0.1:8000 — Docs: http://127.0.0.1:8000/docs

### Frontend

```powershell
cd Frontend
npm install
# Ajustar Frontend\src\config.ts
npm run dev
```

## Repositorio

https://github.com/kirvin01/GERESA_Convenios-
