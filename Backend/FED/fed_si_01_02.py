# fed_si_01_02.py
# Router para el reporte FED SI-01_02 — Anemia en gestantes (seguimiento Hb + tratamiento)
# Base de datos: DBFED2026 | Tabla: IRVIN_FED_SI_01_02

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.engine import Connection
from typing import Optional
from conexion import engine
from permissions import require_permission

router = APIRouter(prefix="/fed/si0102", tags=["FED SI-01_02"])

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

# Bloque de columnas agregadas de seguimiento de anemia
ANEMIA_COLS = """
    SUM(denominador)                  AS denominador,
    SUM(numerador)                    AS numerador,
    CASE WHEN SUM(denominador)>0
         THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2)
         ELSE 0
    END                               AS avance_pct,
    SUM(denominador_apn)              AS denominador_apn,
    SUM(denominador_apn_hb1)          AS denominador_apn_hb1,
    SUM(denominador_apn_hb1_Dx)       AS denominador_apn_hb1_Dx,
    SUM(denominador_apn_Hb1_Dx_trat1) AS denominador_apn_Hb1_Dx_trat1,
    SUM(numerador_Hb2)                AS numerador_Hb2,
    SUM(numerador_trat2)              AS numerador_trat2,
    SUM(numerador_Hb2_Trat2)          AS numerador_Hb2_Trat2,
    SUM(numerador_Hb3)                AS numerador_Hb3,
    SUM(numerador_trat3)              AS numerador_trat3,
    SUM(numerador_Hb3_Trat3)          AS numerador_Hb3_Trat3,
    SUM(numerador_trat4)              AS numerador_trat4,
    SUM(numerador_Hb3_Trat4)          AS numerador_Hb3_Trat4
"""


# ---------------------------------------------------------------------------
# GET /fed/si0102/filtros
# ---------------------------------------------------------------------------
@router.get("/filtros", summary="Valores disponibles para filtros del reporte FED SI-01_02")
def get_filtros(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        anios = db.execute(text(
            "SELECT DISTINCT año FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 ORDER BY año"
        )).fetchall()

        meses = db.execute(text(f"""
            SELECT DISTINCT MES, {MES_ORDER} AS orden
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 ORDER BY orden
        """)).fetchall()

        departamentos = db.execute(text(
            "SELECT DISTINCT DEPARTAMENTO FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 ORDER BY DEPARTAMENTO"
        )).fetchall()

        provincias = db.execute(text(
            "SELECT DISTINCT DEPARTAMENTO, PROVINCIA FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 ORDER BY DEPARTAMENTO, PROVINCIA"
        )).fetchall()

        redes = db.execute(text(
            "SELECT DISTINCT RED FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 WHERE RED IS NOT NULL ORDER BY RED"
        )).fetchall()

        microredes = db.execute(text(
            "SELECT DISTINCT RED, MICRORED FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 WHERE MICRORED IS NOT NULL ORDER BY RED, MICRORED"
        )).fetchall()

        categorias = db.execute(text(
            "SELECT DISTINCT CATEGORIA FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 WHERE CATEGORIA IS NOT NULL ORDER BY CATEGORIA"
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
# GET /fed/si0102/tabla-completa  — DEPARTAMENTO → PROVINCIA → DISTRITO
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

    try:
        distritos = db.execute(text(f"""
            SELECT DEPARTAMENTO, PROVINCIA, DISTRITO, {ANEMIA_COLS}
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 {w}
            GROUP BY DEPARTAMENTO, PROVINCIA, DISTRITO
            ORDER BY DEPARTAMENTO, PROVINCIA, DISTRITO
        """), params).fetchall()

        provincias_rows = db.execute(text(f"""
            SELECT DEPARTAMENTO, PROVINCIA, {ANEMIA_COLS}
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 {w}
            GROUP BY DEPARTAMENTO, PROVINCIA
            ORDER BY DEPARTAMENTO, PROVINCIA
        """), params).fetchall()

        total = db.execute(text(f"""
            SELECT {ANEMIA_COLS}
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 {w}
        """), params).fetchone()

        return {
            "anio": anio, "mes": mes.upper(),
            "total":      dict(total._mapping) if total else {},
            "provincias": [dict(r._mapping) for r in provincias_rows],
            "distritos":  [dict(r._mapping) for r in distritos],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/si0102/tabla-redes  — RED → MICRORED → ESTABLECIMIENTO
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
            SELECT ISNULL(RED,'SIN RED') AS RED,
                   ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                   ESTABLECIMIENTO, {ANEMIA_COLS}
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 {w}
            GROUP BY RED, MICRORED, ESTABLECIMIENTO
            ORDER BY RED, MICRORED, ESTABLECIMIENTO
        """), params).fetchall()

        microredes_rows = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED,
                   ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                   {ANEMIA_COLS}
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 {w}
            GROUP BY RED, MICRORED
            ORDER BY RED, MICRORED
        """), params).fetchall()

        redes_rows = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED, {ANEMIA_COLS}
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 {w}
            GROUP BY RED
            ORDER BY RED
        """), params).fetchall()

        total = db.execute(text(f"""
            SELECT {ANEMIA_COLS}
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 {w}
        """), params).fetchone()

        return {
            "anio": anio, "mes": mes.upper(),
            "total":            dict(total._mapping) if total else {},
            "redes":            [dict(r._mapping) for r in redes_rows],
            "microredes":       [dict(r._mapping) for r in microredes_rows],
            "establecimientos": [dict(r._mapping) for r in establecimientos],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/si0102/resumen
# ---------------------------------------------------------------------------
@router.get("/resumen", summary="Resumen de anemia en gestantes por año y mes")
def get_resumen(
    anio:         Optional[int] = Query(None),
    departamento: Optional[str] = Query(None),
    red:          Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters, params = [], {}
    if anio:         filters.append("año = :anio");                                params["anio"] = anio
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)"); params["departamento"] = departamento
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                   params["red"] = red
    w = "WHERE " + " AND ".join(filters) if filters else ""

    try:
        rows = db.execute(text(f"""
            SELECT año, MES,
                SUM(denominador)                  AS total_denominador,
                SUM(numerador)                    AS total_numerador,
                CASE WHEN SUM(denominador)>0
                     THEN ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100,2)
                     ELSE 0
                END                               AS avance_pct,
                SUM(denominador_apn)              AS total_apn,
                SUM(denominador_apn_hb1)          AS total_apn_hb1,
                SUM(denominador_apn_hb1_Dx)       AS total_apn_hb1_Dx,
                SUM(denominador_apn_Hb1_Dx_trat1) AS total_apn_Hb1_Dx_trat1,
                SUM(numerador_Hb2)                AS total_Hb2,
                SUM(numerador_Hb2_Trat2)          AS total_Hb2_Trat2,
                SUM(numerador_Hb3)                AS total_Hb3,
                SUM(numerador_Hb3_Trat3)          AS total_Hb3_Trat3,
                SUM(numerador_Hb3_Trat4)          AS total_Hb3_Trat4
            FROM DBFED2026.dbo.IRVIN_FED_SI_01_02 {w}
            GROUP BY año, MES
            ORDER BY año, {MES_ORDER}
        """), params).fetchall()
        return {"data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))