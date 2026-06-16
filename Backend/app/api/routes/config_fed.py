# GET /config/fed/all — fuentes de datos para el header FED

from datetime import date, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.core.db import get_db
from auth import get_current_user

router = APIRouter(prefix="/config/fed", tags=["Config FED"])

TABLE = "DBFED2026.dbo.Config"


class ConfigFedItem(BaseModel):
    id: int
    fuente: str
    fecha: str | None
    fecha_formateada: str | None = None


class ConfigFedResponse(BaseModel):
    success: bool
    data: list[ConfigFedItem]
    total: int
    message: str | None = None


def _format_fecha(value) -> tuple[str | None, str | None]:
    if value is None:
        return None, None
    if isinstance(value, datetime):
        d = value.date()
    elif isinstance(value, date):
        d = value
    else:
        return str(value), str(value)
    return d.isoformat(), d.strftime("%d/%m/%Y")


@router.get("/all", response_model=ConfigFedResponse, summary="Listar fuentes de datos FED")
def get_all_fuentes(
    db: Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
  del current_user
  rows = db.execute(
      text(f"SELECT ID, Fuente, Fecha FROM {TABLE} ORDER BY ID")
  ).fetchall()

  data: list[ConfigFedItem] = []
  for row in rows:
      fecha_iso, fecha_fmt = _format_fecha(row.Fecha)
      data.append(
          ConfigFedItem(
              id=row.ID,
              fuente=row.Fuente,
              fecha=fecha_iso,
              fecha_formateada=fecha_fmt,
          )
      )

  return ConfigFedResponse(success=True, data=data, total=len(data))
