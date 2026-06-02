# fed_vi_01_02.py
# Router para el reporte FED VI-01.02 — Nominales de gestantes
# Basado en el archivo Excel FED VI-01.02.xlsx

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.engine import Connection
from typing import Optional
from conexion import engine
from permissions import require_permission

router = APIRouter(prefix="/fed/vi0102", tags=["FED VI-01.02"])

def get_db():
    if engine is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible.")
    conn = engine.connect()
    try:
        yield conn
    finally:
        conn.close()

MES_ORDER = """
    CASE MES
        WHEN 'ENERO'      THEN 1  WHEN 'FEBRERO'    THEN 2
        WHEN 'MARZO'      THEN 3  WHEN 'ABRIL'      THEN 4
        WHEN 'MAYO'       THEN 5  WHEN 'JUNIO'      THEN 6
        WHEN 'JULIO'      THEN 7  WHEN 'AGOSTO'     THEN 8
        WHEN 'SEPTIEMBRE' THEN 9  WHEN 'OCTUBRE'    THEN 10
        WHEN 'NOVIEMBRE'  THEN 11 WHEN 'DICIEMBRE'  THEN 12
        ELSE 99
    END
"""

# ---------------------------------------------------------------------------
# GET /fed/vi0102/filtros
# ---------------------------------------------------------------------------
@router.get("/filtros", summary="Valores disponibles para filtros del reporte")
def get_filtros(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        # Años desde la tabla nominal
        anios = db.execute(text(
            "SELECT DISTINCT año FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 ORDER BY año"
        )).fetchall()

        # Meses desde la tabla nominal
        meses = db.execute(text(f"""
            SELECT DISTINCT MES, {MES_ORDER} AS orden
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 ORDER BY orden
        """)).fetchall()

        # Departamentos
        departamentos = db.execute(text(
            "SELECT DISTINCT DEPARTAMENTO FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 ORDER BY DEPARTAMENTO"
        )).fetchall()

        # Provincias (agrupadas por departamento)
        provincias = db.execute(text(
            "SELECT DISTINCT DEPARTAMENTO, PROVINCIA FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 ORDER BY DEPARTAMENTO, PROVINCIA"
        )).fetchall()

        # Unidades Ejecutoras
        unidades_ejecutoras = db.execute(text(
            "SELECT DISTINCT UNIDAD_EJECUTORA FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 WHERE UNIDAD_EJECUTORA IS NOT NULL ORDER BY UNIDAD_EJECUTORA"
        )).fetchall()

        # Redes
        redes = db.execute(text(
            "SELECT DISTINCT RED FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 WHERE RED IS NOT NULL ORDER BY RED"
        )).fetchall()

        # Microredes
        microredes = db.execute(text(
            "SELECT DISTINCT RED, MICRORED FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 WHERE MICRORED IS NOT NULL ORDER BY RED, MICRORED"
        )).fetchall()

        # Categorías de establecimiento
        categorias = db.execute(text(
            "SELECT DISTINCT CATEGORIA FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 WHERE CATEGORIA IS NOT NULL ORDER BY CATEGORIA"
        )).fetchall()

        return {
            "anios":              [r[0] for r in anios],
            "meses":              [r[0] for r in meses],
            "departamentos":      [r[0] for r in departamentos],
            "provincias":         [{"departamento": r[0], "provincia": r[1]} for r in provincias],
            "unidades_ejecutoras": [r[0] for r in unidades_ejecutoras],
            "redes":              [r[0] for r in redes],
            "microredes":         [{"red": r[0], "microred": r[1]} for r in microredes],
            "categorias":         [r[0] for r in categorias],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/vi0102/tabla-completa — DEPARTAMENTO → PROVINCIA → DISTRITO
# ---------------------------------------------------------------------------
@router.get("/tabla-completa", summary="Datos por Departamento/Provincia/Distrito")
def get_tabla_completa(
    anio: int = Query(...), mes: str = Query(...),
    departamento: Optional[str] = Query(None),
    provincia:    Optional[str] = Query(None),
    unidad_ejecutora: Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = ["año = :anio", "UPPER(MES) = UPPER(:mes)"]
    params: dict = {"anio": anio, "mes": mes}
    
    if departamento:
        filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)")
        params["departamento"] = departamento
    if provincia:
        filters.append("UPPER(PROVINCIA) = UPPER(:provincia)")
        params["provincia"] = provincia
    if unidad_ejecutora:
        filters.append("UPPER(UNIDAD_EJECUTORA) = UPPER(:unidad_ejecutora)")
        params["unidad_ejecutora"] = unidad_ejecutora
    
    w = "WHERE " + " AND ".join(filters)

    def agg(group_cols, order_cols=None):
        cols = order_cols or group_cols
        return text(f"""
            SELECT {group_cols},
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
            GROUP BY {group_cols} ORDER BY {cols}
        """)

    try:
        distritos  = db.execute(agg("DEPARTAMENTO, PROVINCIA, DISTRITO"), params).fetchall()
        provincias = db.execute(agg("DEPARTAMENTO, PROVINCIA"),           params).fetchall()
        total      = db.execute(text(f"""
            SELECT SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
        """), params).fetchone()
        
        return {
            "anio": anio, "mes": mes.upper(),
            "total":      dict(total._mapping) if total else {},
            "provincias": [dict(r._mapping) for r in provincias],
            "distritos":  [dict(r._mapping) for r in distritos],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/vi0102/tabla-redes — RED → MICRORED → ESTABLECIMIENTO
# ---------------------------------------------------------------------------
@router.get("/tabla-redes", summary="Datos por Red/Microred/Establecimiento")
def get_tabla_redes(
    anio: int = Query(...), mes: str = Query(...),
    red:          Optional[str] = Query(None),
    microred:     Optional[str] = Query(None),
    departamento: Optional[str] = Query(None),
    provincia:    Optional[str] = Query(None),
    unidad_ejecutora: Optional[str] = Query(None),
    categoria:    Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = ["año = :anio", "UPPER(MES) = UPPER(:mes)"]
    params: dict = {"anio": anio, "mes": mes}
    
    if red:
        filters.append("UPPER(RED) = UPPER(:red)")
        params["red"] = red
    if microred:
        filters.append("UPPER(MICRORED) = UPPER(:microred)")
        params["microred"] = microred
    if departamento:
        filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)")
        params["departamento"] = departamento
    if provincia:
        filters.append("UPPER(PROVINCIA) = UPPER(:provincia)")
        params["provincia"] = provincia
    if unidad_ejecutora:
        filters.append("UPPER(UNIDAD_EJECUTORA) = UPPER(:unidad_ejecutora)")
        params["unidad_ejecutora"] = unidad_ejecutora
    if categoria:
        filters.append("UPPER(CATEGORIA) = UPPER(:categoria)")
        params["categoria"] = categoria
    
    w = "WHERE " + " AND ".join(filters)

    try:
        establecimientos = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED, ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                ESTABLECIMIENTO,
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
            GROUP BY RED, MICRORED, ESTABLECIMIENTO ORDER BY RED, MICRORED, ESTABLECIMIENTO
        """), params).fetchall()

        microredes = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED, ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
            GROUP BY RED, MICRORED ORDER BY RED, MICRORED
        """), params).fetchall()

        redes_rows = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED,
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
            GROUP BY RED ORDER BY RED
        """), params).fetchall()

        # Unidades Ejecutoras
        unidades = db.execute(text(f"""
            SELECT UNIDAD_EJECUTORA,
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
            GROUP BY UNIDAD_EJECUTORA ORDER BY UNIDAD_EJECUTORA
        """), params).fetchall()

        total = db.execute(text(f"""
            SELECT SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
        """), params).fetchone()

        return {
            "anio": anio, "mes": mes.upper(),
            "total":            dict(total._mapping) if total else {},
            "unidades_ejecutoras": [dict(r._mapping) for r in unidades],
            "redes":            [dict(r._mapping) for r in redes_rows],
            "microredes":       [dict(r._mapping) for r in microredes],
            "establecimientos": [dict(r._mapping) for r in establecimientos],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/vi0102/resumen-unidades-ejecutoras
# ---------------------------------------------------------------------------
@router.get("/resumen-unidades-ejecutoras", summary="Resumen por Unidad Ejecutora")
def get_resumen_unidades(
    anio: int = Query(...),
    departamento: Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = ["año = :anio"]
    params: dict = {"anio": anio}
    
    if departamento:
        filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)")
        params["departamento"] = departamento
    
    w = "WHERE " + " AND ".join(filters)

    try:
        rows = db.execute(text(f"""
            SELECT UNIDAD_EJECUTORA,
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
            GROUP BY UNIDAD_EJECUTORA ORDER BY UNIDAD_EJECUTORA
        """), params).fetchall()
        
        return {"data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/vi0102/resumen
# ---------------------------------------------------------------------------
@router.get("/resumen", summary="Resumen de nominales por año y mes")
def get_resumen(
    anio:         Optional[int] = Query(None),
    departamento: Optional[str] = Query(None),
    red:          Optional[str] = Query(None),
    unidad_ejecutora: Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters, params = [], {}
    if anio:
        filters.append("año = :anio")
        params["anio"] = anio
    if departamento:
        filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)")
        params["departamento"] = departamento
    if red:
        filters.append("UPPER(RED) = UPPER(:red)")
        params["red"] = red
    if unidad_ejecutora:
        filters.append("UPPER(UNIDAD_EJECUTORA) = UPPER(:unidad_ejecutora)")
        params["unidad_ejecutora"] = unidad_ejecutora
    
    w = "WHERE " + " AND ".join(filters) if filters else ""

    try:
        rows = db.execute(text(f"""
            SELECT año, MES,
                SUM(denominador) AS total_denominador, SUM(numerador) AS total_numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_VI_01_02 {w}
            GROUP BY año, MES ORDER BY año, {MES_ORDER}
        """), params).fetchall()
        return {"data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))