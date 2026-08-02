# Personal Finance Tracker — Backend

A production-quality REST API for tracking personal income and expenses, built with **Node.js, Express, PostgreSQL, Redis and JWT**. It ships with role-based access control (admin / user / read-only), Redis-cached categories and analytics, chart-ready analytics endpoints, hardened security middleware, and full Swagger documentation.

- **Base URL:** `http://localhost:5000`
- **Swagger docs:** `http://localhost:5000/api/docs`
- **Health check:** `http://localhost:5000/health`

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Install PostgreSQL](#1-install-postgresql)
5. [Install Redis](#2-install-redis)
6. [Create the database](#3-create-the-database)
7. [Run the SQL scripts](#4-run-the-sql-scripts)
8. [Environment variables](#5-environment-variables)
9. [Install dependencies & start](#6-install-dependencies--start-the-backend)
10. [Project structure](#project-structure)
11. [API overview](#api-overview)
12. [Demo accounts](#demo-accounts)
13. [Testing with Postman](#testing-with-postman)
14. [Swagger documentation](#swagger-documentation)
15. [Roles & permissions (RBAC)](#roles--permissions-rbac)
16. [Caching behaviour](#caching-behaviour)
17. [Troubleshooting](#troubleshooting)

---

## Features

- **Authentication** — register, login, JWT-based auth, bcrypt password hashing.
- **RBAC** — three roles (`admin`, `user`, `read-only`) with enforced permissions and ownership checks.
- **Transactions** — full CRUD with search, pagination, sorting, filtering and per-user ownership validation.
- **Categories** — CRUD (admin-managed) with Redis caching (1 hour) and automatic invalidation.
- **Analytics** — total income, total expense, balance, monthly trend, yearly trend, category breakdown and income-vs-expense — all returned in a shape that plugs straight into **Chart.js** or **Recharts**. Cached for 15 minutes.
- **User management** — admin-only list / delete / change-role.
- **Security** — Helmet, CORS, JWT, bcrypt, express-validator, xss-clean, hpp, express-rate-limit. Parameterized SQL everywhere (SQL-injection safe) and input sanitization (XSS safe).
- **Resilience** — if Redis is unavailable the app keeps working by querying PostgreSQL directly instead of crashing.
- **Swagger** — complete interactive API documentation.

## Tech stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Runtime    | Node.js (>= 18)                  |
| Framework  | Express.js                       |
| Database   | PostgreSQL                       |
| Cache      | Redis                            |
| Auth       | JWT (jsonwebtoken) + bcryptjs    |
| Docs       | swagger-jsdoc + swagger-ui-express |

---

## Prerequisites

- **Node.js 18+** and **npm** — check with `node -v` and `npm -v`.
- **PostgreSQL 13+** installed and running locally.
- **Redis 6+** installed and running locally (optional — the app still runs without it).

---

## 1. Install PostgreSQL

**macOS (Homebrew)**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu / Debian**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows** — download the installer from https://www.postgresql.org/download/windows/ and keep the default port `5432`.

Verify:

```bash
psql --version
```

By default there is a `postgres` superuser. To set/confirm its password:

```bash
# Linux/macOS
sudo -u postgres psql
postgres=# ALTER USER postgres WITH PASSWORD 'your_password';
postgres=# \q
```

## 2. Install Redis

**macOS (Homebrew)**

```bash
brew install redis
brew services start redis
```

**Ubuntu / Debian**

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows** — use WSL2 and follow the Ubuntu steps, or run Redis via [Memurai](https://www.memurai.com/).

Verify Redis is up (should print `PONG`):

```bash
redis-cli ping
```

> Redis is **optional**. If it is not running, the API logs a warning at startup and serves every request directly from PostgreSQL.

## 3. Create the database

```bash
# Using the postgres role
createdb -U postgres finance_tracker
```

Or from inside `psql`:

```sql
CREATE DATABASE finance_tracker;
```

## 4. Run the SQL scripts

Run them **in this order**: `schema.sql` → `indexes.sql` → `seed.sql`.

**Option A — with the `psql` CLI**

```bash
psql -U postgres -d finance_tracker -f database/schema.sql
psql -U postgres -d finance_tracker -f database/indexes.sql
psql -U postgres -d finance_tracker -f database/seed.sql
```

**Option B — with the bundled npm helper** (uses the credentials from your `.env`, no `psql` needed)

```bash
npm run db:setup      # runs schema, then indexes, then seed
# or individually:
npm run db:schema
npm run db:indexes
npm run db:seed
```

## 5. Environment variables

Copy the example file and edit the values (at minimum `DB_PASSWORD`):

```bash
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=finance_tracker

JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

The full list of variables (CORS origins, cache TTLs, rate-limit tuning, pool size) is documented inline in `.env.example`.

## 6. Install dependencies & start the backend

```bash
npm install
npm run dev      # development, auto-reload via nodemon
# or
npm start        # production
```

You should see:

```
[...] [INFO] PostgreSQL connected: localhost:5432/finance_tracker
[...] [INFO] Redis connected: 127.0.0.1:6379
[...] [INFO] Server running in development mode on http://localhost:5000
[...] [INFO] Swagger docs available at http://localhost:5000/api/docs
```

Confirm it is alive:

```bash
curl http://localhost:5000/health
```

---

## Project structure

```
finance-tracker/
├── app.js                      # Express app: middleware, routes, docs, error handling
├── server.js                   # Boot: connect DB/Redis, start server, graceful shutdown
├── package.json
├── .env.example
├── config/
│   ├── index.js                # Env-driven configuration
│   ├── db.js                   # PostgreSQL pool + parameterized query() helper
│   ├── redis.js                # Redis client with graceful degradation
│   └── swagger.js              # OpenAPI 3 definition
├── database/                   # SQL scripts (schema, indexes, seed)
│   ├── schema.sql              # Tables, enums, triggers
│   ├── indexes.sql             # Performance indexes
│   └── seed.sql                # Demo users, categories, transactions
├── scripts/
│   └── runSql.js               # `npm run db:*` SQL runner
├── middleware/
│   ├── auth.js                 # JWT authentication
│   ├── rbac.js                 # Role gates + write-access guard
│   ├── validate.js             # express-validator result handler
│   ├── rateLimiter.js          # express-rate-limit config
│   ├── notFound.js             # 404 handler
│   └── errorHandler.js         # Central error → JSON translator
├── validators/                 # express-validator rule sets
│   ├── authValidator.js
│   ├── transactionValidator.js
│   ├── categoryValidator.js
│   └── userValidator.js
├── controllers/                # HTTP layer
│   ├── authController.js
│   ├── transactionController.js
│   ├── categoryController.js
│   ├── analyticsController.js
│   └── userController.js
├── services/                   # Business logic + data access
│   ├── authService.js
│   ├── userService.js
│   ├── transactionService.js
│   ├── categoryService.js
│   ├── analyticsService.js
│   └── cacheService.js
├── routes/                     # Express routers + Swagger annotations
│   ├── authRoutes.js
│   ├── transactionRoutes.js
│   ├── categoryRoutes.js
│   ├── analyticsRoutes.js
│   └── userRoutes.js
└── utils/
    ├── ApiError.js
    ├── asyncHandler.js
    ├── apiResponse.js
    ├── jwt.js
    ├── password.js
    └── logger.js
```

---

## API overview

All endpoints are prefixed with `/api`. Protected endpoints require an
`Authorization: Bearer <token>` header.

| Method | Endpoint                              | Access        | Description                          |
|--------|---------------------------------------|---------------|--------------------------------------|
| POST   | `/api/auth/register`                  | Public        | Create an account                    |
| POST   | `/api/auth/login`                     | Public        | Log in, receive a JWT                |
| GET    | `/api/auth/me`                        | Authenticated | Current user                         |
| GET    | `/api/transactions`                   | Authenticated | List (search/filter/sort/paginate)   |
| GET    | `/api/transactions/:id`               | Owner / admin | Get one                              |
| POST   | `/api/transactions`                   | user / admin  | Create                               |
| PUT    | `/api/transactions/:id`               | Owner / admin | Update                               |
| DELETE | `/api/transactions/:id`               | Owner / admin | Delete                               |
| GET    | `/api/categories`                     | Authenticated | List (cached)                        |
| GET    | `/api/categories/:id`                 | Authenticated | Get one                              |
| POST   | `/api/categories`                     | admin         | Create                               |
| PUT    | `/api/categories/:id`                 | admin         | Update                               |
| DELETE | `/api/categories/:id`                 | admin         | Delete                               |
| GET    | `/api/analytics/summary`              | Authenticated | Everything, chart-ready              |
| GET    | `/api/analytics/totals`               | Authenticated | Income / expense / balance           |
| GET    | `/api/analytics/monthly-trend`        | Authenticated | Monthly trend for a year             |
| GET    | `/api/analytics/yearly-trend`         | Authenticated | Yearly trend                         |
| GET    | `/api/analytics/category-breakdown`   | Authenticated | By category, with percentages        |
| GET    | `/api/analytics/income-vs-expense`    | Authenticated | Comparison                           |
| GET    | `/api/users`                          | admin         | List users                           |
| GET    | `/api/users/:id`                      | admin         | Get a user                           |
| PATCH  | `/api/users/:id/role`                 | admin         | Change a user's role                 |
| DELETE | `/api/users/:id`                      | admin         | Delete a user                        |

Every response uses a consistent envelope:

```json
{ "success": true, "message": "…", "data": { }, "meta": { } }
```

## Demo accounts

Seeded by `database/seed.sql`:

| Role       | Email                | Password     |
|------------|----------------------|--------------|
| admin      | `admin@finance.com`  | `Admin@123`  |
| user       | `user@finance.com`   | `User@123`   |
| read-only  | `viewer@finance.com` | `Viewer@123` |

---

## Testing with Postman

1. **Login** — `POST http://localhost:5000/api/auth/login`

   Body (raw JSON):

   ```json
   { "email": "user@finance.com", "password": "User@123" }
   ```

   Copy the `data.token` from the response.

2. **Authorize** — for every protected request, open the **Authorization** tab,
   choose **Bearer Token**, and paste the token. (Or add a header
   `Authorization: Bearer <token>`.)

3. **Create a transaction** — `POST http://localhost:5000/api/transactions`

   ```json
   {
     "type": "expense",
     "amount": 42.50,
     "category_id": 5,
     "description": "Lunch",
     "transaction_date": "2026-07-30"
   }
   ```

4. **List with filters** —
   `GET http://localhost:5000/api/transactions?type=expense&sortBy=amount&order=desc&page=1&limit=10`

5. **Analytics** —
   `GET http://localhost:5000/api/analytics/summary`

**Quick cURL smoke test**

```bash
# Login and capture the token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@finance.com","password":"User@123"}' \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# Use it
curl -s http://localhost:5000/api/analytics/summary \
  -H "Authorization: Bearer $TOKEN"
```

> A ready-to-import Postman collection is included at
> `postman/FinanceTracker.postman_collection.json`.

## Swagger documentation

Interactive docs are served at **http://localhost:5000/api/docs**. Click
**Authorize**, paste a login token, and every protected endpoint becomes
callable from the browser. The raw OpenAPI JSON is at
`http://localhost:5000/api/docs.json`.

---

## Roles & permissions (RBAC)

| Capability                              | admin | user            | read-only |
|-----------------------------------------|:-----:|:---------------:|:---------:|
| View categories & analytics             |  ✅   |       ✅        |    ✅     |
| View transactions                       | all   | own only        | own only  |
| Create / update / delete transactions   |  ✅   | own only        |    ❌     |
| Category create / update / delete       |  ✅   |       ❌        |    ❌     |
| User management                         |  ✅   |       ❌        |    ❌     |

Ownership is enforced in the data layer: a `user` requesting another user's
transaction receives a `404` (existence is never leaked).

## Caching behaviour

- **Categories** are cached under `categories:list` for **1 hour**.
- **Analytics** are cached per user for **15 minutes**.
- Any transaction **create / update / delete** invalidates that user's analytics
  cache; any category **create / update / delete** invalidates the category cache.
- If Redis is down, cache reads simply miss and the API falls back to PostgreSQL —
  no errors, no crashes.

---

## Troubleshooting

**`ECONNREFUSED 127.0.0.1:5432` / "Could not connect to PostgreSQL"**
PostgreSQL is not running or the `.env` credentials are wrong. Start the service
(`brew services start postgresql` / `sudo systemctl start postgresql`) and confirm
`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`.

**`password authentication failed for user "postgres"`**
The `DB_PASSWORD` in `.env` does not match. Reset it with
`ALTER USER postgres WITH PASSWORD 'your_password';` inside `psql`.

**`database "finance_tracker" does not exist`**
Run `createdb -U postgres finance_tracker` (see step 3), then re-run the SQL scripts.

**`relation "users" does not exist`**
You skipped the schema step. Run `npm run db:schema` (or the `psql -f database/schema.sql` command).

**Redis warning: `Redis unavailable … continuing without cache`**
Redis is not running. This is non-fatal — start it with `brew services start redis`
/ `sudo systemctl start redis-server` if you want caching, or ignore it.

**`401 Unauthorized` on every protected route**
Missing or malformed token. Send `Authorization: Bearer <token>` using the token
from `/api/auth/login`, and make sure it has not expired (`JWT_EXPIRES_IN`).

**`403 Forbidden`**
Your role lacks permission for that action (e.g. a read-only account attempting a
write, or a non-admin hitting `/api/users`). Log in as `admin@finance.com`.

**`429 Too many requests`**
You hit the rate limiter. Wait for the window to reset or raise `RATE_LIMIT_MAX`
in `.env`.

**Port 5000 already in use (`EADDRINUSE`)**
Another process owns the port. Change `PORT` in `.env`, or free it:
`lsof -i :5000` then `kill <pid>`.

---

## License

MIT
