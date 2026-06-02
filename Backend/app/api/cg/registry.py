# Registro central de routers CG

from fastapi import APIRouter

from cg_10 import router as cg_10_router

CG_ROUTERS: list[APIRouter] = [
    cg_10_router,
]
