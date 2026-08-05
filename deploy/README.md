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
VITE_API_URL=https://indicadores.diresacusco.gob.pe
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

- `Frontend/.env`: `VITE_API_URL=https://indicadores.diresacusco.gob.pe` (HTTPS obligatorio)
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

## Certificado SSL sostenible (Let's Encrypt)

### Diagnóstico previo (su caso)

Si `openssl s_client` muestra `CN = dj.diresacusco.gob.pe` al conectar a `indicadores.diresacusco.gob.pe`, **no existe** un bloque nginx/certificado para `indicadores` y nginx usa el sitio por defecto (`dj`).

Compruebe:

```bash
dig +short indicadores.diresacusco.gob.pe    # debe ser la IP pública de ESTE servidor
curl -s ifconfig.me
sudo certbot certificates                     # debe listar indicadores.diresacusco.gob.pe
```

### Paso 1 — Bloque nginx SOLO HTTP (obligatorio primero)

**No** use el bloque `listen 443` ni rutas `ssl_certificate` hasta que el certificado exista.
Si nginx referencia archivos que aun no existen, `nginx -t` y `certbot` fallan.

```bash
sudo cp /var/www/convenio/deploy/nginx-indicadores-http-only.conf.example /etc/nginx/sites-available/indicadores
sudo ln -sf /etc/nginx/sites-available/indicadores /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Paso 2 — Emitir certificado

```bash
sudo certbot certonly --nginx -d indicadores.diresacusco.gob.pe
```

Confirme que existen los archivos:

```bash
sudo ls /etc/letsencrypt/live/indicadores.diresacusco.gob.pe/
```

### Paso 3 — Activar HTTPS + proxy Convenios

**Solo despues** de que certbot haya creado el certificado:

```bash
sudo cp /var/www/convenio/deploy/nginx-indicadores-ssl.conf.example /etc/nginx/sites-available/indicadores
sudo nginx -t && sudo systemctl reload nginx
```

### Paso 4 — Renovación automática (sostenible)

En Ubuntu, Certbot instala un timer systemd. Verifique:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

Let's Encrypt renueva cada ~60 días; el timer ejecuta `certbot renew` dos veces al día. Tras renovar, nginx debe recargarse (Certbot lo hace si usó `--nginx` o hay hook en `/etc/letsencrypt/renewal/`).

Hook manual (opcional), en `/etc/letsencrypt/renewal/indicadores.diresacusco.gob.pe.conf`:

```ini
renew_hook = systemctl reload nginx
```

### Paso 5 — Frontend con HTTPS

```env
VITE_API_URL=https://indicadores.diresacusco.gob.pe
VITE_CON_PREFIJO=SI
```

```bash
cd /var/www/convenio/Frontend && npm run build
```

En `deploy/.env`:

```env
CORS_ORIGINS=https://indicadores.diresacusco.gob.pe
```

El frontend (`config.ts`) fuerza HTTPS en produccion si la pagina se carga por HTTPS, evitando mixed content aunque `.env` tenga `http://` por error.

Nginx del host redirige HTTP→HTTPS (301) y envia header HSTS (ver `nginx-indicadores-ssl.conf.example`).

### Verificación final

```bash
curl -I https://indicadores.diresacusco.gob.pe/login      # HTML Vite, no PHP
curl -I https://indicadores.diresacusco.gob.pe/api/docs   # 200 FastAPI
echo | openssl s_client -connect indicadores.diresacusco.gob.pe:443 -servername indicadores.diresacusco.gob.pe 2>/dev/null | openssl x509 -noout -subject
# subject=CN = indicadores.diresacusco.gob.pe
```

## Checklist

1. DNS `indicadores.diresacusco.gob.pe` → IP pública de **este** servidor
2. Certificado Let's Encrypt para `indicadores.diresacusco.gob.pe`
3. `deploy/.env` con credenciales SQL y `SECRET_KEY`
4. `Frontend/.env` con `https://indicadores.diresacusco.gob.pe` y `VITE_CON_PREFIJO=SI`
5. `npm run build` sin errores
6. `docker compose ps` → `indicadores-front` e `indicadores-api` **Up** en `127.0.0.1:8082`
7. nginx: `include convenio-proxy.conf` **antes** de `location /`
8. `certbot renew --dry-run` sin errores
9. https://indicadores.diresacusco.gob.pe/login y `/api/docs` responden
