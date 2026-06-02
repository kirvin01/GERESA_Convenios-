# Dependencia DB reutilizable para routers FED/CG (migracion gradual)

from fastapi import HTTPException
from sqlalchemy.engine import Connection

from conexion import engine


def get_db() -> Connection:
    """Misma firma que get_db() local en routers FED — usar en nuevos modulos."""
    if engine is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible.")
    conn = engine.connect()
    try:
        yield conn
    finally:
        conn.close()
