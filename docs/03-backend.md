# 03 — Backend (FastAPI)

## Objetivo

Documentar la estructura, entry points, módulos y convenciones del Backend a partir del código existente.

## Alcance

- Layout de `Backend/`
- Arranque (`main.py`, `run-server.bat`, Docker)
- Organización de routers y registries FED/CG
- Dependencias Python relevantes
- Lo que **no** existe (tests, migraciones, README propio)

## Responsabilidades

| Componente | Responsabilidad |
|------------|-----------------|
| `main.py` | Expone `app = create_app()` |
| `app/factory.py` | Metadata FastAPI, CORS, monta `api_router` |
| `app/api/router.py` | Incluye routers core + FED + CG |
| `app/api/routes/*` | Auth, usuarios, pacientes, certificados, config FED |
| `app/api/fed/registry.py` | Lista de routers FED |
| `app/api/cg/registry.py` | Lista de routers CG (solo CG-10) |
| `FED/*.py` + módulos raíz | Endpoints de reportes |
| `auth.py` / `permissions.py` | JWT y RBAC |
| `database.py` / `conexion.py` | Conexión SQLAlchemy |
| `Plantillas/` | PDF base de certificados |
| `run-server.bat` | Libera puerto 8000 y lanza uvicorn con venv |

## Dependencias

Declaradas en `Backend/requirements.txt` (grupos principales):

| Grupo | Paquetes (evidencia) |
|-------|----------------------|
| API | `fastapi`, `uvicorn`, `starlette` |
| Validación | `pydantic` |
| Config | `python-decouple` |
| SQL | `SQLAlchemy`, `pyodbc` |
| Auth | `python-jose`, `passlib`, `bcrypt==4.0.1`, `python-multipart` |
| PDF | `PyPDF2`, `reportlab` |
| Datos | `pandas`, `numpy` |
| Windows / notebook | `pywin32`, `ipykernel`, `ipython`, etc. |

Docker (`deploy/Dockerfile`) elimina `pywin32` antes de instalar.

## Archivos relacionados

| Ruta | Notas |
|------|-------|
| `Backend/main.py` | Entry |
| `Backend/app/` | Factory, router, deps |
| `Backend/FED/` | Mayoría de reportes FED |
| `Backend/fed_mc_01_01.py` | FED MC-01_01 en raíz (no bajo `FED/`) |
| `Backend/his_diario.py` | HIS diario en raíz |
| `Backend/cg_10.py` | CG-10 en raíz |
| `Backend/models.py` | Modelos Pydantic compartidos |
| `Backend/requirements.txt` | Dependencias |
| `Backend/.gitignore` | Ignora `venv/`, `.env`, etc. |
| `Backend/README.md` | **No existe** |
| `Backend/.env.example` | En git `HEAD` existe; en working tree puede estar borrado |
| `Backend/tests/` | **No existe** |
| Migraciones Alembic | **No existen** |

## Estructura observada

```
Backend/
  main.py
  app/
    factory.py
    api/
      router.py
      routes/          # auth, users, pacientes, certificados, config_fed
      fed/registry.py
      cg/registry.py
    core/              # deps.py, db.py
  auth.py
  permissions.py
  models.py
  database.py
  conexion.py
  FED/                 # routers FED
  Plantillas/
  fed_mc_01_01.py      # raíz
  his_diario.py        # raíz
  cg_10.py             # raíz
  requirements.txt
  run-server.bat
```

## Arranque

```text
uvicorn main:app --host 0.0.0.0 --port 8000
```

También: `Backend/run-server.bat` o contenedor Docker (`CMD` equivalente).

Docs interactivos estándar FastAPI: `/docs`, `/redoc`, `/openapi.json`.

## Riesgos

- Lógica SQL duplicada en cada módulo FED.
- Nombres de base hardcodeados en SQL (`DBFED2026.…`) pese a existir `DB_FED` / `DB_CG` en env.
- Comentarios de cabecera desalineados con tablas reales (ej. CG-10: comentario vs `DBCGESTION_26.dbo.ID_10_Salud_Bucal`).
- Dependencias Jupyter en `requirements.txt` sin uso claro en runtime de API.

## Mejoras posibles

- Mover todos los routers FED/CG bajo una misma carpeta.
- Añadir `Backend/README.md` y restaurar `.env.example` en working tree.
- Introducir tests y esquema SQL versionado para `dbo.Usuarios`.
- Usar `get_engine(DatabaseKey.FED|CG)` o parametrizar nombres de BD en queries.
