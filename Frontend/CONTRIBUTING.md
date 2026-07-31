# Guía de contribución

Gracias por colaborar en el Sistema de Historial de Atenciones. Esta guía ayuda a mantener el código consistente y fácil de revisar.

---

## Antes de empezar

1. Lea el [README.md](../README.md) y [docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md).
2. Copie `Frontend/.env.example` a `Frontend/.env` y configure `VITE_API_URL` y `VITE_CON_PREFIJO`.
3. Ejecute `npm install` y `npm run dev` (o `npm run dev:host` para acceso en red local).
4. Asegúrese de tener credenciales de prueba (`user` y `admin`) en el backend.

---

## Flujo de trabajo con Git

```bash
git checkout -b feature/descripcion-corta
# ... cambios ...
npm run build    # debe compilar sin errores de TypeScript
git add .
git commit -m "Descripción clara del cambio en español o inglés"
git push origin feature/descripcion-corta
```

Abra un Pull Request hacia la rama principal acordada por el equipo.

---

## Convenciones de código

### TypeScript / React

- Componentes de página y layout en **PascalCase** (`FedSI0101Page.tsx`).
- Servicios exportan un objeto `fedXXService` o funciones nombradas en **camelCase**.
- Prefiera **interfaces** para modelos de API en el archivo del servicio que los consume.
- Evite `any`; use `unknown` y narrowing en bloques `catch`.
- No deje `console.log` en commits de producción salvo depuración temporal.

### Estilos

- Use el sistema de estilos de **MUI** (`sx`, tema en `src/theme/index.ts`).
- Mantenga la paleta institucional (azul `#1565C0`) salvo requerimiento explícito.
- Textos de UI en **español**.

### Llamadas al API

- Siempre incluya `authHeader()` en peticiones autenticadas.
- Propague `AbortSignal` en `useEffect` cuando el usuario cambie filtros con frecuencia.
- Centralice nuevas llamadas en archivos bajo `src/services/`, no en páginas de más de 500 líneas sin necesidad.

---

## Añadir un nuevo reporte

Checklist:

- [ ] Servicio en `src/services/servicesFED/` o `servicesCG/`
- [ ] Página en `src/pages/FED/` o `pages/CG/`
- [ ] Ruta en `src/App.tsx`
- [ ] Entrada en `navItems` de `Sidebar.tsx`
- [ ] Documentación en `docs/MODULOS-Y-RUTAS.md` y `docs/API-BACKEND.md`
- [ ] `npm run build` sin errores

Puede usar `FedSI0101Page.tsx` + `fedSI0101Service.ts` como plantilla.

---

## Configuración (variables de entorno)

La URL del API se define en `Frontend/.env` (plantilla: `.env.example`):

```
VITE_API_URL=http://192.168.1.254:8000
VITE_CON_PREFIJO=NO
```

`src/config.ts` lee esas variables en tiempo de build; no hace falta editarlo. Tras cambiar `.env`, reinicie `npm run dev` o ejecute `npm run build`.

---

## Calidad antes del merge

| Verificación | Comando |
|--------------|---------|
| Compilación TypeScript + build | `npm run build` |
| Prueba manual login | Usuario válido en API |
| Prueba rol admin | Menú FED/CG visible |
| Prueba consulta paciente | Documento con datos en QA |

No hay suite de tests automatizados en el proyecto actualmente; las pruebas manuales son obligatorias para cambios en reportes y auth.

---

## Reportar problemas

Incluya en el issue o ticket:

- Pasos para reproducir
- Rol de usuario (`admin` / `user`)
- URL del API y versión del frontend
- Captura o mensaje de error de red (pestaña Network del navegador)
- Navegador y versión

---

## Contacto

Consulte con la **Dirección de Estadística, Informática y Telecomunicaciones** de GERESA para acceso al backend, credenciales y despliegue en servidores institucionales.
