# Factory de la aplicacion FastAPI

from decouple import Csv, config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router


def create_app() -> FastAPI:
    app = FastAPI(
        title=config("APP_TITLE", default="GERESAPI"),
        description=config(
            "APP_DESCRIPTION",
            default="API para consultas a la base de datos de GERESA.",
        ),
        version=config("APP_VERSION", default="1.0.0"),
    )

    origins = config(
        "CORS_ORIGINS",
        default=(
            "http://localhost:5173,http://127.0.0.1:5173,"
            "http://192.168.1.14:5173,http://192.168.1.14:5174,"
            "http://192.168.56.1:5173,"
        ),
        cast=Csv(),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    return app
