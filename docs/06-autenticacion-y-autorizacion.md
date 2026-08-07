# 06 — Autenticación y autorización

## Objetivo

Describir el modelo JWT + RBAC implementado en Backend y Frontend.

## Alcance

- Login, emisión y validación de token
- Roles y permisos
- Guards de API y de rutas UI
- Almacenamiento de sesión en el navegador
- Inactividad

**No incluye:** SSO institucional, refresh tokens o MFA — **no existen** en el código.

## Responsabilidades

| Pieza | Responsabilidad |
|-------|-----------------|
| `POST /login` | Valida usuario/clave en `Usuarios`, emite JWT |
| `auth.py` | Hash bcrypt, JWT HS256, `get_current_user` |
| `permissions.py` | `ROLE_PERMISSIONS`, `require_permission`, `require_admin` |
| `authService.ts` | Login form-urlencoded, `geresa_token` en `localStorage` |
| `AuthContext.tsx` | Estado `authenticated` / `role` / `can` |
| `AppRoutes.tsx` | `RequireAuth`, `RequirePermission` |
| `useInactivityLogout.ts` | Logout tras 30 minutos de inactividad |

## Dependencias

- `SECRET_KEY` y `ACCESS_TOKEN_EXPIRE_MINUTES` (Backend)
- Tabla `dbo.Usuarios` con columnas usadas: `username`, `hashed_password`, `role`, `disabled`, `id`
- `passlib` + `bcrypt==4.0.1` (pin explícito en `requirements.txt` por compatibilidad)

## Archivos relacionados

| Archivo | Rol |
|---------|-----|
| `Backend/auth.py` | JWT y usuario actual |
| `Backend/permissions.py` | RBAC servidor |
| `Backend/app/api/routes/auth.py` | Endpoints login/me |
| `Backend/models.py` | `TokenResponse`, `UserInDB` |
| `Frontend/src/services/authService.ts` | Cliente auth |
| `Frontend/src/config/permissions.ts` | RBAC cliente + rutas |
| `Frontend/src/context/AuthContext.tsx` | Provider |
| `Frontend/src/hooks/useInactivityLogout.ts` | Timeout |

## Roles y permisos (código)

Definidos en Backend y Frontend de forma equivalente:

| Rol | Permisos |
|-----|----------|
| `admin` | `*` (todos) |
| `fed` | `fed:read`, `pacientes:read` |
| `cg` | `cg:read`, `pacientes:read` |
| `atenciones` | `pacientes:read` |
| `user` | `pacientes:read` |

Rol desconocido en Backend: fallback a permisos de `atenciones`.

### Notas de alineación

- Frontend usa permiso de ruta `admin:users` para `/admin/usuarios`. El Backend protege con `require_admin` (rol exacto `admin`), no con un string `admin:users`. Funciona porque `admin` tiene `*`.
- Certificados y `config/fed` requieren usuario autenticado, no un permiso de módulo específico.

## Flujo de login (factual)

1. UI envía `POST {baseURL}/login` con `application/x-www-form-urlencoded` (`username`, `password`).
2. Backend consulta `Usuarios`, verifica bcrypt, rechaza `disabled`.
3. Emite JWT con claims `sub`, `role`, `exp` (algoritmo `HS256`).
4. Frontend guarda `access_token` en `localStorage` clave `geresa_token`.
5. Peticiones posteriores envían `Authorization: Bearer <token>`.
6. `get_current_user` decodifica JWT y **revalida** el usuario en BD (`disabled = 0`).

## Riesgos

- Token solo en `localStorage` (exposición XSS).
- Sin refresh token: expiración obliga a re-login.
- Servicios FED con `apiFetch` local no invocan el handler global de 401 de `apiClient`.
- Si falta tabla `Usuarios`, `/login` responde 500 (el navegador puede reportarlo como CORS).

## Mejoras posibles

- Unificar manejo 401 en un solo cliente HTTP.
- Documentar creación inicial de `Usuarios` con script SQL versionado.
- Evaluar httpOnly cookies (cambio de diseño; hoy no existe).
- Alinear documentación antigua que solo menciona roles `admin`/`user`.
