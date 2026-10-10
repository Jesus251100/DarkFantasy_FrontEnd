# Conexión FRONTEND → API

Código:

- `conexion.ts` — direcciones del juego y del backend
- `cliente.ts` — todas las peticiones HTTP (login, campaña, tienda)

El navegador llama a `/api/...` en el puerto 5173 (mismo origen).

- Con Docker, nginx (`darkfantasy-web`) reenvía `/api` al contenedor `backend:3001`.
- Con `npm run dev`, Vite reenvía `/api` a `http://127.0.0.1:3001` (`vite.config.ts`).
