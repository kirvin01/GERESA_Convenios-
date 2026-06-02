# Gestion de usuarios: /usuarios

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text

from auth import pwd_context
from conexion import engine
from permissions import require_admin

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("")
async def listar_usuarios(current_user: dict = Depends(require_admin)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, username, role FROM dbo.Usuarios")).fetchall()
    return {"users": [{"id": r[0], "username": r[1], "role": r[2]} for r in result]}


@router.post("")
async def crear_usuario(
    username: str = Query(...),
    password: str = Query(...),
    role: str = Query("atenciones"),
    current_user: dict = Depends(require_admin),
):
    hashed_pw = pwd_context.hash(password)
    try:
        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO dbo.Usuarios (username, hashed_password, role) VALUES (:u, :p, :r)"),
                {"u": username, "p": hashed_pw, "r": role},
            )
        return {"message": "Usuario creado en la base de datos"}
    except Exception:
        raise HTTPException(status_code=400, detail="El usuario ya existe o error de DB")


@router.delete("/{user_id}")
async def eliminar_usuario(user_id: int, current_user: dict = Depends(require_admin)):
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM dbo.Usuarios WHERE id = :id"), {"id": user_id})
    return {"message": "Usuario eliminado correctamente"}


@router.put("/{user_id}")
async def editar_usuario(
    user_id: int,
    username: str = Query(...),
    password: Optional[str] = Query(None),
    role: str = Query(...),
    current_user: dict = Depends(require_admin),
):
    try:
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE dbo.Usuarios SET username = :u, role = :r WHERE id = :id"),
                {"u": username, "r": role, "id": user_id},
            )
            if password and password.strip():
                hashed_pw = pwd_context.hash(password)
                conn.execute(
                    text("UPDATE dbo.Usuarios SET hashed_password = :p WHERE id = :id"),
                    {"p": hashed_pw, "id": user_id},
                )
        return {"message": "Usuario actualizado correctamente"}
    except Exception as e:
        print(f"Error al editar: {e}")
        raise HTTPException(status_code=400, detail="Error al actualizar el usuario")
