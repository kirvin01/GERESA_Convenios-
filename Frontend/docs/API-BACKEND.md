# Contrato HTTP esperado del backend

El frontend consume una API REST. Esta documentación resume los endpoints referenciados en el código. La implementación real vive en el repositorio del backend (FastAPI u otro stack).

**Base URL:** valor de `API_CONFIG.baseURL` en `src/config.ts`.

**Autenticación:** header `Authorization: Bearer <access_token>` en todas las rutas excepto login.

---

## Autenticación

### `POST /login`

| Campo (body, form-urlencoded) | Valor |
|------------------------------|--------|
| `username` | Usuario |
| `password` | Contraseña |
| `grant_type` | `password` |

**Respuesta exitosa (200):**

```json
{
  "access_token": "<JWT>",
  "token_type": "bearer"
}
```

**Errores:** JSON con campo `detail` (mensaje mostrado en pantalla de login).

**JWT esperado (payload decodificado en cliente):**

| Claim | Uso en frontend |
|-------|-----------------|
| `sub` | Nombre de usuario mostrado en header |
| `role` | `admin` habilita menú de reportes y ruta `/admin/usuarios` |

---

## Pacientes y atenciones

### `GET /paciente?ndoc={documento}`

Búsqueda de pacientes por número de documento.

**Respuesta esperada:**

```json
{
  "result": [
    {
      "Abrev_Tipo_Doc": "DNI",
      "Numero_Documento": "...",
      "Fecha_Nacimiento": "...",
      "Genero": "...",
      "EDAD": 0
    }
  ]
}
```

### `GET /atenciones?anio={n}&mes={n}&ndoc={documento}`

Historial de atenciones del paciente en el periodo indicado.

**Respuesta esperada:**

```json
{
  "result": [
    {
      "N": "...",
      "Id_Cita": "...",
      "F_ATENCION": "...",
      "Codigo_Item": "...",
      "Descripcion_Item": "...",
      "LAB1": "...",
      "LAB2": "...",
      "LAB3": "...",
      "F_REGISTRO": "...",
      "F_MODIFICACION": null,
      "ESTABLECIMIENTO": "...",
      "DISTRITO | PROVINCIA": "...",
      "SISTEMA": null,
      "REGISTRADOR": "..."
    }
  ]
}
```

---

## Usuarios (administración)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/usuarios` | Lista usuarios (`{ users: [...] }` o array directo) |
| `POST` | `/usuarios?username=&password=&role=` | Crear usuario |
| `PUT` | `/usuarios/{id}?username=&password=&role=` | Actualizar |
| `DELETE` | `/usuarios/{id}` | Eliminar |

**Modelo de usuario:**

```json
{
  "id": 1,
  "username": "usuario",
  "role": "user"
}
```

Roles usados: `admin`, `user`.

---

## Configuración FED

### `GET /config/fed/all`

Metadatos de fuentes de datos para reportes.

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fuente": "HISMINSA",
      "fecha": "2026-01-15",
      "fecha_formateada": "15/01/2026"
    }
  ],
  "total": 1
}
```

---

## Reportes FED — patrón común

La mayoría de indicadores bajo `/fed/{codigo}` exponen:

| Endpoint | Descripción |
|----------|-------------|
| `GET /fed/{codigo}/filtros` | Años, meses, departamentos, provincias, redes, microredes, categorías |
| `GET /fed/{codigo}/tabla-completa?anio=&mes=&...` | Vista territorial (provincias + distritos) + total |
| `GET /fed/{codigo}/tabla-redes?anio=&mes=&...` | Vista por red / microred / establecimiento + total |
| `GET /fed/{codigo}/resumen?anio=&...` | Serie mensual para gráficos (`{ data: [...] }`) |

Parámetros de query opcionales habituales: `departamento`, `provincia`, `red`, `microred`, `categoria`.

**Campos numéricos típicos en filas:** `denominador`, `numerador`, `avance_pct`.

### Prefijos `/fed/` por servicio

| Código servicio | Base path |
|-----------------|-----------|
| MC-01.01 | `/fed/mc0101` |
| MC-02.01 | `/fed/mc0201` |
| MC-03.01 | `/fed/mc0301` |
| SI-01.01 | `/fed/si0101` |
| SI-01.02 | `/fed/si0102` |
| SI-01.03 | `/fed/si0103` |
| SI-02.01 | `/fed/si0201` |
| SI-02.02 | `/fed/si0202` |
| SI-02.03 | `/fed/si0203` |
| SI-02.04 | `/fed/si0204` |
| SI-03.01 | `/fed/si0301` |
| SI-03.02 | `/fed/si0302` |
| VI-01.01 | `/fed/vi0101` |
| VI-01.02 | `/fed/vi0102` |
| Variación diaria | `/fed/his-diario` |
| Oportunidad y modificaciones | `/fed/oportunidad-modificaciones` |

Algunos indicadores (p. ej. VI-01.02) añaden métodos extra como `getResumenUnidadesEjecutoras`; revise el archivo `*Service.ts` correspondiente para la lista exacta.

### Endpoints especiales

**Historial diario** (`hisDiarioService`):

- `GET /fed/his-diario/filtros`
- Endpoints adicionales definidos en `hisDiarioService.ts` (resumen mensual, tablas diarias).

**Oportunidad y modificaciones** (`oportunidad_modificaciones.ts`):

- `GET /fed/oportunidad-modificaciones/filtros`
- `GET /fed/oportunidad-modificaciones/...` (resumen mensual y detalle según implementación del servicio).

---

## Reportes CG

### `GET /cg/cg10/...`

Servicio: `cgCG10Service.ts` — base `${baseURL}/cg/cg10`.

Sigue patrones similares a FED (filtros + tablas). Consulte el servicio para rutas exactas añadidas para Salud Bucal.

---

## Códigos de estado HTTP

| Código | Comportamiento en frontend |
|--------|---------------------------|
| `200` | Procesa JSON |
| `401` | Mensaje "Sesión expirada" o alerta en admin usuarios |
| Otros | Lee `detail` del JSON si existe; si no, mensaje genérico |

---

## CORS

En desarrollo, el frontend suele ejecutarse en `http://localhost:5173` y el API en otro host/puerto. El backend debe incluir el origen del frontend en `Access-Control-Allow-Origin` y permitir el header `Authorization`.

---

## Mantenimiento de esta documentación

Al agregar un endpoint en un `*Service.ts`, actualice la tabla de prefijos `/fed/` en este archivo y la fila correspondiente en [MODULOS-Y-RUTAS.md](./MODULOS-Y-RUTAS.md).
