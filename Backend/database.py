# database.py — Pool de conexiones multi-base de datos SQL Server

from enum import Enum
from functools import lru_cache
import urllib.parse
from decouple import config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError

class DatabaseKey(str, Enum):
    GERESA = "geresa"
    FED = "fed"
    CG = "cg"

DB_NAMES: dict[DatabaseKey, str] = {
    DatabaseKey.GERESA: config("DB_DATABASE", default="DBGERESA"),
    DatabaseKey.FED: config("DB_FED", default="DBFED2026"),
    DatabaseKey.CG: config("DB_CG", default="DBCGESTION_26"),
}

def _build_engine(database: str) -> Engine:
    driver = "ODBC Driver 18 for SQL Server"
    params = urllib.parse.quote_plus(
        f"DRIVER={{{driver}}};"
        f"SERVER={config('DB_HOST')},{config('DB_PORT')};"
        f"DATABASE={database};"
        f"UID={config('DB_USER')};"
        f"PWD={config('DB_PASSWORD')};"
        f"TrustServerCertificate=yes;"
    )
    return create_engine(
        f"mssql+pyodbc:///?odbc_connect={params}",
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=1800,
        fast_executemany=True,
        echo=False,
    )

@lru_cache
def get_engine(key: DatabaseKey = DatabaseKey.GERESA) -> Engine:
    database = DB_NAMES[key]
    engine = _build_engine(database)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f" Conexion inicial exitosa a la base de datos '{database}'")
    except SQLAlchemyError as e:
        print(f" Error al conectar con '{database}': {e}")
        raise
    return engine

def get_db(key: DatabaseKey = DatabaseKey.GERESA):
    """Dependencia FastAPI: conexion por request con cierre automatico."""
    engine = get_engine(key)
    conn = engine.connect()
    try:
        yield conn
    finally:
        conn.close()

# Alias para compatibilidad con modulos existentes
engine = get_engine(DatabaseKey.GERESA)
