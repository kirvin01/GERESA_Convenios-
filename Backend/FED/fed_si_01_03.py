# fed_si_01_03.py
# Router para el reporte FED SI-01_03 — Gestantes: Hb1 + suplementación hierro + controles Hb2/Hb3
# Base de datos: DBFED2026 | Tabla: IRVIN_FED_SI_01_03

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.engine import Connection
from typing import Optional
from conexion import engine
from permissions import require_permission

router = APIRouter(prefix="/fed/si0103", tags=["FED SI-01_03"])


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

TABLE = "DBFED2026.dbo.IRVIN_FED_SI_01_03"


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _build_where(
    anio: int, mes: str,
    departamento: Optional[str], provincia: Optional[str],
    red: Optional[str], microred: Optional[str], categoria: Optional[str],
):
    filters = ["año = :anio", "UPPER(MES) = UPPER(:mes)"]
    params: dict = {"anio": anio, "mes": mes}
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)"); params["departamento"] = departamento
    if provincia:    filters.append("UPPER(PROVINCIA) = UPPER(:provincia)");       params["provincia"] = provincia
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                   params["red"] = red
    if microred:     filters.append("UPPER(MICRORED) = UPPER(:microred)");         params["microred"] = microred
    if categoria:    filters.append("UPPER(CATEGORIA) = UPPER(:categoria)");       params["categoria"] = categoria
    return "WHERE " + " AND ".join(filters), params


def _avance_expr(denom="SUM(denominador)", numer="SUM(numerador)"):
    return f"CASE WHEN {denom}>0 THEN ROUND(CAST({numer} AS FLOAT)/{denom}*100,2) ELSE 0 END AS avance_pct"


def _metricas_extra() -> str:
    """
    Columnas de seguimiento clínico específicas de SI-01_03 (gestantes):
    - Diagnóstico Hb1 (semana 14)
    - Suplementación hierro (5 dosis)
    - Controles Hb2 y Hb3
    """
    return """
        SUM(denominador_Hb1)           AS total_denom_Hb1,
        SUM(denominador_hb1_Dx)        AS total_denom_Hb1_Dx,
        SUM(numerador_suplementacion1) AS total_num_supl1,
        SUM(numerador_suplementacion2) AS total_num_supl2,
        SUM(numerador_suplementacion3) AS total_num_supl3,
        SUM(numerador_suplementacion4) AS total_num_supl4,
        SUM(numerador_suplementacion5) AS total_num_supl5,
        SUM(numerador_Hb2)             AS total_num_Hb2,
        SUM(numerador_Hb3)             AS total_num_Hb3
    """


