# permissions.py — RBAC centralizado

from enum import Enum
from fastapi import Depends, HTTPException, status
from auth import get_current_user

class Role(str, Enum):
    ADMIN = "admin"
    FED = "fed"
    CG = "cg"
    ATENCIONES = "atenciones"
    USER = "user"

ROLE_PERMISSIONS: dict[str, set[str]] = {
    Role.ADMIN: {"*"},
    Role.FED: {"fed:read", "pacientes:read"},
    Role.CG: {"cg:read", "pacientes:read"},
    Role.ATENCIONES: {"pacientes:read"},
    Role.USER: {"pacientes:read"},
}

def has_permission(role: str, permission: str) -> bool:
    perms = ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS[Role.ATENCIONES])
    if "*" in perms:
        return True
    module = permission.split(":")[0]
    return permission in perms or f"{module}:*" in perms

def require_permission(permission: str):
    def checker(current_user: dict = Depends(get_current_user)):
        if not has_permission(current_user["role"], permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado para su perfil.",
            )
        return current_user
    return checker

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación no permitida. Se requieren privilegios de administrador.",
        )
    return current_user
