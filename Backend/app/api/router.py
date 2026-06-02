# Router principal — monta todos los modulos sin cambiar URLs

from fastapi import APIRouter

from app.api.cg.registry import CG_ROUTERS
from app.api.fed.registry import FED_ROUTERS
from app.api.routes import auth, certificados, pacientes, users

api_router = APIRouter()

# Core: auth, usuarios, pacientes, certificados
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(pacientes.router)
api_router.include_router(certificados.router)

# Reportes FED y CG (modulos existentes, mismos prefijos /fed/* y /cg/*)
for fed_router in FED_ROUTERS:
    api_router.include_router(fed_router)

for cg_router in CG_ROUTERS:
    api_router.include_router(cg_router)
