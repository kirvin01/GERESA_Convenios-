# Despliegue en Ubuntu (Docker + nginx host)

Guía para publicar GERESA Convenios en **indicadores.diresacusco.gob.pe** (IP **38.210.173.251**) **sin puerto en la URL**.

## Arquitectura

```
Internet :80
    └── nginx del HOST (intranet + proxy inverso)
            ├── /                    → Intranet GERESA (existente)
            ├── /api/                → http://127.0.0.1:8082/api/  (Docker)
            ├── /login, /reportesFED → http://127.0.0.1:8082       (Docker)
            └── /assets/             → http://127.0.0.1:8082/assets/ (Docker)

Docker (solo localhost):
    api   → FastAPI :8000 (interno)
    nginx → Frontend/dist + proxy /api/ en 127.0.0.1:8082
```

| Componente | Descripción |
|------------|-------------|
| `api` | Contenedor FastAPI (uvicorn :8000 interno, ODBC 18) |
| `nginx` (Docker) | Estáticos + proxy `/api/` → `api:8000`, expuesto solo en **127.0.0.1:8082** |
| `nginx` (host) | Puerto **80** público; proxy inverso sin `:8082` en la URL |

## Requisitos en el servidor

- Ubuntu con Docker y Docker Compose v2
- nginx del sistema en puerto **80** (intranet existente)
- Node.js 20+ (solo para `npm run build` del frontend)
- Acceso de red a SQL Server en `172.16.20.5:1433`
- DNS: `indicadores.diresacusco.gob.pe` → **38.210.173.251**

## Pasos de despliegue

### 1. Clonar o actualizar el repositorio

```bash
cd /var/www/convenio
git pull origin main
```

### 2. Configurar variables de entorno (obligatorio)

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
```

Edite credenciales SQL Server, `SECRET_KEY` y confirme `NGINX_PORT=8082`.

Frontend:

```bash
cp Frontend/.env.example Frontend/.env
nano Frontend/.env
```

Valores de producción (**sin puerto**):

```env
VITE_API_URL=http://indicadores.diresacusco.gob.pe
VITE_CON_PREFIJO=SI
```

> **Importante:** `VITE_*` se embeben en el build. Tras cambiar `Frontend/.env` ejecute `npm run build` de nuevo.

### 3. Compilar el frontend

```bash
cd Frontend
npm install
npm run build
cd ..
```

Verifique: `ls Frontend/dist/index.html`

### 4. Levantar contenedores Docker

```bash
cd deploy
docker compose up -d --build
docker compose ps
```

Debe ver nginx en `127.0.0.1:8082->80/tcp` (no `0.0.0.0`).

Prueba local:

```bash
curl -I http://127.0.0.1:8082
curl -I http://127.0.0.1:8082/api/docs
```

### 5. Configurar proxy inverso en nginx del host (OBLIGATORIO)

Copie la plantilla:

```bash
sudo cp /var/www/convenio/deploy/nginx-host.conf.example /etc/nginx/snippets/convenio-proxy.conf
```

Edite el sitio nginx de la intranet (ej. `/etc/nginx/sites-available/indicadores` o el que use `indicadores.diresacusco.gob.pe`) y **dentro del bloque `server {}`**, **antes** del `location /` de la intranet, agregue:

```nginx
include /etc/nginx/snippets/convenio-proxy.conf;
```

Verifique y recargue:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Verificar acceso público (sin puerto)

- Intranet: http://indicadores.diresacusco.gob.pe
- Login Convenios: http://indicadores.diresacusco.gob.pe/login
- API docs: http://indicadores.diresacusco.gob.pe/api/docs

## Actualizar tras cambios en el código

```bash
cd /var/www/convenio
git pull origin main

cd Frontend && npm run build && cd ..

cd deploy
docker compose up -d --build
```

No hace falta reiniciar nginx del host salvo que cambie `nginx-host.conf.example`.

## Solución de problemas

### `env file deploy/.env not found`

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
```

### Login carga pero API falla (CORS o 404)

- `Frontend/.env`: `VITE_API_URL=http://indicadores.diresacusco.gob.pe` (sin `:8082`)
- `deploy/.env`: `CORS_ORIGINS` debe incluir el dominio
- Recompile: `npm run build`
- Confirme proxy `/api/` en nginx del host: `curl -I http://127.0.0.1/api/docs`

### Intranet deja de funcionar tras agregar el proxy

Los `location` de Convenios deben ir **antes** del `location /` de la intranet. No reemplace el bloque `server {}` completo.

### Error de conexión a SQL Server

```bash
nc -zv 172.16.20.5 1433
docker compose logs api
```

## Checklist

1. DNS `indicadores.diresacusco.gob.pe` → **38.210.173.251**
2. `deploy/.env` con credenciales SQL y `SECRET_KEY`
3. `Frontend/.env` con dominio **sin puerto** y `VITE_CON_PREFIJO=SI`
4. `npm run build` sin errores
5. `docker compose ps` → api y nginx **Up** en `127.0.0.1:8082`
6. `include convenio-proxy.conf` en nginx del host
7. http://indicadores.diresacusco.gob.pe/login responde
