# 11 — Flujo de desarrollo

## Objetivo

Describir cómo levantar y trabajar el monorepo en desarrollo local Windows según evidencia del repo y scripts existentes.

## Alcance

- Prerrequisitos declarados
- Arranque Backend y Frontend
- Build/preview
- Flujo Git recomendado en README
- Limitaciones (tests, plantillas env)

## Responsabilidades

| Rol | Responsabilidad |
|-----|-----------------|
| Desarrollador | Configurar `.env`, venv, `npm install`, no commitear secretos |
| Backend | Escuchar `:8000` |
| Frontend | Dev `:5173` o preview `:4173` |
| Git | Ramas feature → merge a `main` (según README raíz) |

## Dependencias

Según `README.md` raíz:

- Python 3.11+ (Docker usa 3.11; el entorno local puede variar)
- Node.js 20+
- ODBC Driver 17 for SQL Server
- Acceso de red a SQL de desarrollo (`192.168.0.3` en documentación)

## Archivos relacionados

| Archivo | Uso |
|---------|-----|
| `Backend/run-server.bat` | Arranque Windows API |
| `Backend/requirements.txt` | Deps Python |
| `Frontend/package.json` | Scripts npm |
| `README.md` | Setup oficial |
| `Frontend/CONTRIBUTING.md` | Convenciones (parcialmente desfasadas) |
| `.gitignore` | Excluye `.env`, `venv`, `node_modules`, `dist` |

## Backend (pasos documentados)

```powershell
cd Backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
# copiar .env.example → .env y editar
.\run-server.bat
# o: uvicorn main:app --host 0.0.0.0 --port 8000
```

API local tipica: `http://localhost:8000` — docs en `/docs`.

## Frontend (pasos documentados)

```powershell
cd Frontend
npm install
# copiar .env.example → .env
# DEV: VITE_API_URL=http://localhost:8000 (o IP LAN), VITE_CON_PREFIJO=NO
npm run dev
# o acceso LAN:
npm run dev:host
```

Preview (requiere build previo):

```powershell
npm run build
npm run preview -- --host 0.0.0.0
```

## CORS

Incluir el origen exacto del frontend en `CORS_ORIGINS` (p. ej. `http://localhost:5173` o `http://localhost:4173`). Defaults en `factory.py` ya contemplan varios orígenes; un `.env` restrictivo puede omitirlos.

## Git (README raíz)

1. `main` estable en producción  
2. Desarrollo en `feature/nombre` → commit → push → merge/PR  
3. En servidor: pull, rebuild frontend si aplica, `docker compose up -d --build`

**No existe** configuración GitHub Actions / CI en el repo.

## Riesgos

- Trabajar contra SQL local vacío sin tablas FED/Usuarios.
- Preview sin `npm run build`.
- Python 3.14 puede exigir wheels más nuevos que pins de `requirements.txt` (hechos de entorno; no está documentado en README).
- CONTRIBUTING pide editar `App.tsx` para nuevas rutas (incorrecto hoy).

## Mejoras posibles

- Checklist de humo post-setup (`/docs`, `/login`, un FED).
- Script único de bootstrap.
- Añadir tests mínimos y comando npm/pytest.
- Corregir CONTRIBUTING para apuntar a `AppRoutes.tsx`.
