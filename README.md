## Condominio App

Aplicación web para la gestión administrativa de un condominio (15 propietarios y 1 administrador).

Incluye:
- Backend: Node.js + Express + PostgreSQL + Prisma
- Frontend: React + Vite

### 1. Requisitos previos

- Node.js instalado (v18+ recomendado).
- NPM.
- Prisma CLI (se instala como devDependency).

### 2. Backend

Ruta: `backend`

#### 2.1 Variables de entorno

Editar `backend/.env` y revisar:

- `DATABASE_URL` y `SHADOW_DATABASE_URL`: URL de conexión a PostgreSQL (las que creó `prisma dev` funcionan en local).
- `PORT`: puerto del backend (por defecto `4000`).
- `JWT_SECRET`: clave secreta para firmar los tokens JWT (cámbiala por una segura).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: datos de tu servidor de correo.

#### 2.2 Migraciones de base de datos

En una terminal:

```bash
cd backend
npx prisma dev --name init
```

Esto levanta una instancia local de PostgreSQL y aplica el esquema definido en `prisma/schema.prisma`.

#### 2.3 Ejecutar backend

```bash
cd backend
npm run dev
```

El API quedará disponible en `http://localhost:4000/api`.

Rutas principales:
- `POST /api/auth/register`: crear usuario (admin o propietario).
- `POST /api/auth/login`: login, devuelve JWT.
- `GET /api/payments/my`: pagos del propietario autenticado.
- `POST /api/payments`: registrar pago de propietario (envía correo).
- `GET /api/payments`: listar pagos (admin).
- `GET /api/expenses/latest`: últimos gastos (admin).
- `POST /api/expenses`: crear gasto (admin, envía correo).
- `GET /api/reports/summary`: resumen de ingresos/egresos.
- `GET /api/reports/pending-owners`: propietarios con pagos pendientes.
- `GET /api/reports/export-excel`: exporta ingresos y egresos a Excel.

### 3. Frontend

Ruta: `frontend`

#### 3.1 Variables de entorno

Crear archivo `frontend/.env` (si lo deseas) con:

```bash
VITE_API_URL=http://localhost:4000/api
```

Si no se define, por defecto el frontend usará `http://localhost:4000/api`.

#### 3.2 Ejecutar frontend

```bash
cd frontend
npm run dev
```

Abre la URL que muestre Vite (por defecto `http://localhost:5173`).

### 4. Flujo básico

1. Crear un usuario administrador con `POST /api/auth/register` (por ejemplo usando Postman o curl).
2. Iniciar sesión desde el frontend (pantalla de login).
3. Como propietario:
   - Registrar pagos en `/api/payments` (desde el frontend se puede ir ampliando la UI).
4. Como administrador:
   - Registrar gastos en `/api/expenses`.
   - Ver últimos gastos y resumen en `/api/reports/*`.
   - Exportar ingresos y egresos a Excel con `/api/reports/export-excel`.

Sobre esta base se pueden ir añadiendo:
- Vistas separadas para administrador y propietario.
- Tablas detalladas de pagos, gastos y propietarios con pagos pendientes.
- Mejoras de UI/UX y controles adicionales de validación.

