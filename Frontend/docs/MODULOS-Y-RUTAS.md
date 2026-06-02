# Módulos, rutas y correspondencia de archivos

Referencia rápida para localizar pantallas y servicios en el código.

---

## Rutas de la aplicación

| Ruta | Componente | Servicio principal | Menú (Sidebar) | Solo admin |
|------|------------|-------------------|----------------|------------|
| `/login` | `LoginPage` | `authService` | — | No |
| `/pacientes` | `PatientsPage` | fetch directo | Consulta Pacientes | No |
| `/admin/usuarios` | `AdminUsersPage` | fetch → `/usuarios` | Admin Usuarios | Sí (guard en ruta) |
| `/reportesFED/fed01` | `FedMC0101Page` | `fedMC0101Service` | MC-01.01 | Menú admin |
| `/reportesFED/fed02` | `FedMC0201Page` | `fedMC0201Service` | MC-02.01 | Menú admin |
| `/reportesFED/fed03` | `FedMC0301Page` | `fedMC0301Service` | MC-03.01 | Menú admin |
| `/reportesFED/fed04` | `FedSI0101Page` | `fedSI0101Service` | SI-01.01 | Menú admin |
| `/reportesFED/fed05` | `FedSI0102Page` | `fedSI0102Service` | SI-01.02 | Menú admin |
| `/reportesFED/fed06` | `FedSI0103Page` | `fedSI0103Service` | SI-01.03 | Menú admin |
| `/reportesFED/fed07` | `FedSI0201Page` | `fedSI0201Service` | SI-02.01 | Menú admin |
| `/reportesFED/fed08` | `FedSI0202Page` | `fedSI0202Service` | SI-02.02 | Menú admin |
| `/reportesFED/fed09` | `FedSI0203Page` | `fedSI0203Service` | SI-02.03 | Menú admin |
| `/reportesFED/fed10` | `FedSI0204Page` | `fedSI0204Service` | SI-02.04 | Menú admin |
| `/reportesFED/fed11` | `FedSI0301Page` | `fedSI0301Service` | SI-03.01 | Menú admin |
| `/reportesFED/fed12` | `FedSI0302Page` | `fedSI0302Service` | SI-03.02 | Menú admin |
| `/reportesFED/fed13` | `FedVI0101Page` | `fedVI0101Service` | VI-01.01 | Menú admin |
| `/reportesFED/fed14` | `FedVI0102Page` | `fedVI0102Service` | VI-01.02 | Menú admin |
| `/reportesFED/fed015` | `HisDiarioPage` | `hisDiarioService` | Variación Diaria | Menú admin |
| `/reportesFED/fed016` | `OportunidadModificacionesPage` | `oportunidad_modificaciones` | Oportunidad y Modificaciones | Menú admin |
| `/reportesCG/cg10` | `CG10Page` | `cgCG10Service` | CG-10 Salud Bucal | Menú admin |
| `/reportesCG/cg11` | `CG10Page` | `cgCG10Service` | CG-11 | Menú admin |
| `/` | — | — | Redirige a `/pacientes` | — |

> **Nota:** Las rutas `fed015` y `fed016` usan tres dígitos en la URL (`fed01`–`fed14` usan dos). `cg10` y `cg11` comparten el mismo componente `CG10Page`; verifique con el backend si CG-11 requiere parámetros distintos.

---

## Clasificación de indicadores FED

| Prefijo | Significado (contexto GERESA) | Ejemplos en la app |
|---------|------------------------------|-------------------|
| **MC** | Indicadores MC (serie 01–03) | MC-01.01, MC-02.01, MC-03.01 |
| **SI** | Salud / indicadores SI (series 01–03) | SI-01.01 … SI-03.02 |
| **VI** | Indicadores VI | VI-01.01, VI-01.02 |
| **Especiales** | Análisis operativos | Historial diario, Oportunidad y modificaciones |

---

## Servicios compartidos

| Archivo | Prefijo API | Uso |
|---------|-------------|-----|
| `configFedService.ts` | `/config/fed` | Fuentes y fechas de datos FED en cabeceras |
| `authService.ts` | `/login` | Token JWT |
| `apiClient.ts` | — | Cliente HTTP genérico (poco usado aún en páginas) |

---

## Archivos clave por funcionalidad

### Consulta pacientes

- **Página:** `src/pages/PatientsPage.tsx`
- **Tipos:** `Paciente`, `Atencion` en `src/types/index.ts`
- **Endpoints:** `GET /paciente`, `GET /atenciones`

### Administración

- **Página:** `src/pages/AdminUsersPage.tsx`
- **Endpoints:** `GET/POST/PUT/DELETE /usuarios`

### Layout y navegación

- **Rutas:** `src/App.tsx`
- **Menú:** `src/components/layout/Sidebar.tsx` — array `navItems`

---

## Convención de nombres

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Servicio FED | `fed{CODIGO}Service.ts` | `fedSI0101Service.ts` |
| Página FED | `Fed{CODIGO}Page.tsx` | `FedSI0101Page.tsx` |
| Ruta corta | `/reportesFED/fedNN` | `/reportesFED/fed04` |
| Base URL servicio | `/fed/{codigo-minúscula}` | `/fed/si0101` |

Los códigos en URL del API usan minúsculas y sin guiones (`si0101`, `mc0201`, `his-diario`, `oportunidad-modificaciones`).
