# Documentación del monorepo GERESA Convenios

## Objetivo

Centralizar documentación factual del proyecto para desarrollo humano y trabajo eficiente con Cursor AI, sin depender solo de la memoria del agente ni de documentación dispersa o desactualizada.

## Alcance

Esta carpeta `docs/` describe:

- Estructura del monorepo (`Frontend/`, `Backend/`, `deploy/`)
- Arquitectura, API, autenticación, bases de datos, variables de entorno
- Módulos FED/CG, despliegue y flujo de desarrollo
- Gaps conocidos (lo que **no** existe o está desalineado)

**Fuera de alcance:** modificar código fuente; inventar flujos no presentes en el repositorio.

## Responsabilidades

| Documento | Responsabilidad |
|-----------|-----------------|
| Este índice | Navegar la documentación y declarar convenciones |
| Documentos numerados | Describir un dominio concreto con evidencia del código |
| `.cursor/rules/` | Reglas permanentes para el agente (no sustituyen esta carpeta) |

## Dependencias

- Código fuente en `Backend/`, `Frontend/`, `deploy/`
- Documentación previa en `README.md` (raíz), `Frontend/docs/`, `Frontend/README.md`, `Frontend/CONTRIBUTING.md`, `deploy/README.md`
- Plantillas `.env.example` en git (`Backend/`, `Frontend/`, `deploy/`) — ver estado en [12-gaps-y-deuda-documental.md](./12-gaps-y-deuda-documental.md)

## Archivos relacionados

| Ruta | Rol |
|------|-----|
| `docs/` | Documentación canónica para Cursor AI (esta carpeta) |
| `.cursor/rules/` | Reglas permanentes del proyecto |
| `README.md` | Resumen operativo del monorepo |
| `Frontend/docs/` | Documentación histórica del frontend (puede estar desfasada) |

## Índice

| # | Documento | Tema |
|---|-----------|------|
| — | **[PROJECT_INDEX.md](./PROJECT_INDEX.md)** | **Punto de entrada:** árbol, stack, módulos, scripts, API, BD, reportes |
| — | **[Arquitectura.md](./Arquitectura.md)** | **Arquitectura:** MVC, capas, flujos Mermaid, controladores/vistas/servicios |
| — | **[Modulos.md](./Modulos.md)** | **Módulos funcionales:** auth, usuarios, pacientes, FED, CG, certificados |
| 01 | [01-vision-y-contexto.md](./01-vision-y-contexto.md) | Qué es el sistema y entornos |
| 02 | [02-arquitectura.md](./02-arquitectura.md) | Capas y flujo general (resumen) |
| 03 | [03-backend.md](./03-backend.md) | FastAPI / estructura Backend |
| 04 | [04-frontend.md](./04-frontend.md) | React / Vite / estructura Frontend |
| 05 | [05-api-endpoints.md](./05-api-endpoints.md) | Inventario de endpoints |
| 06 | [06-autenticacion-y-autorizacion.md](./06-autenticacion-y-autorizacion.md) | JWT y RBAC |
| 07 | [07-base-de-datos.md](./07-base-de-datos.md) | SQL Server multi-base |
| 08 | [08-variables-de-entorno.md](./08-variables-de-entorno.md) | Variables `.env` |
| 09 | [09-modulos-fed-y-cg.md](./09-modulos-fed-y-cg.md) | Reportes FED y CG |
| 10 | [10-despliegue.md](./10-despliegue.md) | Docker + nginx |
| 11 | [11-flujo-de-desarrollo.md](./11-flujo-de-desarrollo.md) | Cómo trabajar en local |
| 12 | [12-gaps-y-deuda-documental.md](./12-gaps-y-deuda-documental.md) | Lo que falta o diverge |

## Convención de cada documento

Todo documento en `docs/` incluye las secciones:

1. Objetivo  
2. Alcance  
3. Responsabilidades  
4. Dependencias  
5. Archivos relacionados  
6. Riesgos  
7. Mejoras posibles  

Cuando un hecho **no** está en el código o docs existentes, se marca explícitamente como **No existe** o **No documentado en el repositorio**.

## Riesgos

- Duplicar o contradecir `Frontend/docs/` si no se mantiene sincronizado.
- Que el agente use solo `Frontend/docs/` (parcialmente desactualizado) y ignore esta carpeta.
- Documentar secretos reales: **prohibido**; solo nombres de variables.

## Mejoras posibles

- Enlazar este índice desde el `README.md` raíz (requiere editar ese archivo; no hecho en esta entrega).
- Añadir diagramas generados desde código cuando haya un generador oficial.
- Marcar fechas de revisión en cada documento.
