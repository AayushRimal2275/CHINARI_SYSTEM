# CHINARI SYSTEM Monorepo

This repository now contains a phased migration setup:

- `chinari_system/` → existing Django system (legacy source for data migration)
- `backend/` → Laravel 11 API (Sanctum auth + module APIs)
- `frontend/` → React + TypeScript + Vite admin app

## Shared conventions

- API envelope:
  - `success: boolean`
  - `message: string`
  - `data: object | null`
  - `errors: object | null`
  - `meta: object | null`
- Error responses are normalized in `backend/bootstrap/app.php`.
- Currency/date display is handled in frontend views and Laravel resources.

## Local setup

### 1) Prerequisites

- PHP 8.2+
- Composer 2+
- Node.js 20+
- npm 10+

### 2) Backend (Laravel API)

```bash
cd backend
composer install --prefer-source
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Default seeded admin login:

- email: `admin@chinari.local`
- password: `password123`

API URL: `http://127.0.0.1:8000/api`

### 3) Frontend (React)

Open a new terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`

### 4) Login flow

- Open frontend in browser.
- Sign in with seeded admin credentials.
- Use Dashboard + Products pages.

## Migration notes

- Legacy Django schema source is under `chinari_system/*/models.py`.
- Planned data migration mapping and execution checklist are in `docs/django-to-laravel-migration.md`.