# ---------------------------------------------------------------------------
# GET /fed/si0103/filtros
# ---------------------------------------------------------------------------
@router.get("/filtros", summary="Valores disponibles para filtros del reporte SI-01_03")
def get_filtros(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        anios = db.execute(text(
            f"SELECT DISTINCT año FROM {TABLE} ORDER BY año"
        )).fetchall()

        meses = db.execute(text(f"""
            SELECT DISTINCT MES, {MES_ORDER} AS orden
            FROM {TABLE} ORDER BY orden
        """)).fetchall()

        departamentos = db.execute(text(
            f"SELECT DISTINCT DEPARTAMENTO FROM {TABLE} ORDER BY DEPARTAMENTO"
        )).fetchall()

        provincias = db.execute(text(
            f"SELECT DISTINCT DEPARTAMENTO, PROVINCIA FROM {TABLE} ORDER BY DEPARTAMENTO, PROVINCIA"
        )).fetchall()

        redes = db.execute(text(
            f"SELECT DISTINCT RED FROM {TABLE} WHERE RED IS NOT NULL ORDER BY RED"
        )).fetchall()

        microredes = db.execute(text(
            f"SELECT DISTINCT RED, MICRORED FROM {TABLE} WHERE MICRORED IS NOT NULL ORDER BY RED, MICRORED"
        )).fetchall()

        categorias = db.execute(text(
            f"SELECT DISTINCT CATEGORIA FROM {TABLE} WHERE CATEGORIA IS NOT NULL ORDER BY CATEGORIA"
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
# GET /fed/si0103/tabla-completa  — DEPARTAMENTO → PROVINCIA → DISTRITO
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
    w, params = _build_where(anio, mes, departamento, provincia, red, microred, categoria)

    def agg_query(group_cols: str) -> text:
        return text(f"""
            SELECT {group_cols},
                SUM(denominador) AS denominador,
                SUM(numerador)   AS numerador,
                {_avance_expr()},
                {_metricas_extra()}
            FROM {TABLE} {w}
            GROUP BY {group_cols}
            ORDER BY {group_cols}
        """)

    try:
        distritos  = db.execute(agg_query("DEPARTAMENTO, PROVINCIA, DISTRITO"), params).fetchall()
        provincias = db.execute(agg_query("DEPARTAMENTO, PROVINCIA"), params).fetchall()
        total_row  = db.execute(text(f"""
            SELECT
                SUM(denominador) AS denominador,
                SUM(numerador)   AS numerador,
                {_avance_expr()},
                {_metricas_extra()}
            FROM {TABLE} {w}
        """), params).fetchone()

        return {
            "anio": anio,
            "mes":  mes.upper(),
            "total":      dict(total_row._mapping) if total_row else {},
            "provincias": [dict(r._mapping) for r in provincias],
            "distritos":  [dict(r._mapping) for r in distritos],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/si0103/tabla-redes  — RED → MICRORED → ESTABLECIMIENTO
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
    w, params = _build_where(anio, mes, departamento, provincia, red, microred, categoria)

    try:
        establecimientos = db.execute(text(f"""
            SELECT
                ISNULL(RED,'SIN RED')           AS RED,
                ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                ESTABLECIMIENTO,
                SUM(denominador) AS denominador,
                SUM(numerador)   AS numerador,
                {_avance_expr()},
                {_metricas_extra()}
            FROM {TABLE} {w}
            GROUP BY RED, MICRORED, ESTABLECIMIENTO
            ORDER BY RED, MICRORED, ESTABLECIMIENTO
        """), params).fetchall()

        microredes = db.execute(text(f"""
            SELECT
                ISNULL(RED,'SIN RED')           AS RED,
                ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                SUM(denominador) AS denominador,
                SUM(numerador)   AS numerador,
                {_avance_expr()},
                {_metricas_extra()}
            FROM {TABLE} {w}
            GROUP BY RED, MICRORED
            ORDER BY RED, MICRORED
        """), params).fetchall()

        redes_rows = db.execute(text(f"""
            SELECT
                ISNULL(RED,'SIN RED') AS RED,
                SUM(denominador) AS denominador,
                SUM(numerador)   AS numerador,
                {_avance_expr()},
                {_metricas_extra()}
            FROM {TABLE} {w}
            GROUP BY RED
            ORDER BY RED
        """), params).fetchall()

        total_row = db.execute(text(f"""
            SELECT
                SUM(denominador) AS denominador,
                SUM(numerador)   AS numerador,
                {_avance_expr()},
                {_metricas_extra()}
            FROM {TABLE} {w}
        """), params).fetchone()

        return {
            "anio": anio,
            "mes":  mes.upper(),
            "total":            dict(total_row._mapping) if total_row else {},
            "redes":            [dict(r._mapping) for r in redes_rows],
            "microredes":       [dict(r._mapping) for r in microredes],
            "establecimientos": [dict(r._mapping) for r in establecimientos],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/si0103/resumen  — Resumen mensual por año
# ---------------------------------------------------------------------------
@router.get("/resumen", summary="Resumen de gestantes por año y mes")
def get_resumen(
    anio:         Optional[int] = Query(None),
    departamento: Optional[str] = Query(None),
    red:          Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters, params = [], {}
    if anio:         filters.append("año = :anio");                                 params["anio"] = anio
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)");  params["departamento"] = departamento
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                    params["red"] = red
    w = "WHERE " + " AND ".join(filters) if filters else ""

    try:
        rows = db.execute(text(f"""
            SELECT
                año, MES,
                SUM(denominador)              AS total_denominador,
                SUM(numerador)                AS total_numerador,
                {_avance_expr("SUM(denominador)", "SUM(numerador)")},
                SUM(denominador_Hb1)           AS total_denom_Hb1,
                SUM(denominador_hb1_Dx)        AS total_denom_Hb1_Dx,
                SUM(numerador_suplementacion1) AS total_num_supl1,
                SUM(numerador_suplementacion2) AS total_num_supl2,
                SUM(numerador_suplementacion3) AS total_num_supl3,
                SUM(numerador_suplementacion4) AS total_num_supl4,
                SUM(numerador_suplementacion5) AS total_num_supl5,
                SUM(numerador_Hb2)             AS total_num_Hb2,
                SUM(numerador_Hb3)             AS total_num_Hb3
            FROM {TABLE} {w}
            GROUP BY año, MES
            ORDER BY año, {MES_ORDER}
        """), params).fetchall()
        return {"data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/si0103/nominal  — Listado nominal paginado
# ---------------------------------------------------------------------------
@router.get("/nominal", summary="Listado nominal de gestantes con seguimiento")
def get_nominal(
    anio: int = Query(...), mes: str = Query(...),
    departamento:    Optional[str] = Query(None),
    provincia:       Optional[str] = Query(None),
    red:             Optional[str] = Query(None),
    microred:        Optional[str] = Query(None),
    categoria:       Optional[str] = Query(None),
    establecimiento: Optional[str] = Query(None),
    page:      int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    w, params = _build_where(anio, mes, departamento, provincia, red, microred, categoria)
    if establecimiento:
        w += " AND UPPER(ESTABLECIMIENTO) = UPPER(:establecimiento)"
        params["establecimiento"] = establecimiento

    offset = (page - 1) * page_size
    params["page_size"] = page_size
    params["offset"]    = offset

    try:
        total_count = db.execute(text(
            f"SELECT COUNT(*) FROM {TABLE} {w}"
        ), params).scalar()

        rows = db.execute(text(f"""
            SELECT
                DEPARTAMENTO, PROVINCIA, DISTRITO,
                RED, MICRORED, ESTABLECIMIENTO, CATEGORIA,
                año, MES, renaes, ubigeo_reniec, num_doc,
                semanas_gest,
                fecha_inicio_gestacion, fecha_inicio_semana14, fecha_parto,
                -- Hb1
                fecha_Hb1, valor_Hb1, denominador_Hb1,
                fecha_Hb1_Dx, denominador_hb1_Dx,
                -- Avance principal
                denominador, numerador,
                -- Suplementación hierro (5 dosis)
                fecha_suplementacion1, numerador_suplementacion1,
                fecha_suplementacion2, numerador_suplementacion2,
                fecha_suplementacion3, numerador_suplementacion3,
                fecha_suplementacion4, numerador_suplementacion4,
                fecha_suplementacion5, numerador_suplementacion5,
                -- Controles Hb
                fecha_Hb2, valor_Hb2, numerador_Hb2,
                fecha_Hb3, valor_Hb3, numerador_Hb3
            FROM {TABLE} {w}
            ORDER BY DEPARTAMENTO, PROVINCIA, DISTRITO, ESTABLECIMIENTO
            OFFSET :offset ROWS FETCH NEXT :page_size ROWS ONLY
        """), params).fetchall()

        return {
            "total":     total_count,
            "page":      page,
            "page_size": page_size,
            "pages":     -(-total_count // page_size),
            "data":      [dict(r._mapping) for r in rows],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))