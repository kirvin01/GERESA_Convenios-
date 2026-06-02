# fed_mc_01_02.py
# Router para el reporte FED MC-01_02 — Oportunidad y Modificaciones

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.engine import Connection
from typing import Optional, Dict, Any, List
from conexion import engine
from permissions import require_permission

router = APIRouter(prefix="/fed/oportunidad-modificaciones", tags=["Oportunidad y Modificaciones"])

def get_db():
    if engine is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible.")
    conn = engine.connect()
    try:
        yield conn
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# OPORTUNIDAD DE REGISTRO (3 categorías)
# ---------------------------------------------------------------------------
@router.get("/oportunidad", summary="Datos de OPORTUNIDAD (Oportuno/Inoportuno/Muy Inoportuno)")
def get_oportunidad(
    anio: int = Query(2026, description="Año"),
    mes: str = Query(...),
    red: Optional[str] = Query(None),
    microred: Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        where_clauses = ["UPPER(MES) = UPPER(:mes)"]
        params = {"mes": mes}
        
        if red:
            where_clauses.append("UPPER(RED) = UPPER(:red)")
            params["red"] = red
        if microred:
            where_clauses.append("UPPER(MICRO_RED) = UPPER(:microred)")
            params["microred"] = microred
        
        where_sql = " AND ".join(where_clauses)
        
        query = text(f"""
            SELECT 
                RED,
                MICRO_RED as MICRORED,
                SUM(CASE WHEN OPORTUNIDAD = '01. Oportuno' THEN TOTAL_ATENCIONES ELSE 0 END) AS oportuno,
                SUM(CASE WHEN OPORTUNIDAD = '02. Inoportuno' THEN TOTAL_ATENCIONES ELSE 0 END) AS inoportuno,
                SUM(CASE WHEN OPORTUNIDAD = '03. Muy Inoportuno' THEN TOTAL_ATENCIONES ELSE 0 END) AS muy_inoportuno,
                SUM(TOTAL_ATENCIONES) AS total
            FROM DBFED2026.dbo.FED_TREGISTRO_v2
            WHERE {where_sql}
            GROUP BY RED, MICRO_RED
            ORDER BY RED, MICRO_RED
        """)
        
        rows = db.execute(query, params).fetchall()
        
        redes_dict = {}
        for row in rows:
            red_name = row.RED or "SIN RED"
            microred_name = row.MICRORED or "SIN MICRORED"
            
            if red_name not in redes_dict:
                redes_dict[red_name] = {
                    "nombre": red_name,
                    "oportuno": 0,
                    "inoportuno": 0,
                    "muy_inoportuno": 0,
                    "total": 0,
                    "subgrupos": []
                }
            
            redes_dict[red_name]["oportuno"] += row.oportuno
            redes_dict[red_name]["inoportuno"] += row.inoportuno
            redes_dict[red_name]["muy_inoportuno"] += row.muy_inoportuno
            redes_dict[red_name]["total"] += row.total
            
            redes_dict[red_name]["subgrupos"].append({
                "nombre": microred_name,
                "oportuno": row.oportuno,
                "inoportuno": row.inoportuno,
                "muy_inoportuno": row.muy_inoportuno,
                "total": row.total
            })
        
        total_oportuno = sum(r["oportuno"] for r in redes_dict.values())
        total_inoportuno = sum(r["inoportuno"] for r in redes_dict.values())
        total_muy_inoportuno = sum(r["muy_inoportuno"] for r in redes_dict.values())
        total_general = sum(r["total"] for r in redes_dict.values())
        
        return {
            "anio": anio,
            "mes": mes.upper(),
            "tipo": "oportunidad",
            "redes": list(redes_dict.values()),
            "total": {
                "oportuno": total_oportuno,
                "inoportuno": total_inoportuno,
                "muy_inoportuno": total_muy_inoportuno,
                "total": total_general
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# ESTADO DE MODIFICACIONES (3 categorías)
# ---------------------------------------------------------------------------
@router.get("/modificaciones", summary="Datos de MODIFICACIONES")
def get_modificaciones(
    anio: int = Query(2026),
    mes: str = Query(...),
    red: Optional[str] = Query(None),
    microred: Optional[str] = Query(None),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        where_clauses = ["UPPER(MES) = UPPER(:mes)"]
        params = {"mes": mes}
        
        if red:
            where_clauses.append("UPPER(RED) = UPPER(:red)")
            params["red"] = red
        if microred:
            where_clauses.append("UPPER(MICRO_RED) = UPPER(:microred)")
            params["microred"] = microred
        
        where_sql = " AND ".join(where_clauses)
        
        query = text(f"""
            SELECT 
                RED,
                MICRO_RED as MICRORED,
                SUM(CASE WHEN TIEMPO_MODIFICADO = '03. Sin Modificación' THEN TOTAL_ATENCIONES ELSE 0 END) AS sin_modificacion,
                SUM(CASE WHEN TIEMPO_MODIFICADO = '01. Modificacion Aceptable' THEN TOTAL_ATENCIONES ELSE 0 END) AS aceptable,
                SUM(CASE WHEN TIEMPO_MODIFICADO = '02. Modificacion a Destiempo' THEN TOTAL_ATENCIONES ELSE 0 END) AS destiempo,
                SUM(TOTAL_ATENCIONES) AS total
            FROM DBFED2026.dbo.FED_FMODIFICADO_v2
            WHERE {where_sql}
            GROUP BY RED, MICRO_RED
            ORDER BY RED, MICRO_RED
        """)
        
        rows = db.execute(query, params).fetchall()
        
        redes_dict = {}
        for row in rows:
            red_name = row.RED or "SIN RED"
            microred_name = row.MICRORED or "SIN MICRORED"
            
            if red_name not in redes_dict:
                redes_dict[red_name] = {
                    "nombre": red_name,
                    "sin_modificacion": 0,
                    "aceptable": 0,
                    "destiempo": 0,
                    "total": 0,
                    "subgrupos": []
                }
            
            redes_dict[red_name]["sin_modificacion"] += row.sin_modificacion
            redes_dict[red_name]["aceptable"] += row.aceptable
            redes_dict[red_name]["destiempo"] += row.destiempo
            redes_dict[red_name]["total"] += row.total
            
            redes_dict[red_name]["subgrupos"].append({
                "nombre": microred_name,
                "sin_modificacion": row.sin_modificacion,
                "aceptable": row.aceptable,
                "destiempo": row.destiempo,
                "total": row.total
            })
        
        total_sin = sum(r["sin_modificacion"] for r in redes_dict.values())
        total_aceptable = sum(r["aceptable"] for r in redes_dict.values())
        total_destiempo = sum(r["destiempo"] for r in redes_dict.values())
        total_general = sum(r["total"] for r in redes_dict.values())
        
        return {
            "anio": anio,
            "mes": mes.upper(),
            "tipo": "modificaciones",
            "redes": list(redes_dict.values()),
            "total": {
                "sin_modificacion": total_sin,
                "aceptable": total_aceptable,
                "destiempo": total_destiempo,
                "total": total_general
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# FILTROS
# ---------------------------------------------------------------------------
@router.get("/filtros", summary="Valores disponibles para filtros")
def get_filtros(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        anios = [2026]
        
        meses_query = db.execute(text("""
            SELECT DISTINCT MES 
            FROM DBFED2026.dbo.FED_TREGISTRO_v2 
            WHERE MES IS NOT NULL
        """)).fetchall()
        
        orden_meses = {
            'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4,
            'MAYO': 5, 'JUNIO': 6, 'JULIO': 7, 'AGOSTO': 8,
            'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
        }
        meses = sorted([r[0] for r in meses_query], key=lambda x: orden_meses.get(x, 99))
        
        redes = db.execute(text(
            "SELECT DISTINCT RED FROM DBFED2026.dbo.FED_TREGISTRO_v2 WHERE RED IS NOT NULL ORDER BY RED"
        )).fetchall()
        
        microredes = db.execute(text(
            "SELECT DISTINCT RED, MICRO_RED FROM DBFED2026.dbo.FED_TREGISTRO_v2 WHERE MICRO_RED IS NOT NULL ORDER BY RED, MICRO_RED"
        )).fetchall()
        
        return {
            "anios": anios,
            "meses": meses,
            "redes": [r[0] for r in redes],
            "microredes": [{"red": r[0], "microred": r[1]} for r in microredes],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# RESUMEN MENSUAL (para gráfico de barras)
# ---------------------------------------------------------------------------
@router.get("/resumen-mensual", summary="Resumen mensual para gráfico de barras")
def get_resumen_mensual(
    anio: int = Query(2026),
    db: Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("fed:read")),
):
    try:
        # Datos de oportunidad por mes
        query_op = text("""
            SELECT MES,
                SUM(TOTAL_ATENCIONES) AS total,
                SUM(CASE WHEN OPORTUNIDAD = '01. Oportuno' THEN TOTAL_ATENCIONES ELSE 0 END) AS oportuno
            FROM DBFED2026.dbo.FED_TREGISTRO_v2
            GROUP BY MES
        """)
        
        # Datos de modificaciones por mes
        query_mod = text("""
            SELECT MES,
                SUM(TOTAL_ATENCIONES) AS total,
                SUM(CASE WHEN TIEMPO_MODIFICADO = '01. Modificacion Aceptable' THEN TOTAL_ATENCIONES ELSE 0 END) AS aceptable
            FROM DBFED2026.dbo.FED_FMODIFICADO_v2
            GROUP BY MES
        """)
        
        op_data = db.execute(query_op).fetchall()
        mod_data = db.execute(query_mod).fetchall()
        
        orden_meses = {
            'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4,
            'MAYO': 5, 'JUNIO': 6, 'JULIO': 7, 'AGOSTO': 8,
            'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
        }
        
        resultado = []
        for mes, orden in sorted(orden_meses.items(), key=lambda x: x[1]):
            op_mes = next((row for row in op_data if row.MES == mes), None)
            mod_mes = next((row for row in mod_data if row.MES == mes), None)
            
            resultado.append({
                "mes": mes[:3],
                "oportunidad": round((op_mes.oportuno / op_mes.total * 100), 2) if op_mes and op_mes.total > 0 else 0,
                "modificaciones_aceptables": round((mod_mes.aceptable / mod_mes.total * 100), 2) if mod_mes and mod_mes.total > 0 else 0
            })
        
        return {"data": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))