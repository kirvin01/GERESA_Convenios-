# cg_10.py
# Router para el reporte Convenio de Gestión CG-10
# Niños 6m–6a11m29d con paquete integrado de atención
# Base de datos: DBCG2026 | Tabla: IRVIN_CG_10
# Subindicadores: HO=Historia clínica, AN=Antropometría, FB=FBNC, PD=Plan desarrollo, AS=Atención salud

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.engine import Connection
from typing import Optional
from conexion import engine
from permissions import require_permission

router = APIRouter(prefix="/cg/cg10", tags=["CG-10"])

def get_db():
    if engine is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible.")
    conn = engine.connect()
    try:
        yield conn
    finally:
        conn.close()

MES_ORDER = """
    CASE Desc_Mes
        WHEN 'ENERO'      THEN 1  WHEN 'FEBRERO'    THEN 2
        WHEN 'MARZO'      THEN 3  WHEN 'ABRIL'      THEN 4
        WHEN 'MAYO'       THEN 5  WHEN 'JUNIO'      THEN 6
        WHEN 'JULIO'      THEN 7  WHEN 'AGOSTO'     THEN 8
        WHEN 'SEPTIEMBRE' THEN 9  WHEN 'OCTUBRE'    THEN 10
        WHEN 'NOVIEMBRE'  THEN 11 WHEN 'DICIEMBRE'  THEN 12
        ELSE 99
    END
"""

TABLE = "DBCGESTION_26.dbo.ID_10_Salud_Bucal"

