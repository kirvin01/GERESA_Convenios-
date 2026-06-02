# fed_si_0202.py
# Router para el reporte FED SI-02.02 — [Descripción del reporte]
# Base de datos: DBFED2026 | Tabla: IRVIN_FED_SI_02_02

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.engine import Connection
from typing import Optional
from conexion import engine
from permissions import require_permission

router = APIRouter(prefix="/fed/si0202", tags=["FED SI-02.02"])

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
# GET /fed/si0202/filtros
# ---------------------------------------------------------------------------
@router.get("/filtros", summary="Valores disponibles para filtros del reporte")
def get_filtros(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        anios = db.execute(text(
            "SELECT DISTINCT año FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 ORDER BY año"
        )).fetchall()

        meses = db.execute(text(f"""
            SELECT DISTINCT MES, {MES_ORDER} AS orden
            FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 ORDER BY orden
        """)).fetchall()

        departamentos = db.execute(text(
            "SELECT DISTINCT DEPARTAMENTO FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 ORDER BY DEPARTAMENTO"
        )).fetchall()

        provincias = db.execute(text(
            "SELECT DISTINCT DEPARTAMENTO, PROVINCIA FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 ORDER BY DEPARTAMENTO, PROVINCIA"
        )).fetchall()

        redes = db.execute(text(
            "SELECT DISTINCT RED FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 WHERE RED IS NOT NULL ORDER BY RED"
        )).fetchall()

        microredes = db.execute(text(
            "SELECT DISTINCT RED, MICRORED FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 WHERE MICRORED IS NOT NULL ORDER BY RED, MICRORED"
        )).fetchall()

        categorias = db.execute(text(
            "SELECT DISTINCT CATEGORIA FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 WHERE CATEGORIA IS NOT NULL ORDER BY CATEGORIA"
        )).fetchall()

        return {
            "anios":         [r[0] for r in anios],
            "meses":         [r[0] for r in meses],
            "departamentos": [r[0] for r in departamentos],
            "provincias":    [{"departamento": r[0], "provincia": r[1]} for r in provincias],
            "redes":         [r[0] for r in redes],
            "microredes":    [{"red": r[0], "microred": r[1]} for r in microredes],
            "categorias":    [r[0] for r in categorias],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/si0202/tabla-completa — DEPARTAMENTO → PROVINCIA → DISTRITO
# ---------------------------------------------------------------------------
@router.get("/tabla-completa", summary="Datos por Departamento/Provincia/Distrito")
def get_tabla_completa(
    anio: int = Query(...), mes: str = Query(...),
    departamento: Optional[str] = Query(None),
    provincia:    Optional[str] = Query(None),
    red:          Optional[str] = Query(None),
    microred:     Optional[str] = Query(None),
    categoria:    Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = ["año = :anio", "UPPER(MES) = UPPER(:mes)"]
    params: dict = {"anio": anio, "mes": mes}
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)"); params["departamento"] = departamento
    if provincia:    filters.append("UPPER(PROVINCIA) = UPPER(:provincia)");       params["provincia"] = provincia
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                   params["red"] = red
    if microred:     filters.append("UPPER(MICRORED) = UPPER(:microred)");         params["microred"] = microred
    if categoria:    filters.append("UPPER(CATEGORIA) = UPPER(:categoria)");       params["categoria"] = categoria
    w = "WHERE " + " AND ".join(filters)

    def agg(group_cols, order_cols=None):
        cols = order_cols or group_cols
        return text(f"""
            SELECT {group_cols},
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 {w}
            GROUP BY {group_cols} ORDER BY {cols}
        """)

    try:
        distritos  = db.execute(agg("DEPARTAMENTO, PROVINCIA, DISTRITO"), params).fetchall()
        provincias = db.execute(agg("DEPARTAMENTO, PROVINCIA"),           params).fetchall()
        total      = db.execute(text(f"""
            SELECT SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 {w}
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
# GET /fed/si0202/tabla-redes — RED → MICRORED → ESTABLECIMIENTO
# ---------------------------------------------------------------------------
@router.get("/tabla-redes", summary="Datos por Red/Microred/Establecimiento")
def get_tabla_redes(
    anio: int = Query(...), mes: str = Query(...),
    red:          Optional[str] = Query(None),
    microred:     Optional[str] = Query(None),
    departamento: Optional[str] = Query(None),
    provincia:    Optional[str] = Query(None),
    categoria:    Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = ["año = :anio", "UPPER(MES) = UPPER(:mes)"]
    params: dict = {"anio": anio, "mes": mes}
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                   params["red"] = red
    if microred:     filters.append("UPPER(MICRORED) = UPPER(:microred)");         params["microred"] = microred
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)"); params["departamento"] = departamento
    if provincia:    filters.append("UPPER(PROVINCIA) = UPPER(:provincia)");       params["provincia"] = provincia
    if categoria:    filters.append("UPPER(CATEGORIA) = UPPER(:categoria)");       params["categoria"] = categoria
    w = "WHERE " + " AND ".join(filters)

    try:
        establecimientos = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED, ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                ESTABLECIMIENTO,
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 {w}
            GROUP BY RED, MICRORED, ESTABLECIMIENTO ORDER BY RED, MICRORED, ESTABLECIMIENTO
        """), params).fetchall()

        microredes = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED, ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 {w}
            GROUP BY RED, MICRORED ORDER BY RED, MICRORED
        """), params).fetchall()

        redes_rows = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED,
                SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 {w}
            GROUP BY RED ORDER BY RED
        """), params).fetchall()

        total = db.execute(text(f"""
            SELECT SUM(denominador) AS denominador, SUM(numerador) AS numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 {w}
        """), params).fetchone()

        return {
            "anio": anio, "mes": mes.upper(),
            "total":            dict(total._mapping) if total else {},
            "redes":            [dict(r._mapping) for r in redes_rows],
            "microredes":       [dict(r._mapping) for r in microredes],
            "establecimientos": [dict(r._mapping) for r in establecimientos],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/si0202/resumen
# ---------------------------------------------------------------------------
@router.get("/resumen", summary="Resumen de nominales por año y mes")
def get_resumen(
    anio:         Optional[int] = Query(None),
    departamento: Optional[str] = Query(None),
    red:          Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters, params = [], {}
    if anio:         filters.append("año = :anio");                              params["anio"] = anio
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)"); params["departamento"] = departamento
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                 params["red"] = red
    w = "WHERE " + " AND ".join(filters) if filters else ""

    try:
        rows = db.execute(text(f"""
            SELECT año, MES,
                SUM(denominador) AS total_denominador, SUM(numerador) AS total_numerador,
                CASE WHEN SUM(denominador)>0 THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2) ELSE 0 END AS avance_pct
            FROM DBFED2026.dbo.IRVIN_FED_SI_02_02 {w}
            GROUP BY año, MES ORDER BY año, {MES_ORDER}
        """), params).fetchall()
        return {"data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))