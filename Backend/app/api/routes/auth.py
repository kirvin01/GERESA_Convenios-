# Autenticacion: POST /login, GET /me

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.core.deps import get_db_connection
from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_current_user,
    verify_password,
)
from models import TokenResponse, UserInDB

router = APIRouter(tags=["Autenticacion"])


def get_user_from_db(username: str, db: Connection) -> Optional[UserInDB]:
    query = text("""
        SELECT username, hashed_password, role, disabled
        FROM Usuarios
        WHERE username = :username
    """)
    result = db.execute(query, {"username": username}).fetchone()
    if result:
        return UserInDB(
            username=result.username,
            hashed_password=result.hashed_password,
            role=result.role,
            disabled=bool(result.disabled),
        )
    return None


@router.post("/login", response_model=TokenResponse, summary="Iniciar sesion desde Base de Datos")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Connection = Depends(get_db_connection),
):
    user = get_user_from_db(form_data.username, db)

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Usuario o contrasena incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.disabled:
        raise HTTPException(status_code=403, detail="Usuario deshabilitado.")

    token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", summary="Informacion del usuario autenticado")
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user
