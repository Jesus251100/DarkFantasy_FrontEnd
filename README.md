# Dark Fantasy — Frontend

Aplicación web del juego de bingo con temática de fantasía oscura. SPA construida con **Vue 3 + TypeScript + Vite**, con estado reactivo en **Pinia** y navegación en **Vue Router**. Toda la interfaz está en **español**.

Consume la API del backend (`../backend`) en `/api/*`.

## Stack

- Vue 3 (`<script setup>` + Composition API)
- TypeScript
- Vite 8
- Pinia 3 (estado)
- Vue Router 5
- oxlint + ESLint + Prettier (lint/format)
- vue-tsc (type-check)

Node: `^20.19.0 || >=22.12.0`.

## Estructura

```
frontend/
├── src/
│   ├── api/             cliente fetch y conexión al backend
│   ├── application/     casos de uso (orquestan dominio + repositorios)
│   ├── domain/          entidades, value objects, patrones, boosters, bots
│   ├── infrastructure/  repositorios (sessionStorage/localStorage) y clientes HTTP
│   ├── game/            lógica pura del bingo (motor, bots, retratos)
│   ├── composables/     máquina de estado reactiva del juego (runtime)
│   ├── components/      componentes reutilizables (overlays, cards)
│   ├── views/           páginas / pantallas de la SPA
│   ├── stores/          stores Pinia (auth, progress)
│   ├── router/          definición de rutas
│   ├── assets/          imágenes y estilos
│   ├── App.vue          componente raíz
│   └── main.ts          punto de entrada
├── public/              assets estáticos
├── index.html
├── Dockerfile           build de producción servido por nginx
└── nginx.conf           configuración de nginx (sirve la SPA + proxy /api)
```

## Arquitectura

El código sigue arquitectura por capas (clean architecture), separando reglas de negocio de los detalles de infraestructura:

- **`domain/`** — Reglas puras (sin dependencias de Vue ni HTTP): `Campania`, `Jugador`, `Partida`, patrones de victoria, boosters y rivales.
- **`application/`** — Casos de uso que combinan dominio + repositorios: `IniciarSesion`, `CompletarNivelRemoto`, `ComprarBooster`, `SincronizarCampania`, etc.
- **`infrastructure/`** — Implementaciones concretas: repos en `sessionStorage`/`localStorage` y clientes HTTP (`ApiCampaniaCliente`, `ApiAdminCliente`).
- **`api/`** — `cliente.ts` (wrapper de `fetch` con token JWT) y `conexion.ts` (URL base / proxy).
- **`composables/`** — Estado reactivo del gameplay, agnóstico del nivel concreto.
- **`stores/`** — `auth` (sesión) y `progress` (campaña, monedas, niveles).

## Comandos

Todos se ejecutan dentro de `frontend/`:

```sh
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo Vite (http://127.0.0.1:5173)
npm run build        # type-check + build de producción
npm run type-check   # vue-tsc --build
npm run lint         # oxlint --fix + eslint --fix
npm run lint:oxlint  # solo oxlint
npm run lint:eslint  # solo eslint
npm run format       # prettier sobre src/
```

Verificación recomendada antes de commit: `npm run lint && npm run type-check`. No hay suite de tests.

## Conexión con el backend

En desarrollo, Vite reenvía `/api/*` a `http://127.0.0.1:3001` (ver `vite.config.ts`). En producción, nginx hace el proxy a `http://backend:3001` (ver `nginx.conf`).

Variable de entorno (`.env`, opcional):

```
VITE_API_URL=   # vacío = mismo origen + proxy
```

Si defines `VITE_API_URL`, el cliente apunta directamente a esa URL.

## Rutas principales

- Públicas: `/` (home), `/tipo-user`, `/login`, `/login-admin`, `/register`, `/news`.
- Privadas (jugador): `/lobby`, `/inventory`, `/store`, `/levels`, `/achivements`, `/actividad-reciente`, `/level1` … `/level10`.
- Solo administrador: `/dashboard`, `/users`, `/reports`.

El guard de `router/index.ts` redirige a login si no hay sesión y controla el acceso por rol y por nivel desbloqueado.

## Autenticación y persistencia

- Token JWT en `localStorage` bajo `df_token` y usuario en `df_user`.
- La campaña se cachea en `localStorage` y se sincroniza con el backend al iniciar sesión.
- El registro se valida con un código enviado por correo (Mailpit en desarrollo).

## Docker

Desde la raíz del repositorio:

```sh
docker compose up --build   # construye esta app y abre http://127.0.0.1:5173
```
