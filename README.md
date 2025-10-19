# Backend API

API REST en Node.js/Express + TypeScript + TypeORM (MySQL). Autenticación JWT.

## Inicio rápido (Docker)
- Requisitos: `Docker Desktop` instalado y corriendo.
- Copia `.env.example` a `.env` (opcional para local). Con Docker se usan los valores del `docker-compose.yml`.
- Levantar servicios (API + DB):
```
docker compose up -d --build
```
- Salud de la API:
```
curl http://localhost:3000/api/v1/health
```
- Sembrar datos de desarrollo (crea admin y datos ficticios):
```
# por defecto
docker compose exec api node dist/seeds/dev-seed.js

# personalizado (ejemplos)
docker compose exec -e SEED_RESET=1 -e SEED_ORDERS=5000 api node dist/seeds/dev-seed.js
```
- Logs:
```
docker compose logs api --tail=50
```
- Parar todo:
```
docker compose down
```

## Frontend (Angular)
- Requisitos: `Node 18+`.
- Arrancar en modo desarrollo (puerto `http://localhost:4200`):
```
npm install
npm run start
```
- Login de prueba (del seed): `admin@example.com / admin123`.
- Si cambias el puerto del frontend, ajusta `CORS_ORIGIN` en el backend (`http://localhost:<PUERTO>`).

## Inicio local del backend (sin Docker)
- Requisitos: `Node 18+`, `MySQL` local.
- Copia `.env.example` a `.env` y configura:
  - Sin DB: `DB_ENABLED=false`.
  - Con DB: `DB_ENABLED=true`, `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Instala dependencias:
```
npm install
```
- Ejecuta el seed de desarrollo:
```
# valores por defecto
npm run seed:dev

# personalizado
# Linux/macOS
SEED_RESET=1 SEED_CUSTOMERS=100 SEED_PRODUCTS=200 SEED_ORDERS=10000 SEED_MONTHS=6 npm run seed:dev
# Windows PowerShell
echo "Usa variables de entorno en PowerShell";
$env:SEED_RESET='1'; $env:SEED_CUSTOMERS='100'; $env:SEED_PRODUCTS='200'; $env:SEED_ORDERS='10000'; $env:SEED_MONTHS='6'; npm run seed:dev
```
- Arranca el backend:
```
npm run dev
```
- Healthcheck:
```
curl http://localhost:3000/api/v1/health
```

## Seed (nuevo)
El script `src/seeds/dev-seed.ts` crea datos representativos y, si no existe, un usuario admin:
- Admin por defecto: `admin@example.com / admin123`.
- Variables de control (con valores por defecto):
  - `SEED_RESET` (false): elimina datos antes de sembrar.
  - `SEED_CUSTOMERS` (100): número de clientes.
  - `SEED_PRODUCTS` (200): número de productos.
  - `SEED_ORDERS` (10000): número de órdenes.
  - `SEED_MONTHS` (6): ventana temporal hacia atrás.
  - `SEED_BATCH` (500, min 50): tamaño de lote para inserciones.
  - `SEED_RANDOM` (timestamp): semilla del RNG para reproducibilidad.

## Pruebas
- Ejecutar unitarios/integración:
```
npm test
```
- Modo watch:
```
npm run test:watch
```

## Endpoints de verificación
- Salud: `GET /api/v1/health` → `{ data: { status: "ok" } }`.
- Login: `POST /api/v1/auth/login` con `{ email, password }`.
- Usuario actual: `GET /api/v1/users/me` con `Authorization: Bearer <TOKEN>`.

## Scripts útiles
- Desarrollo: `npm run dev`
- Build TypeScript: `npm run build`
- Arranque producción (tras build): `npm run start`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint` / `npm run lint:fix`
- Formateo: `npm run format`

## Notas
- API: `http://localhost:3000`.
- En Docker, la API espera a que `db` esté sana antes de conectar.
- CORS por defecto: `http://localhost:4200` (frontend dev).
- Usuario de prueba: `admin@example.com / admin123`.