# ---------------------------------------------------------------------------
# GET /cg/cg10/filtros
# ---------------------------------------------------------------------------
@router.get("/filtros", summary="Valores disponibles para filtros del reporte CG-10")
def get_filtros(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("cg:read")),
):
    try:
        anios = db.execute(text(
            f"SELECT DISTINCT [Año] FROM {TABLE} ORDER BY [Año]"
        )).fetchall()

        meses = db.execute(text(f"""
            SELECT DISTINCT Desc_Mes, {MES_ORDER} AS orden
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

        grupos = db.execute(text(
            f"SELECT DISTINCT Grupo FROM {TABLE} WHERE Grupo IS NOT NULL ORDER BY Grupo"
        )).fetchall()

        return {
            "anios":         [r[0] for r in anios],
            "meses":         [r[0] for r in meses],
            "departamentos": [r[0] for r in departamentos],
            "provincias":    [{"departamento": r[0], "provincia": r[1]} for r in provincias],
            "redes":         [r[0] for r in redes],
            "microredes":    [{"red": r[0], "microred": r[1]} for r in microredes],
            "categorias":    [r[0] for r in categorias],
            "grupos":        [r[0] for r in grupos],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Helpers de columnas de subindicadores
# ---------------------------------------------------------------------------
SUBIND_AGGS = """
    SUM(DENOMINADOR) AS denominador,
    SUM(NUMERADOR)   AS numerador,
    CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(NUMERADOR) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS avance_pct,
    SUM(HO_CUMPLE) AS ho_cumple,
    CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(HO_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS ho_pct,
    SUM(AN_CUMPLE) AS an_cumple,
    CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(AN_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS an_pct,
    SUM(FB_CUMPLE) AS fb_cumple,
    CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(FB_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS fb_pct,
    SUM(PD_CUMPLE) AS pd_cumple,
    CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(PD_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS pd_pct,
    SUM(AS_CUMPLE) AS as_cumple,
    CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(AS_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS as_pct
"""


# ---------------------------------------------------------------------------
# GET /cg/cg10/tabla-completa  — DEPARTAMENTO → PROVINCIA → DISTRITO
# ---------------------------------------------------------------------------
@router.get("/tabla-completa", summary="Datos por Departamento/Provincia/Distrito")
def get_tabla_completa(
    anio: int = Query(...), mes: str = Query(...),
    departamento: Optional[str] = Query(None),
    provincia:    Optional[str] = Query(None),
    red:          Optional[str] = Query(None),
    microred:     Optional[str] = Query(None),
    categoria:    Optional[str] = Query(None),
    grupo:        Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("cg:read")),
):
    filters = ["[Año] = :anio", "UPPER(Desc_Mes) = UPPER(:mes)"]
    params: dict = {"anio": anio, "mes": mes}
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)"); params["departamento"] = departamento
    if provincia:    filters.append("UPPER(PROVINCIA) = UPPER(:provincia)");       params["provincia"] = provincia
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                   params["red"] = red
    if microred:     filters.append("UPPER(MICRORED) = UPPER(:microred)");         params["microred"] = microred
    if categoria:    filters.append("UPPER(CATEGORIA) = UPPER(:categoria)");       params["categoria"] = categoria
    if grupo:        filters.append("UPPER(Grupo) = UPPER(:grupo)");               params["grupo"] = grupo
    w = "WHERE " + " AND ".join(filters)

    try:
        distritos = db.execute(text(f"""
            SELECT DEPARTAMENTO, PROVINCIA, DISTRITO, {SUBIND_AGGS}
            FROM {TABLE} {w}
            GROUP BY DEPARTAMENTO, PROVINCIA, DISTRITO
            ORDER BY DEPARTAMENTO, PROVINCIA, DISTRITO
        """), params).fetchall()

        provincias = db.execute(text(f"""
            SELECT DEPARTAMENTO, PROVINCIA, {SUBIND_AGGS}
            FROM {TABLE} {w}
            GROUP BY DEPARTAMENTO, PROVINCIA
            ORDER BY DEPARTAMENTO, PROVINCIA
        """), params).fetchall()

        total = db.execute(text(f"""
            SELECT {SUBIND_AGGS} FROM {TABLE} {w}
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
# GET /cg/cg10/tabla-redes  — RED → MICRORED → ESTABLECIMIENTO
# ---------------------------------------------------------------------------
@router.get("/tabla-redes", summary="Datos por Red/Microred/Establecimiento")
def get_tabla_redes(
    anio: int = Query(...), mes: str = Query(...),
    red:          Optional[str] = Query(None),
    microred:     Optional[str] = Query(None),
    departamento: Optional[str] = Query(None),
    provincia:    Optional[str] = Query(None),
    categoria:    Optional[str] = Query(None),
    grupo:        Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("cg:read")),
):
    filters = ["[Año] = :anio", "UPPER(Desc_Mes) = UPPER(:mes)"]
    params: dict = {"anio": anio, "mes": mes}
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                   params["red"] = red
    if microred:     filters.append("UPPER(MICRORED) = UPPER(:microred)");         params["microred"] = microred
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)"); params["departamento"] = departamento
    if provincia:    filters.append("UPPER(PROVINCIA) = UPPER(:provincia)");       params["provincia"] = provincia
    if categoria:    filters.append("UPPER(CATEGORIA) = UPPER(:categoria)");       params["categoria"] = categoria
    if grupo:        filters.append("UPPER(Grupo) = UPPER(:grupo)");               params["grupo"] = grupo
    w = "WHERE " + " AND ".join(filters)

    try:
        establecimientos = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED, ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                ESTABLECIMIENTO, {SUBIND_AGGS}
            FROM {TABLE} {w}
            GROUP BY RED, MICRORED, ESTABLECIMIENTO
            ORDER BY RED, MICRORED, ESTABLECIMIENTO
        """), params).fetchall()

        microredes = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED, ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                {SUBIND_AGGS}
            FROM {TABLE} {w}
            GROUP BY RED, MICRORED
            ORDER BY RED, MICRORED
        """), params).fetchall()

        redes_rows = db.execute(text(f"""
            SELECT ISNULL(RED,'SIN RED') AS RED, {SUBIND_AGGS}
            FROM {TABLE} {w}
            GROUP BY RED ORDER BY RED
        """), params).fetchall()

        total = db.execute(text(f"""
            SELECT {SUBIND_AGGS} FROM {TABLE} {w}
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
# GET /cg/cg10/resumen — Tendencia por año/mes
# ---------------------------------------------------------------------------
@router.get("/resumen", summary="Resumen de nominales por año y mes")
def get_resumen(
    anio:         Optional[int] = Query(None),
    departamento: Optional[str] = Query(None),
    red:          Optional[str] = Query(None),
    grupo:        Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("cg:read")),
):
    filters, params = [], {}
    if anio:         filters.append("anio = :anio");                                 params["anio"] = anio
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)");   params["departamento"] = departamento
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                     params["red"] = red
    if grupo:        filters.append("UPPER(Grupo) = UPPER(:grupo)");                 params["grupo"] = grupo
    w = "WHERE " + " AND ".join(filters) if filters else ""

    try:
        rows = db.execute(text(f"""
            SELECT [Año] AS anio, Desc_Mes,
                SUM(DENOMINADOR) AS total_denominador,
                SUM(NUMERADOR)   AS total_numerador,
                CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(NUMERADOR) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS avance_pct,
                SUM(HO_CUMPLE) AS ho_cumple,
                CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(HO_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS ho_pct,
                SUM(AN_CUMPLE) AS an_cumple,
                CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(AN_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS an_pct,
                SUM(FB_CUMPLE) AS fb_cumple,
                CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(FB_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS fb_pct,
                SUM(PD_CUMPLE) AS pd_cumple,
                CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(PD_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS pd_pct,
                SUM(AS_CUMPLE) AS as_cumple,
                CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(AS_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS as_pct
            FROM {TABLE} {w}
            GROUP BY [Año], Desc_Mes
            ORDER BY [Año], {MES_ORDER}
        """), params).fetchall()
        return {"data": [dict(r._mapping) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /cg/cg10/subindicadores — Resumen de cada subindicador para un mes
# ---------------------------------------------------------------------------
@router.get("/subindicadores", summary="Avance por subindicador para un período")
def get_subindicadores(
    anio: int = Query(...), mes: str = Query(...),
    departamento: Optional[str] = Query(None),
    red:          Optional[str] = Query(None),
    grupo:        Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("cg:read")),
):
    filters = ["[Año] = :anio", "UPPER(Desc_Mes) = UPPER(:mes)"]
    params: dict = {"anio": anio, "mes": mes}
    if departamento: filters.append("UPPER(DEPARTAMENTO) = UPPER(:departamento)"); params["departamento"] = departamento
    if red:          filters.append("UPPER(RED) = UPPER(:red)");                   params["red"] = red
    if grupo:        filters.append("UPPER(Grupo) = UPPER(:grupo)");               params["grupo"] = grupo
    w = "WHERE " + " AND ".join(filters)

    try:
        row = db.execute(text(f"""
            SELECT
                SUM(DENOMINADOR) AS denominador,
                SUM(NUMERADOR)   AS numerador,
                CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(NUMERADOR) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS avance_pct,
                SUM(HO_CUMPLE) AS ho_cumple, CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(HO_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS ho_pct,
                SUM(AN_CUMPLE) AS an_cumple, CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(AN_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS an_pct,
                SUM(FB_CUMPLE) AS fb_cumple, CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(FB_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS fb_pct,
                SUM(PD_CUMPLE) AS pd_cumple, CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(PD_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS pd_pct,
                SUM(AS_CUMPLE) AS as_cumple, CASE WHEN SUM(DENOMINADOR)>0 THEN ROUND(CAST(SUM(AS_CUMPLE) AS FLOAT)/SUM(DENOMINADOR)*100,2) ELSE 0 END AS as_pct
            FROM {TABLE} {w}
        """), params).fetchone()
        return dict(row._mapping) if row else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))