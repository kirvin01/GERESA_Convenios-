# Registro central de routers FED — prefijos sin cambios para el frontend

from fastapi import APIRouter

from fed_mc_01_01 import router as fed_mc0101_router
from his_diario import router as his_diario_router
from FED.fed_mc_02_01 import router as fed_mc_02_01_router
from FED.fed_mc_03_01 import router as fed_mc_03_01_router
from FED.fed_si_01_01 import router as fed_si_01_01_router
from FED.fed_si_01_02 import router as fed_si_01_02_router
from FED.fed_si_01_03 import router as fed_si_01_03_router
from FED.fed_si_02_01 import router as fed_si_02_01_router
from FED.fed_si_02_02 import router as fed_si_02_02_router
from FED.fed_si_02_03 import router as fed_si_02_03_router
from FED.fed_si_02_04 import router as fed_si_02_04_router
from FED.fed_si_03_01 import router as fed_si_03_01_router
from FED.fed_si_03_02 import router as fed_si_03_02_router
from FED.fed_vi_01_01 import router as fed_vi_01_01_router
from FED.fed_vi_01_02 import router as fed_vi_01_02_router
from FED.Oportunidad_Modificaciones import router as oportunidad_modificaciones_router

FED_ROUTERS: list[APIRouter] = [
    fed_mc0101_router,
    fed_mc_02_01_router,
    fed_mc_03_01_router,
    fed_si_01_01_router,
    fed_si_01_02_router,
    fed_si_01_03_router,
    fed_si_02_01_router,
    fed_si_02_02_router,
    fed_si_02_03_router,
    fed_si_02_04_router,
    fed_si_03_01_router,
    fed_si_03_02_router,
    fed_vi_01_01_router,
    fed_vi_01_02_router,
    his_diario_router,
    oportunidad_modificaciones_router,
]
