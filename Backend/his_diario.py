# his_diario.py
# Router para el reporte de Variación Diaria de Atención vs Registro HIS
# Base de datos: DBFED2026 | Tabla: FED_FMODIFICADO_DIARIO
# Muestra por día del mes: total_atenciones vs registrados_mismo_dia

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.engine import Connection
from typing import Optional
from conexion import engine
from permissions import require_permission

router = APIRouter(prefix="/fed/his-diario", tags=["HIS Diario"])

TABLE = "DBFED2026.dbo.FED_FMODIFICADO_DIARIO"

METRICA_TOTAL = "01. TOTAL ATENCIONES"
METRICA_OPORTUNOS = "02. REGISTROS OPORTUNOS"

# La tabla almacena una fila por tipo de metrica; pivot con CANTIDAD
METRIC_AGG_SQL = f"""
    SUM(CASE WHEN UPPER(TIPO_METRICA) = UPPER('{METRICA_TOTAL}')
             THEN CANTIDAD ELSE 0 END) AS total_atenciones,
    SUM(CASE WHEN UPPER(TIPO_METRICA) = UPPER('{METRICA_OPORTUNOS}')
             THEN CANTIDAD ELSE 0 END) AS registrados_mismo_dia
"""

PCT_OPORTUNOS_SQL = """
    CASE WHEN SUM(CASE WHEN UPPER(TIPO_METRICA) = UPPER(:metrica_total)
                       THEN CANTIDAD ELSE 0 END) > 0
         THEN ROUND(
             CAST(SUM(CASE WHEN UPPER(TIPO_METRICA) = UPPER(:metrica_oportunos)
                           THEN CANTIDAD ELSE 0 END) AS FLOAT)
             / SUM(CASE WHEN UPPER(TIPO_METRICA) = UPPER(:metrica_total)
                        THEN CANTIDAD ELSE 0 END) * 100, 2)
         ELSE 0 END AS pct_oportunos
"""

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
# GET /fed/his-diario/filtros
# ---------------------------------------------------------------------------
@router.get("/filtros", summary="Valores disponibles para filtros del reporte HIS Diario")
def get_filtros(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        meses = db.execute(text(f"""
            SELECT DISTINCT MES, {MES_ORDER} AS orden
            FROM {TABLE} ORDER BY orden
        """)).fetchall()

        redes = db.execute(text(
            f"SELECT DISTINCT DESC_RED FROM {TABLE} WHERE DESC_RED IS NOT NULL ORDER BY DESC_RED"
        )).fetchall()

        microredes = db.execute(text(
            f"SELECT DISTINCT DESC_RED, DESC_MRED FROM {TABLE} WHERE DESC_MRED IS NOT NULL ORDER BY DESC_RED, DESC_MRED"
        )).fetchall()

        establecimientos = db.execute(text(
            f"SELECT DISTINCT DESC_RED, DESC_MRED, ESTABLECIMIENTO FROM {TABLE} WHERE ESTABLECIMIENTO IS NOT NULL ORDER BY DESC_RED, DESC_MRED, ESTABLECIMIENTO"
        )).fetchall()

        sistemas = db.execute(text(
            f"SELECT DISTINCT SISTEMA FROM {TABLE} WHERE SISTEMA IS NOT NULL ORDER BY SISTEMA"
        )).fetchall()

        unidades = db.execute(text(
            f"SELECT DISTINCT UNID_EJEC FROM {TABLE} WHERE UNID_EJEC IS NOT NULL ORDER BY UNID_EJEC"
        )).fetchall()

        return {
            "meses":          [r[0] for r in meses],
            "redes":          [r[0] for r in redes],
            "microredes":     [{"red": r[0], "microred": r[1]} for r in microredes],
            "establecimientos": [{"red": r[0], "microred": r[1], "establecimiento": r[2]} for r in establecimientos],
            "sistemas":       [r[0] for r in sistemas],
            "unidades":       [r[0] for r in unidades],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/his-diario/grafico  — datos por día para el gráfico principal
# ---------------------------------------------------------------------------
@router.get("/grafico", summary="Datos diarios: total atenciones vs registros oportunos")
def get_grafico(
    mes:              str            = Query(...),
    red:              Optional[str]  = Query(None),
    microred:         Optional[str]  = Query(None),
    establecimiento:  Optional[str]  = Query(None),
    sistema:          Optional[str]  = Query(None),
    unidad:           Optional[str]  = Query(None),
    tipo_metrica:     str            = Query("01. TOTAL ATENCIONES"),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = ["UPPER(MES) = UPPER(:mes)"]
    params: dict = {
        "mes": mes,
        "metrica_total": METRICA_TOTAL,
        "metrica_oportunos": METRICA_OPORTUNOS,
    }
    if red:             filters.append("UPPER(DESC_RED) = UPPER(:red)");                        params["red"] = red
    if microred:        filters.append("UPPER(DESC_MRED) = UPPER(:microred)");                  params["microred"] = microred
    if establecimiento: filters.append("UPPER(ESTABLECIMIENTO) = UPPER(:establecimiento)");      params["establecimiento"] = establecimiento
    if sistema:         filters.append("UPPER(SISTEMA) = UPPER(:sistema)");                     params["sistema"] = sistema
    if unidad:          filters.append("UPPER(UNID_EJEC) = UPPER(:unidad)");                    params["unidad"] = unidad
    w = "WHERE " + " AND ".join(filters)

    try:
        rows = db.execute(text(f"""
            SELECT
                DIA,
                {METRIC_AGG_SQL}
            FROM {TABLE} {w}
            GROUP BY DIA
            ORDER BY DIA
        """), params).fetchall()

        return {
            "mes": mes.upper(),
            "tipo_metrica": tipo_metrica,
            "data": [dict(r._mapping) for r in rows],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/his-diario/resumen-mes  — totales por mes (para comparativa)
# ---------------------------------------------------------------------------
@router.get("/resumen-mes", summary="Totales acumulados por mes")
def get_resumen_mes(
    red:             Optional[str] = Query(None),
    microred:        Optional[str] = Query(None),
    establecimiento: Optional[str] = Query(None),
    sistema:         Optional[str] = Query(None),
    tipo_metrica:    str           = Query("01. TOTAL ATENCIONES"),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = []
    params: dict = {
        "metrica_total": METRICA_TOTAL,
        "metrica_oportunos": METRICA_OPORTUNOS,
    }
    if red:             filters.append("UPPER(DESC_RED) = UPPER(:red)");                        params["red"] = red
    if microred:        filters.append("UPPER(DESC_MRED) = UPPER(:microred)");                  params["microred"] = microred
    if establecimiento: filters.append("UPPER(ESTABLECIMIENTO) = UPPER(:establecimiento)");      params["establecimiento"] = establecimiento
    if sistema:         filters.append("UPPER(SISTEMA) = UPPER(:sistema)");                     params["sistema"] = sistema
    w = ("WHERE " + " AND ".join(filters)) if filters else ""

    try:
        rows = db.execute(text(f"""
            SELECT
                MES, NRO_MES,
                {METRIC_AGG_SQL},
                {PCT_OPORTUNOS_SQL}
            FROM {TABLE} {w}
            GROUP BY MES, NRO_MES
            ORDER BY NRO_MES
        """), params).fetchall()

        return {"data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/his-diario/por-sistema  — comparativa por sistema para un mes
# ---------------------------------------------------------------------------
@router.get("/por-sistema", summary="Totales por sistema para un mes dado")
def get_por_sistema(
    mes:             str           = Query(...),
    red:             Optional[str] = Query(None),
    microred:        Optional[str] = Query(None),
    establecimiento: Optional[str] = Query(None),
    tipo_metrica:    str           = Query("01. TOTAL ATENCIONES"),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = ["UPPER(MES) = UPPER(:mes)"]
    params: dict = {
        "mes": mes,
        "metrica_total": METRICA_TOTAL,
        "metrica_oportunos": METRICA_OPORTUNOS,
    }
    if red:             filters.append("UPPER(DESC_RED) = UPPER(:red)");                       params["red"] = red
    if microred:        filters.append("UPPER(DESC_MRED) = UPPER(:microred)");                 params["microred"] = microred
    if establecimiento: filters.append("UPPER(ESTABLECIMIENTO) = UPPER(:establecimiento)");     params["establecimiento"] = establecimiento
    w = "WHERE " + " AND ".join(filters)

    try:
        rows = db.execute(text(f"""
            SELECT
                SISTEMA,
                {METRIC_AGG_SQL},
                {PCT_OPORTUNOS_SQL}
            FROM {TABLE} {w}
            GROUP BY SISTEMA
            ORDER BY total_atenciones DESC
        """), params).fetchall()

        return {"mes": mes.upper(), "data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /fed/his-diario/por-red  — comparativa por red para un mes
# ---------------------------------------------------------------------------
@router.get("/por-red", summary="Totales por red para un mes dado")
def get_por_red(
    mes:          str           = Query(...),
    sistema:      Optional[str] = Query(None),
    tipo_metrica: str           = Query("01. TOTAL ATENCIONES"),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    filters = ["UPPER(MES) = UPPER(:mes)"]
    params: dict = {
        "mes": mes,
        "metrica_total": METRICA_TOTAL,
        "metrica_oportunos": METRICA_OPORTUNOS,
    }
    if sistema: filters.append("UPPER(SISTEMA) = UPPER(:sistema)"); params["sistema"] = sistema
    w = "WHERE " + " AND ".join(filters)

    try:
        rows = db.execute(text(f"""
            SELECT
                DESC_RED,
                {METRIC_AGG_SQL},
                {PCT_OPORTUNOS_SQL}
            FROM {TABLE} {w}
            GROUP BY DESC_RED
            ORDER BY total_atenciones DESC
        """), params).fetchall()

        return {"mes": mes.upper(), "data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))