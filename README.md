# MediMaint — Gestión de Mantenimiento de Equipos Médicos

Sistema web integral para la gestión de mantenimiento de equipos médicos en entornos clínicos y hospitalarios. Permite llevar control de inventario de equipos, órdenes de trabajo, reportes de fallas, repuestos, mantenimientos preventivos y usuarios — todo sincronizado en la nube vía Supabase.

> **App en producción**: [https://p-wevi877h22eccts5qbdbt.rork.live](https://p-wevi877h22eccts5qbdbt.rork.live)

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Base de datos (Supabase)](#base-de-datos-supabase)
- [Autenticación y roles](#autenticación-y-roles)
- [Auditoría](#auditoría)
- [Informes PDF](#informes-pdf)
- [PWA](#pwa)
- [Scripts disponibles](#scripts-disponibles)
- [Guía de desarrollo](#guía-de-desarrollo)
- [Despliegue](#despliegue)
- [Notas importantes](#notas-importantes)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 18 + Vite 8 |
| Lenguaje | TypeScript 5.8 (strict) |
| Estilos | Tailwind CSS 3.4 + shadcn/ui (Radix UI) |
| Routing | React Router DOM 6 |
| Estado servidor | TanStack React Query 5 |
| Base de datos | Supabase (PostgreSQL) |
| Formularios | React Hook Form + Zod |
| Iconos | Lucide React |
| QR | html5-qrcode + qrcode |
| PDF / Excel | jsPDF + SheetJS (xlsx) |
| PWA | vite-plugin-pwa (Workbox) |
| Testing | Vitest + Testing Library |
| Package manager | Bun |

---

## Requisitos previos

- **Bun** ≥ 1.0 — [instalar](https://bun.sh/)
- **Node.js** ≥ 20 (algunas herramientas de desarrollo pueden requerirlo)
- Acceso a un proyecto de **Supabase** con las tablas creadas (ver [Base de datos](#base-de-datos-supabase))

---

## Instalación y puesta en marcha

```bash
# 1. Clonar el repositorio
git clone https://github.com/Cris27rr/gestor-mantenimiento.git
cd gestor-mantenimiento

# 2. Instalar dependencias
cd web
bun install

# 3. Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase (ver sección siguiente)

# 4. Iniciar servidor de desarrollo
bun run dev
```

La aplicación estará disponible en `http://localhost:8080`.

---

## Variables de entorno

Crear un archivo `web/.env` con las siguientes variables:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Rork (plataforma de despliegue)
EXPO_PUBLIC_RORK_API_BASE_URL=...
EXPO_PUBLIC_RORK_APP_KEY=...
EXPO_PUBLIC_RORK_AUTH_URL=...
EXPO_PUBLIC_RORK_FUNCTIONS_URL=...
EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY=...
EXPO_PUBLIC_TOOLKIT_URL=...
EXPO_PUBLIC_PROJECT_ID=...
EXPO_PUBLIC_TEAM_ID=...
```

> **Nota**: El prefijo `EXPO_PUBLIC_` se usa en lugar de `VITE_` por convención de Rork. Vite está configurado para reconocer ambos prefijos (`envPrefix: ["VITE_", "EXPO_PUBLIC_"]` en `vite.config.ts`).

### Cómo obtener las credenciales de Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings → API**
3. Copiar **Project URL** y **anon public key**

---

## Estructura del proyecto

```
gestor-mantenimiento/
├── web/                          # Aplicación web (Vite + React)
│   ├── public/                   # Assets estáticos (favicon, icono PWA, robots.txt)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # AppLayout, Sidebar, Header
│   │   │   └── ui/              # Componentes shadcn/ui (Button, Dialog, etc.)
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Provider de autenticación
│   │   ├── data/                # Datos seed / mock
│   │   ├── hooks/
│   │   │   └── use-data.ts      # Hooks de React Query para todas las entidades
│   │   ├── integrations/
│   │   │   └── supabase/
│   │   │       └── types.ts     # Tipos autogenerados de Supabase
│   │   ├── lib/
│   │   │   ├── auth/            # Sesión local, demo, fallback offline
│   │   │   ├── audit/           # Logs de auditoría/acceso (localStorage)
│   │   │   ├── db.ts            # Capa de datos Supabase (CRUD + mapeo columnas)
│   │   │   ├── equipmentReport.ts # Generador de informes PDF (jsPDF)
│   │   │   ├── supabase.ts      # Cliente de Supabase
│   │   │   └── utils.ts         # Utilidades (cn, formatadores)
│   │   ├── pages/
│   │   │   ├── equipos/         # EquipmentPage, EquipmentDetailPage, PublicEquipmentPage
│   │   │   ├── ordenes/         # WorkOrdersPage
│   │   │   ├── repuestos/       # SparePartsPage
│   │   │   ├── usuarios/        # UsersPage (avatares, perfiles, reset password)
│   │   │   ├── Dashboard.tsx    # Dashboard con vistas por rol
│   │   │   ├── FallasPage.tsx   # Historial global de fallas + crear OT
│   │   │   ├── AuditoriaPage.tsx# Registro de actividades + export CSV/PDF
│   │   │   ├── MantenimientoPage.tsx # Mantenimientos preventivos + búsqueda
│   │   │   ├── Login.tsx        # Login + acceso demo
│   │   │   ├── QRScannerPage.tsx# Escáner QR + búsqueda autocomplete
│   │   │   └── ...
│   │   ├── types/
│   │   │   └── index.ts         # Tipos TypeScript del dominio
│   │   ├── App.tsx              # Router + providers
│   │   ├── main.tsx             # Entry point + registro de Service Worker
│   │   └── index.css            # Estilos globales (Tailwind)
│   ├── vite.config.ts           # Config Vite + PWA
│   ├── tailwind.config.ts       # Config Tailwind
│   └── package.json
├── backend/
│   └── types.ts                 # Tipos autogenerados de la BD Supabase
├── rork.json                    # Config de la plataforma Rork
└── README.md
```

---

## Arquitectura

### Flujo de datos

```
UI Components
    ↕
React Query hooks (use-data.ts)  — cache, invalidación, optimistic updates
    ↕
db.ts                            — mapeo camelCase ↔ snake_case, queries Supabase
    ↕
supabase.ts                      — cliente Supabase
    ↕
Supabase (PostgreSQL)            — fuente de verdad compartida
```

### Capa de autenticación (dual)

La autenticación usa una arquitectura **intencionalmente dividida**:

| Aspecto | Archivo | Almacenamiento |
|---|---|---|
| **Auth** (login, sesión, lockout, demo) | `lib/auth/*` | `localStorage` del navegador |
| **Datos** (equipos, fallas, OT, etc.) | `db.ts` | Supabase (nube) |

**¿Por qué?** El login verifica credenciales contra la tabla `usuarios` de Supabase, pero la gestión de sesión (token, expiración, bloqueo por intentos) se maneja localmente para no depender de Supabase Auth. Esto permite que el acceso demo funcione sin conexión y que el bloqueo por intentos sea inmediato.

> **Consideración futura**: Migrar la auth a Supabase Auth completamente permitiría sesiones compartidas entre dispositivos. Actualmente la sesión es por dispositivo.

### Mapeo de columnas

Supabase usa `snake_case` y el código TypeScript usa `camelCase`. El archivo `db.ts` contiene funciones `to*` y `from*` para cada entidad que hacen la traducción automáticamente. **Al añadir nuevas columnas a Supabase, actualizar también el mapeo en `db.ts`**.

---

## Base de datos (Supabase)

### Tablas

| Tabla | Descripción |
|---|---|
| `equipos` | Inventario de equipos médicos (con UUID público para QR) |
| `ordenes_trabajo` | Órdenes de trabajo (correctivo, preventivo, calibración) |
| `fallas` | Reportes de fallas de equipos |
| `repuestos` | Inventario de repuestos |
| `repuestos_equipo` | Asignación de repuestos a equipos |
| `movimientos` | Movimientos/traslados de equipos entre ubicaciones |
| `mantenimientos` | Calendarios de mantenimiento preventivo |
| `documentos` | Documentos técnicos asociados a equipos |
| `notificaciones` | Notificaciones de usuarios |
| `usuarios` | Usuarios del sistema (email, password_hash, rol) |

### Esquema

Los tipos autogenerados están en `backend/types.ts` y `web/src/integrations/supabase/types.ts`. Para regenerarlos tras cambios en Supabase, ejecutar las migraciones desde el panel de Supabase.

### RLS (Row Level Security)

Actualmente las queries usan la **anon key** de Supabase. Si se habilita RLS, asegurar que las políticas permitan lectura/escritura con la anon key, o configurar autenticación con Supabase Auth.

---

## Autenticación y roles

### Roles

| Rol | Descripción | Acceso |
|---|---|---|
| `admin` | Administrador | Todas las secciones (incluye gestión de usuarios) |
| `director_departamento` | Director de departamento | Igual que admin excepto gestión de usuarios. Accede a Auditoría |
| `tecnico` | Técnico de mantenimiento | Dashboard, Equipos, Órdenes, Fallas, Mantenimientos, Repuestos, Documentos, QR |
| `clinico` | Personal clínico | Dashboard, Equipos, QR |
| `publico` | Acceso público sin login | Solo página pública del equipo vía QR |

### Credenciales de producción

| Email | Password | Rol |
|---|---|---|
| `cristian98arr@gmail.com` | `123456` | admin |

> ⚠️ **No modificar** esta cuenta. Está exenta del cambio obligatorio de contraseña y del bloqueo por intentos fallidos.

### Acceso demo

Desde la pantalla de login hay un botón **"Acceso Demo"** que crea una sesión temporal de técnico válida por **30 minutos**, sin necesidad de credenciales. Esta sesión es local al dispositivo.

### Políticas de seguridad

- **Bloqueo por intentos**: Tras 5 intentos fallidos, la cuenta se bloquea temporalmente (excepto la cuenta admin principal)
- **Cambio de contraseña**: Se exige cambio de contraseña al primer login (excepto cuenta admin principal)
- **Logs de auditoría**: Se registran logs de acceso (login, logout, intentos fallidos) en `localStorage`
- **Tokens de sesión**: Sesiones con expiración guardadas en `localStorage`

---

## Auditoría

La página de **Auditoría** (`/auditoria`) es accesible por los roles `admin` y `director_departamento`. Proporciona un feed unificado de todas las actividades del sistema.

### Fuentes de datos

| Fuente | Origen | Sincronizada |
|---|---|---|
| Fallas reportadas | Supabase (tabla `fallas`) | Sí — compartida entre dispositivos |
| Órdenes de trabajo | Supabase (tabla `ordenes_trabajo`) | Sí |
| Mantenimientos | Supabase (tabla `mantenimientos`) | Sí |
| Logs de acceso | `localStorage` (`lib/audit/localAuditLogs.ts`) | No — local por dispositivo |
| Logs de auditoría | `localStorage` (`lib/audit/localAuditLogs.ts`) | No — local por dispositivo |

### Funcionalidades

- **Búsqueda** por usuario, equipo o detalle
- **Filtros** por tipo de acción y usuario
- **Estadísticas** con totales por categoría
- **Exportación CSV** (compatible con Excel/Google Sheets, codificación UTF-8)
- **Exportación PDF** (formato landscape A4, con paginación)

> **Nota**: Los logs de acceso y auditoría se almacenan localmente en cada dispositivo. Exportar periódicamente para mantener un respaldo consolidado.

---

## Informes PDF

La generación de informes está en `web/src/lib/equipmentReport.ts` y se invoca desde el diálogo "Generar Informe" en la página de detalle de un equipo (`EquipmentDetailPage.tsx`).

### Características

- Formato A4 con branding teal y paginación automática
- Información del equipo + línea de tiempo unificada de eventos
- Firma personalizada con datos del usuario actual (nombre, email, rol, avatar)
- **Selección individual de items**: cada categoría (órdenes, fallas, mantenimientos, traslados) se puede activar/desactivar, y dentro de cada una se pueden marcar items individuales con checkboxes
- **Botón "Seleccionar todas / Quitar todas"** por categoría
- Si no se selecciona ningún item dentro de una categoría activa, se incluyen todos automáticamente
- **Campo de Notas / Memorándum** opcional para añadir texto libre antes de la firma

---

## PWA

La aplicación es una **Progressive Web App** configurada con `vite-plugin-pwa`:

| Recurso | Estrategia de cache | Razón |
|---|---|---|
| HTML / Navegación | `NetworkFirst` (timeout 3s) | Siempre latest, fallback a cache |
| JS / CSS | `NetworkFirst` (timeout 5s) | Nuevas versiones se cargan inmediatamente, fallback a cache si offline |
| Imágenes | `CacheFirst` (30 días) | Raramente cambian |
| **Supabase API** | `NetworkOnly` | **Nunca cache** — datos siempre frescos |

El service worker se auto-actualiza (`registerType: "autoUpdate"`, `skipWaiting: true`, `clientsClaim: true`). Además, `main.tsx` registra un listener `updatefound` que detecta nuevas versiones cada 30 segundos, envía `SKIP_WAITING` al SW instalado y fuerza una recarga automática al activarse la nueva versión.

> Si tras un despliegue no se ven cambios, hacer un hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) o desregistrar el service worker desde DevTools → Application → Service Workers.

### Headers de seguridad

Configurados en `vite.config.ts` y `index.html`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Content-Security-Policy

---

## Scripts disponibles

```bash
bun run dev          # Servidor de desarrollo (puerto 8080)
bun run build        # Build de producción → dist/
bun run build:dev    # Build en modo development (sin minificar)
bun run preview      # Previsualizar build de producción
bun run lint         # ESLint
bun run test         # Tests con Vitest (una sola ejecución)
bun run test:watch   # Tests con Vitest en modo watch
```

---

## Guía de desarrollo

### Añadir una nueva entidad

1. **Supabase**: Crear la tabla con sus columnas en `snake_case`
2. **Tipos**: Añadir la interfaz TypeScript en `web/src/types/index.ts`
3. **Mapeo**: Añadir funciones `to*` y `from*` en `web/src/lib/db.ts`
4. **API**: Añadir los métodos CRUD al objeto `db` en `db.ts`
5. **Hooks**: Crear hooks de React Query en `web/src/hooks/use-data.ts`
6. **Página**: Crear el componente de página en `web/src/pages/`
7. **Ruta**: Añadir la ruta en `web/src/App.tsx`
8. **Navegación**: Añadir el item en `web/src/components/layout/Sidebar.tsx`

### Añadir un nuevo rol

1. Añadir el rol al tipo `UserRole` en `web/src/types/index.ts`
2. Actualizar `navItems` en `Sidebar.tsx` con los permisos del nuevo rol
3. Actualizar `Dashboard.tsx` con la vista correspondiente al nuevo rol
4. Actualizar `roleLabels`, `roleIcons`, `roleColors` y el `<SelectItem>` en `UsersPage.tsx`
5. Actualizar filtros `hasRole` en `FallasPage.tsx`, `WorkOrdersPage.tsx` y `PublicEquipmentPage.tsx` si el rol debe ver/crear OT o fallas
6. Actualizar `rolLabels` en `equipmentReport.ts` para que el PDF muestre el nombre del rol correctamente

### Modificar el mapeo de columnas

Cuando se añade una columna a una tabla de Supabase:

1. Actualizar `backend/types.ts` (regenerar desde Supabase)
2. Añadir el campo a la interfaz en `web/src/types/index.ts`
3. Añadir el mapeo en la función `to*` (snake_case → camelCase) en `db.ts`
4. Añadir el mapeo en la función `from*` (camelCase → snake_case) en `db.ts`
5. Añadir el campo en los métodos `create` del objeto `db`

### React Query — buenas prácticas

- Usar `setQueryData` para actualizaciones optimistas además de `invalidateQueries`
- Las queries de `fallas` tienen `staleTime: 0` y `refetchOnWindowFocus: true` para máxima frescura
- Usar `enabled: !!id` en queries que dependen de un parámetro opcional

### Estilo de código

- **TypeScript strict**: Tipos explícitos en todos los `useState`, `useQuery`, etc.
- **Imports**: Usar el alias `@/` (configurado en `vite.config.ts` y `tsconfig.json`)
- **Componentes**: shadcn/ui en `src/components/ui/` — no modificar, son autogenerados
- **Iconos**: Usar `lucide-react`
- **Formularios**: `react-hook-form` + `zod` para validación
- **No usar** `npm` ni `yarn` — siempre `bun`

---

## Despliegue

### Rork (despliegue automático)

La aplicación se despliega automáticamente a través de Rork. Cada cambio en el código se sincroniza con el repositorio interno de Rork y se publica en:

```
https://p-wevi877h22eccts5qbdbt.rork.live
```

### Despliegue manual (Vercel, Netlify, etc.)

```bash
cd web
bun run build
# El directorio dist/ contiene los archivos estáticos listos para servir
```

**Notas para hosting estático**:
- Configurar redirección SPA: todas las rutas → `index.html` (React Router usa client-side routing)
- Las variables de entorno deben estar en el entorno de build (prefijo `EXPO_PUBLIC_` o `VITE_`)

---

## Notas importantes

1. **No borrar ni modificar** la cuenta `cristian98arr@gmail.com` — es la cuenta admin principal y está exenta de políticas de seguridad
2. **No cambiar** el prefijo de variables de entorno de `EXPO_PUBLIC_` a `VITE_` sin actualizar `vite.config.ts`
3. **La auth local** vive en `web/src/lib/auth/` y `web/src/lib/audit/` — no migrar a Supabase Auth sin un plan de transición de sesiones
4. **El cache de Supabase es `NetworkOnly`** en la PWA — no cambiar o los datos podrían quedar desactualizados
5. **Los tipos en `backend/types.ts`** son autogenerados — no editar manualmente
6. **Los componentes en `web/src/components/ui/`** son de shadcn/ui — no editar, regenerar con la CLI si se necesita personalizar
7. **La página de Auditoría** combina datos de Supabase (fallas, órdenes, mantenimientos) con logs locales (`localStorage`) — los logs de acceso/auditoría no se sincronizan entre dispositivos
8. **Los informes PDF** (`equipmentReport.ts`) permiten selección individual de items — un array vacío incluye todos, un array con IDs incluye solo los seleccionados

---

## Licencia

Proyecto privado. Todos los derechos reservados.
