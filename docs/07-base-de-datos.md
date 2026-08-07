# 07 — Base de datos

## Objetivo

Documentar cómo el Backend se conecta a SQL Server y qué bases/tablas referencia el código.

## Alcance

- Configuración multi-base en `database.py`
- Variables de entorno de conexión
- Tabla de usuarios
- Bases y tablas citadas en módulos FED/CG (nombres observados en código)
- Ausencia de migraciones

## Responsabilidades

| Pieza | Responsabilidad |
|-------|-----------------|
| `database.py` | Construir engines `mssql+pyodbc`, pool, `DatabaseKey` |
| `conexion.py` | Reexport compatibilidad (`engine` = GERESA) |
| `app/core/deps.py` | Dependencia de conexión GERESA por request |
| Módulos FED/CG | Ejecutan SQL con nombres calificados a otras BD |
| SQL Server | Almacén de datos (esquema gestionado fuera de este repo) |

## Dependencias

Variables requeridas (sin default en código): `DRIVER`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`.

Con defaults: `DB_DATABASE` → `DBGERESA`, `DB_FED` → `DBFED2026`, `DB_CG` → `DBCGESTION_26`.

ODBC: `TrustServerCertificate=yes` en la cadena de conexión.

## Archivos relacionados

| Archivo | Relación |
|---------|----------|
| `Backend/database.py` | Engines |
| `Backend/conexion.py` | Alias |
| `Backend/app/core/deps.py` | `get_db_connection` |
| `Backend/app/api/routes/auth.py` | Lee `Usuarios` |
| `Backend/app/api/routes/users.py` | CRUD `dbo.Usuarios` |
| `deploy/.env.example` | Plantilla de variables DB |
| Scripts de migración | **No existen** en el repositorio |

## Claves multi-base

| `DatabaseKey` | Env | Default |
|---------------|-----|---------|
| `GERESA` | `DB_DATABASE` | `DBGERESA` |
| `FED` | `DB_FED` | `DBFED2026` |
| `CG` | `DB_CG` | `DBCGESTION_26` |

**Hecho verificado:** el `engine` global usado por rutas es siempre GERESA. `get_engine(FED|CG)` está exportado pero **no** se observó uso en routers; los reportes cruzan BD con SQL de tres partes (`DBFED2026.dbo.…`, etc.). Por tanto, cambiar solo `DB_FED`/`DB_CG` **no** reescribe esas literales.

## Tabla de autenticación

Usada por login y administración:

```text
dbo.Usuarios
  id
  username
  hashed_password
  role
  disabled
```

**No existe** en el repositorio un script SQL oficial de creación. Si la tabla no está, `/login` falla con error SQL `Invalid object name 'Usuarios'`.

## Tablas FED/CG referenciadas (muestra observada en código)

| Indicador | Tabla citada en código (ejemplo) |
|-----------|----------------------------------|
| MC-01_01 | `IRVIN_FED_MC_01_01` |
| MC-02_01 | `IRVIN_FED_MC_02_01` |
| MC-03_01 | `IRVIN_FED_MC_03_01` |
| SI-01_01 … SI-03_02 | `IRVIN_FED_SI_*` correspondientes |
| VI-01_01 / VI-01_02 | `IRVIN_FED_VI_*` |
| HIS diario | `FED_FMODIFICADO_DIARIO` |
| Oportunidad/modificaciones | `FED_TREGISTRO_v2`, `FED_FMODIFICADO_v2` |
| Config FED | `DBFED2026.dbo.Config` |
| CG-10 | `DBCGESTION_26.dbo.ID_10_Salud_Bucal` (comentario de cabecera menciona otros nombres) |

Esta lista no sustituye el diccionario de datos institucional; solo refleja literales del código explorado.

## Riesgos

- Entorno local apuntando a SQL Express vacío sin tablas FED.
- Divergencia comentario vs tabla real (CG-10).
- Sin migraciones: el esquema vive “fuera” del control de versiones de este repo.

## Mejoras posibles

- Versionar DDL mínimo (`Usuarios`) en `docs/` o `Backend/sql/`.
- Parametrizar nombres de base en queries.
- Documentar diccionario de datos FED/CG con dueño de datos.
