# conexion.py — compatibilidad hacia atras; usar database.py en codigo nuevo

from database import DatabaseKey, DB_NAMES, engine, get_db, get_engine

__all__ = ["engine", "get_engine", "get_db", "DatabaseKey", "DB_NAMES"]
