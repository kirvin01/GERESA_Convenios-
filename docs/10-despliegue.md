# 10 — Despliegue

## Objetivo

Documentar el despliegue en Ubuntu con Docker y nginx según `deploy/`.

## Alcance

- `docker-compose.yml` y `Dockerfile`
- Configuraciones nginx (contenedor y host)
- Pasos de `deploy/README.md`
- Variables `deploy/.env`

**No incluye:** automatización CI/CD — **no existe** en el repositorio.

## Responsabilidades

| Componente | Responsabilidad |
|------------|-----------------|
| Contenedor `api` | FastAPI + ODBC 18, puerto interno 8000 |
| Contenedor `nginx` | Sirve `Frontend/dist` y proxy `/api/` → `api:8000`; bind `127.0.0.1:${NGINX_PORT:-8082}` |
| nginx del host | Expone 80/443; proxy hacia 8082; ejemplos SSL/HTTP |
| Operador | `git pull`, build frontend, `docker compose up`, certificados |

## Dependencias

- Imagen base `python:3.11-slim-bookworm`
- `nginx:1.27-alpine`
- SQL Server de producción (`172.16.20.5` según README raíz)
- Build previo de Frontend (`Frontend/dist`)
- Dominio documentado: `indicadores.diresacusco.gob.pe`

## Archivos relacionados

| Archivo | Rol |
|---------|-----|
| `deploy/docker-compose.yml` | Servicios `api` + `nginx` |
| `deploy/Dockerfile` | Imagen API |
| `deploy/nginx.conf` | Nginx dentro de Compose |
| `deploy/nginx-host.conf.example` | Snippet host → 8082 |
| `deploy/nginx-indicadores-http-only.conf.example` | HTTP para certbot |
| `deploy/nginx-indicadores-ssl.conf.example` | HTTPS + HSTS |
| `deploy/.env.example` | Plantilla |
| `deploy/README.md` | Guía completa |
| `Backend/Plantillas/` | Montada en contenedor API |

## Flujo resumido (desde `deploy/README.md`)

1. Código en servidor (ruta documentada: `/var/www/convenio`)
2. Configurar `deploy/.env` y `Frontend/.env` (prod: `VITE_CON_PREFIJO=SI`)
3. `npm run build` en Frontend
4. `docker compose up -d --build` en `deploy/`
5. Configurar proxy host con ejemplos nginx
6. Opcional: Let's Encrypt

Actualización típica: `git pull` → rebuild frontend → `docker compose up -d --build`.

## Topología

```text
Internet → nginx host (:80/:443)
              → 127.0.0.1:8082 (nginx Docker)
                    → estáticos Frontend/dist
                    → /api/* → api:8000 (FastAPI)
```

El nginx de Compose elimina el prefijo `/api/` al proxificar (según `deploy/nginx.conf`).

## Riesgos

- Olvidar rebuild del Frontend tras cambiar `VITE_*` (quedan valores viejos en `dist`).
- Exponer el puerto Docker sin nginx host.
- Driver ODBC incorrecto (17 en Windows vs 18 en Docker).
- `GitUp.bat` del Backend menciona `master` mientras docs hablan de `main` — posible confusión de rama.

## Mejoras posibles

- Añadir pipeline CI (hoy ausente).
- Healthchecks en Compose.
- Documentar rollback y backups de BD (no están en este repo).
