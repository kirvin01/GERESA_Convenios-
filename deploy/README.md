# Despliegue en Ubuntu (Docker + nginx)

Guía para publicar GERESA Convenios en el servidor de producción con Docker Compose.

## Requisitos en el servidor

- Ubuntu con Docker y Docker Compose v2
- Node.js 20+ (solo para `npm run build` del frontend)
- Acceso de red a SQL Server en `172.16.20.5:1433`
- Puerto **8082** libre en el host (puerto 80 por defecto suele estar ocupado)

## Estructura

| Componente | Descripción |
|------------|-------------|
| `api` | Contenedor FastAPI (uvicorn :8000 interno, ODBC 18) |
| `nginx` | Estáticos (`Frontend/dist`) + proxy `/api/` → `api:8000` en puerto **8082** |

> La API **no** expone el puerto 8000 al host (evita conflicto con otros contenedores como `geresapi`). Solo nginx es accesible desde fuera.

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

Edite credenciales reales de SQL Server, `SECRET_KEY` y, si hace falta, `NGINX_PORT`.

Para el build del frontend:

```bash
cp Frontend/.env.example Frontend/.env
nano Frontend/.env
```

Valores de producción (ajuste IP o dominio):

```env
VITE_API_URL=http://38.210.173.253:8082
VITE_CON_PREFIJO=SI
```

> **Importante:** `VITE_*` se embeben en el build. Tras cambiar `Frontend/.env` debe ejecutar `npm run build` de nuevo.

### 3. Compilar el frontend

```bash
cd Frontend
npm install
npm run build
cd ..
```

Verifique que exista `Frontend/dist/index.html`.

### 4. Levantar contenedores

Desde la carpeta `deploy/`:

```bash
cd deploy
docker compose up -d --build
docker compose ps
```

Debe ver `deploy-api-1` y `deploy-nginx-1` en estado **Up**, con nginx en `0.0.0.0:8082->80/tcp`.

### 5. Verificar

- Frontend: http://38.210.173.253:8082
- API (vía proxy): http://38.210.173.253:8082/api/docs
- Logs API: `docker compose logs -f api`

## Actualizar tras cambios en el código

```bash
cd /var/www/convenio
git pull origin main

# Si hubo cambios en Frontend:
cd Frontend && npm run build && cd ..

# Si hubo cambios en Backend o deploy:
cd deploy
docker compose up -d --build
```

## Solución de problemas

### `env file deploy/.env not found`

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
```

### `failed to bind host port ...:80/tcp: address already in use`

El puerto 80 del host está ocupado (nginx/apache del sistema u otro servicio). Este proyecto usa **8082** por defecto. Confirme en `deploy/.env`:

```env
NGINX_PORT=8082
```

Si 8082 también está ocupado, elija otro libre (ej. `8090`) y actualice `VITE_API_URL` en el frontend antes de `npm run build`.

Ver qué usa un puerto:

```bash
sudo ss -tlnp | grep ':80'
sudo ss -tlnp | grep ':8082'
```

### `deploy-nginx-1` en Created pero no Up

Suele ser conflicto de puerto. Corrija `NGINX_PORT` y ejecute:

```bash
docker compose up -d
```

### Frontend en blanco o 404

Falta el build:

```bash
cd Frontend && npm run build
cd ../deploy && docker compose up -d
```

### Error de conexión a SQL Server

Desde el servidor:

```bash
nc -zv 172.16.20.5 1433
docker compose logs api
```

Revise `DB_HOST`, `DB_USER` y `DB_PASSWORD` en `deploy/.env`.

## Notas

- **Plantillas PDF**: el volumen monta `Backend/Plantillas/` en el contenedor `api`.
- **SQL Server**: el contenedor `api` debe poder alcanzar `172.16.20.5:1433` (firewall del host y de SQL Server).
- **Puerto 80 libre**: si prefiere usar el 80, ponga `NGINX_PORT=80` en `deploy/.env` (detenga antes el servicio que lo ocupe).
- **HTTPS / dominio sin puerto**: configure nginx del host como proxy inverso hacia `http://127.0.0.1:8082`.
- **HTTPS (opcional)**: certificados Let's Encrypt con un proxy adicional o ampliar `nginx.conf` con bloque `listen 443 ssl`.

## Checklist antes de cada despliegue

1. `cp deploy/.env.example deploy/.env` en servidor nuevo (solo la primera vez)
2. `npm run build` sin errores
3. `Frontend/.env` con `VITE_CON_PREFIJO=SI` y URL con puerto (`:8082`)
4. `deploy/.env` con `DB_HOST`, credenciales y `NGINX_PORT=8082`
5. `docker compose up -d --build` y ambos contenedores en **Up**
