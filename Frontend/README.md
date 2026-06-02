# Sistema de Historial de Atenciones — Frontend

Aplicación web para la **Gerencia Regional de Salud (GERESA)** que permite consultar el historial de atenciones de pacientes, administrar usuarios y visualizar reportes estadísticos **FED** (Formato Estadístico de Dispositivos) y **CG** (Convenios de Gestión).

Este repositorio contiene únicamente el **frontend**. La API REST (autenticación, pacientes, reportes) debe estar desplegada por separado y configurada en `src/config.ts`.

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Configuración del backend](#configuración-del-backend)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Autenticación y roles](#autenticación-y-roles)
- [Módulos funcionales](#módulos-funcionales)
- [Documentación adicional](#documentación-adicional)
- [Scripts disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)
- [Solución de problemas](#solución-de-problemas)

---

## Características

| Módulo | Descripción | Acceso |
|--------|-------------|--------|
| **Login** | Autenticación JWT contra la API (`POST /login`) | Público |
| **Consulta de pacientes** | Búsqueda por documento y detalle de atenciones por año/mes | Todos los usuarios autenticados |
| **Administración de usuarios** | CRUD de usuarios y roles (`admin` / `user`) | Solo `admin` |
| **Reportes FED** | Indicadores MC, SI y VI con tablas, filtros y gráficos | Menú visible solo para `admin` |
| **Reportes CG** | Reportes de convenios (p. ej. CG-10 Salud Bucal) | Menú visible solo para `admin` |

---

## Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| [React 18](https://react.dev/) | UI y componentes |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático |
| [Vite 8](https://vite.dev/) | Bundler y servidor de desarrollo |
| [React Router 6](https://reactrouter.com/) | Enrutamiento SPA |
| [Material UI (MUI) 5](https://mui.com/) | Componentes y tema visual |
| [MUI X Data Grid](https://mui.com/x/react-data-grid/) | Tablas de datos (pacientes, atenciones, reportes) |
| [Recharts](https://recharts.org/) | Gráficos en reportes FED |

---

## Requisitos previos

- **Node.js** 18 o superior (recomendado 20 LTS)
- **npm** 9+ (incluido con Node)
- API backend en ejecución y accesible desde el navegador (misma red o CORS configurado)

---

## Instalación y ejecución

```bash
# Clonar el repositorio
git clone https://github.com/kirvin01/convenios.git
cd convenios   # o el nombre de la carpeta local del proyecto

# Instalar dependencias
npm install

# Configurar la URL del API (ver sección siguiente)
# Editar src/config.ts

# Modo desarrollo (http://localhost:5173 por defecto)
npm run dev

# Compilar para producción
npm run build

# Vista previa del build de producción
npm run preview
```

Tras `npm run dev`, abra la URL que muestra Vite en la terminal (normalmente `http://localhost:5173`).

---

## Configuración del backend

La URL base del API se define en **`src/config.ts`**:

```typescript
export const API_CONFIG = {
    baseURL: 'http://192.168.1.14:8000',
};
```

Cambie `baseURL` por la dirección de su instancia del backend (desarrollo, QA o producción). En el mismo archivo hay URLs comentadas como referencia de entornos anteriores.

> **Importante:** El frontend no incluye variables de entorno por defecto. Para no commitear IPs de producción, puede migrar a `import.meta.env.VITE_API_URL` y un archivo `.env.local` (ver [CONTRIBUTING.md](./CONTRIBUTING.md)).

El backend debe exponer al menos:

- `POST /login` — OAuth2 password flow, respuesta `{ access_token }`
- Endpoints protegidos con header `Authorization: Bearer <token>`

Detalle de rutas consumidas: [docs/API-BACKEND.md](./docs/API-BACKEND.md).

---

## Estructura del proyecto

```
atenciones/
├── public/                 # Recursos estáticos (favicon, etc.)
├── src/
│   ├── assets/             # Imágenes y SVG (logo, iconos)
│   ├── components/
│   │   ├── layout/         # AppLayout, Header, Sidebar, Footer
│   │   └── ui/             # Componentes reutilizables (InfoCard, …)
│   ├── hooks/              # useAuth, useApiFetch
│   ├── pages/
│   │   ├── CG/             # Páginas reportes Convenios de Gestión
│   │   ├── FED/            # Páginas reportes FED
│   │   ├── LoginPage.tsx
│   │   ├── PatientsPage.tsx
│   │   └── AdminUsersPage.tsx
│   ├── services/
│   │   ├── apiClient.ts    # Cliente fetch genérico con JWT
│   │   ├── authService.ts  # Login, token, roles
│   │   ├── servicesFED/    # Un servicio por indicador FED
│   │   └── servicesCG/     # Servicios reportes CG
│   ├── theme/              # Tema MUI (colores GERESA)
│   ├── types/              # Interfaces TypeScript compartidas
│   ├── App.tsx             # Rutas y guard de autenticación
│   ├── config.ts           # URL del API
│   └── main.tsx            # Punto de entrada React
├── docs/                   # Documentación técnica extendida
├── index.html
├── package.json
└── tsconfig.json
```

Patrón habitual por reporte FED:

1. **`src/services/servicesFED/fedXXService.ts`** — llamadas HTTP y tipos de respuesta.
2. **`src/pages/FED/FedXXPage.tsx`** — filtros, tablas DataGrid, gráficos Recharts.

---

## Autenticación y roles

1. El usuario envía credenciales a `POST {baseURL}/login` con `application/x-www-form-urlencoded` (`username`, `password`, `grant_type=password`).
2. El token JWT se guarda en `localStorage` bajo la clave `geresa_token`.
3. Las peticiones autenticadas envían `Authorization: Bearer <token>`.
4. El rol se lee del payload JWT (`role === 'admin'`). El nombre de usuario viene de `sub`.

| Rol | Permisos en UI |
|-----|----------------|
| `user` | Consulta de pacientes |
| `admin` | Todo lo anterior + menú Reportes FED/CG + `/admin/usuarios` |

La ruta `/admin/usuarios` redirige a `/pacientes` si el usuario no es administrador. Las rutas de reportes no tienen guard adicional en `App.tsx`; el acceso se controla principalmente desde el menú lateral.

Más detalle: [docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md).

---

## Módulos funcionales

### Consulta de pacientes (`/pacientes`)

- Búsqueda por número de documento → `GET /paciente?ndoc=...`
- Al seleccionar un paciente, carga atenciones por año y mes → `GET /atenciones?anio=&mes=&ndoc=`

### Reportes FED (`/reportesFED/...`)

Indicadores de avance (denominador, numerador, porcentaje) con vistas **territorial** (departamento / provincia / distrito) y **redes** (red / microred / establecimiento). Incluyen reportes especiales:

- **Variación diaria** — `HisDiarioPage`
- **Oportunidad y modificaciones** — `OportunidadModificacionesPage`

Mapa completo ruta ↔ código ↔ servicio: [docs/MODULOS-Y-RUTAS.md](./docs/MODULOS-Y-RUTAS.md).

### Reportes CG (`/reportesCG/...`)

- **CG-10** Salud Bucal — `CG10Page` → servicio `cgCG10Service`

### Administración (`/admin/usuarios`)

- Listado, alta, edición y baja de usuarios vía `/usuarios`.

---

## Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md) | Flujos, capas, autenticación y convenciones de código |
| [docs/MODULOS-Y-RUTAS.md](./docs/MODULOS-Y-RUTAS.md) | Tabla de rutas, páginas y servicios |
| [docs/API-BACKEND.md](./docs/API-BACKEND.md) | Contrato HTTP esperado del backend |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Guía para nuevos desarrolladores y convenciones |

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | `tsc` + build de producción en `dist/` |
| `npm run preview` | Sirve la carpeta `dist/` localmente |

---

## Despliegue

1. Ajuste `baseURL` en `src/config.ts` (o variable de entorno si la implementa).
2. Ejecute `npm run build`.
3. Publique el contenido de **`dist/`** en un servidor web estático (Nginx, IIS, S3, etc.).
4. Configure el servidor para que todas las rutas de la SPA redirijan a `index.html` (history API de React Router).
5. Asegure que el backend permita **CORS** desde el origen del frontend y que use **HTTPS** en producción.

---

## Solución de problemas

| Síntoma | Posible causa | Acción |
|---------|---------------|--------|
| Error de red al iniciar sesión | `baseURL` incorrecta o API caída | Verificar `config.ts` y que el puerto 8000 (u otro) responda |
| `Sesión expirada` | Token inválido o expirado | Cerrar sesión y volver a iniciar sesión |
| Pantalla en blanco tras build | Rutas sin fallback en el servidor | Configurar rewrite a `index.html` |
| Reportes vacíos | Filtros sin datos o backend sin sincronizar FED | Revisar endpoint `/config/fed/all` y logs del API |
| Usuario no ve menú de reportes | Rol distinto de `admin` | Verificar claim `role` en el JWT |

---

## Créditos y área responsable

**Gerencia Regional de Salud** — Dirección de Estadística, Informática y Telecomunicaciones.

Versión mostrada en la aplicación: **v1.0.0** (barra lateral).

---

## Licencia

Consulte con la institución propietaria del código los términos de uso y distribución. Este proyecto es de uso interno institucional salvo indicación contraria.
