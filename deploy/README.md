# Despliegue en Ubuntu (Docker + nginx)

Guía para publicar GERESA Convenios en el servidor de producción con Docker Compose.

## Requisitos en el servidor

- Ubuntu con Docker y Docker Compose v2
- Node.js 20+ (solo para `npm run build` del frontend)
- Acceso de red a SQL Server en `172.16.20.5:1433`
- Dominio apuntando al servidor: `indicadores.diresacusco.gob.pe`

## Estructura

| Componente | Descripción |
|------------|-------------|
| `api` | Contenedor FastAPI (uvicorn :8000, ODBC 18) |
| `nginx` | Estáticos (`Frontend/dist`) + proxy `/api/` → `api:8000` |

## Pasos de despliegue

### 1. Clonar o actualizar el repositorio

```bash
cd /ruta/al/proyecto
git pull origin main
```

### 2. Configurar variables de entorno

```bash
cp deploy/.env.example deploy/.env
# Editar deploy/.env con credenciales reales de SQL Server y SECRET_KEY
```

Para el build del frontend:

```bash
cp Frontend/.env.example Frontend/.env
# Usar valores de PROD:
#   VITE_API_URL=http://indicadores.diresacusco.gob.pe
#   VITE_CON_PREFIJO=SI
```

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
```

### 5. Verificar

- Frontend: http://indicadores.diresacusco.gob.pe
- API (vía proxy): http://indicadores.diresacusco.gob.pe/api/docs
- Logs: `docker compose logs -f api`

## Actualizar tras cambios en el código

```bash
git pull origin main

# Si hubo cambios en Frontend:
cd Frontend && npm run build && cd ..

# Si hubo cambios en Backend o deploy:
cd deploy
docker compose up -d --build
```

## Notas

- **Plantillas PDF**: el volumen monta `Backend/Plantillas/` en el contenedor `api`.
- **SQL Server**: el contenedor `api` debe poder alcanzar `172.16.20.5:1433` (firewall del host y de SQL Server).
- **HTTPS (opcional)**: puede añadir certificados Let's Encrypt con un proxy adicional o ampliar `nginx.conf` con bloque `listen 443 ssl`. No está incluido en esta configuración base.

## Checklist antes de cada despliegue

1. `npm run build` sin errores
2. `Frontend/.env` con `VITE_CON_PREFIJO=SI` y URL del dominio
3. `deploy/.env` con `DB_HOST=172.16.20.5` y credenciales correctas
4. Reiniciar contenedores tras cambios de API o build nuevo
