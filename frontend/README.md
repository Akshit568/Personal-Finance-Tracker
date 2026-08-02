# Personal Finance Tracker — Frontend

A professional, responsive dashboard for the [Personal Finance Tracker API](../finance-tracker), built with **React 18 + Vite + Tailwind CSS + Recharts**. It provides JWT authentication, a role-aware UI (admin / user / read-only), an analytics dashboard, full transaction management, category management, and admin user management — with polished light **and** dark themes.

## Highlights

- **Auth** — login & registration against the backend's JWT endpoints; the token is stored and attached to every request; sessions restore on reload and auto-expire on a `401`.
- **Role-aware UI** — the sidebar, action buttons and routes adapt to the user's role. Read-only accounts see no create/edit/delete controls; the Users area is admin-only and route-guarded.
- **Dashboard** — KPI tiles (income, expense, balance, count), a monthly income-vs-expense area chart, a spending-by-category donut with a labeled legend, and an income-vs-expense comparison. Year selector included.
- **Transactions** — searchable, filterable (type, category, date range), sortable (date, amount, type) and paginated table, with a create/edit modal and delete confirmation. Responsive card view on mobile.
- **Categories** — grouped income/expense lists; admins can create, edit and delete.
- **Users (admin)** — list, filter by role, change roles inline, and delete accounts.
- **Design** — modern fintech look, accessible color system (charts use a CVD-validated palette with legends and value labels, not color alone), custom toasts, keyboard-dismissable modals, and a persisted light/dark theme.

## Tech stack

| Concern        | Choice                    |
|----------------|---------------------------|
| Framework      | React 18                  |
| Build tool     | Vite 5                    |
| Styling        | Tailwind CSS 3            |
| Routing        | React Router 6            |
| Charts         | Recharts 2                |
| HTTP           | Axios (with interceptors) |
| Icons          | lucide-react              |

---

## Prerequisites

- **Node.js 18+** and npm.
- The **backend API running** (default `http://localhost:5000`). See the backend README to start PostgreSQL, Redis and the server, and to seed the demo accounts.

## Getting started

```bash
npm install
cp .env.example .env      # defaults work for local development
npm run dev
```

Open **http://localhost:5173**.

In development the Vite dev server **proxies `/api` to the backend**, so there are no CORS issues and no URL juggling — just make sure the backend is up on port 5000 (or change `VITE_API_PROXY`).

### Demo accounts

These are seeded by the backend (`database/seed.sql`). On the login screen you can click a chip to auto-fill them:

| Role       | Email                | Password     |
|------------|----------------------|--------------|
| Admin      | `admin@finance.com`  | `Admin@123`  |
| User       | `user@finance.com`   | `User@123`   |
| Read-only  | `viewer@finance.com` | `Viewer@123` |

> The analytics dashboard shows **your own** transactions. The seeded data belongs to the **user** account, so log in as `user@finance.com` to see populated charts.

## Environment variables

| Variable          | Default                 | Purpose                                                             |
|-------------------|-------------------------|---------------------------------------------------------------------|
| `VITE_API_URL`    | `/api`                  | Base URL the app calls. Keep `/api` in dev (proxied); set to the full backend URL for a production build, e.g. `https://api.example.com/api`. |
| `VITE_API_PROXY`  | `http://localhost:5000` | Where the dev server forwards `/api` (development only).            |

## Scripts

```bash
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # production build into dist/
npm run preview   # preview the production build locally
```

### Production build

```bash
# Point the build at your deployed API, then build:
VITE_API_URL=https://your-api.example.com/api npm run build
```

The static output in `dist/` can be served by any static host (Nginx, Netlify, Vercel, S3/CloudFront, …). Because the app uses client-side routing, configure your host to **fall back to `index.html`** for unknown paths.

---

## Project structure

```
finance-tracker-frontend/
├── index.html
├── vite.config.js            # dev proxy + vendor chunk splitting
├── tailwind.config.js        # theme tokens (brand, income/expense colors)
├── postcss.config.js
├── .env.example
└── src/
    ├── main.jsx              # entry
    ├── App.jsx               # providers + routes
    ├── index.css             # Tailwind + CSS design tokens (light/dark)
    ├── api/                  # axios client + endpoint modules
    │   ├── client.js         # base instance, JWT interceptor, 401 handling
    │   ├── auth.js  transactions.js  categories.js  analytics.js  users.js
    ├── context/
    │   ├── AuthContext.jsx   # session state, login/register/logout, role flags
    │   ├── ThemeContext.jsx  # persisted light/dark theme
    │   └── ToastContext.jsx  # toast notifications
    ├── components/
    │   ├── Layout.jsx        # sidebar + topbar shell
    │   ├── ProtectedRoute.jsx
    │   ├── StatCard.jsx  Pagination.jsx  Modal.jsx  ui.jsx
    │   └── charts/           # Recharts components + shared theming/tooltip
    ├── pages/
    │   ├── Login.jsx  Register.jsx
    │   ├── Dashboard.jsx  Transactions.jsx  Categories.jsx  Users.jsx
    │   └── NotFound.jsx
    └── utils/                # formatting + constants
```

## How it maps to the API

| UI area        | Endpoints used                                                                 |
|----------------|--------------------------------------------------------------------------------|
| Login/Register | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`                       |
| Dashboard      | `GET /analytics/summary` (totals, monthly trend, category breakdown, income-vs-expense) |
| Transactions   | `GET/POST/PUT/DELETE /transactions` with `page, limit, sortBy, order, type, category_id, search, startDate, endDate` |
| Categories     | `GET /categories`, `POST/PUT/DELETE /categories` (writes are admin-only)        |
| Users          | `GET /users`, `PATCH /users/:id/role`, `DELETE /users/:id` (admin-only)          |

## Troubleshooting

**Network errors / blank dashboard** — the backend isn't reachable. Confirm it's running on `http://localhost:5000` (`curl http://localhost:5000/health`) and that `VITE_API_PROXY` points to it.

**401 / immediately bounced to login** — the token is missing or expired. Log in again; the app clears expired sessions automatically.

**Charts are empty** — analytics are per-user. Log in as `user@finance.com` (which has seeded data), or add some transactions.

**Port 5173 in use** — Vite will pick the next free port, or set one in `vite.config.js`.

## License

MIT
