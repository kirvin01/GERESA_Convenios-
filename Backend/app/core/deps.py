# Dependencias compartidas (DB, etc.)

from fastapi import HTTPException
from sqlalchemy.engine import Connection

from conexion import engine


def get_db_connection() -> Connection:
    """Generador de conexion SQLAlchemy por request."""
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail="La conexion con la base de datos no esta disponible.",
        )
    conn = engine.connect()
    try:
        yield conn
    finally:
        conn.close()
