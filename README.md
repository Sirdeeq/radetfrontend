# radet-frontend

React frontend for the RADET (Reporting and Data Tracking) system.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- MUI 7 + Tailwind CSS 4
- React Query
- React Router 7
- i18next (EN/FR/ES/DE)

## Getting Started

### Prerequisites

- Node.js >= 18
- Backend API running (see [radetbackend](https://github.com/Sirdeeq/radetbackend))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env .env.local
```

Edit `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_STORAGE_PREFIX="nx"
VITE_MUIX_LICENSE_KEY="YOUR_MUIX_LICENSE_KEY"
```

### 3. Start dev server

```bash
npm run dev
```

Runs on `http://localhost:3001`.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `/api/v1` |
| `VITE_STORAGE_PREFIX` | Local storage key prefix | `nx` |
| `VITE_MUIX_LICENSE_KEY` | MUI X Pro license key | — |

## Production Deployment

For production builds, set `VITE_API_BASE_URL` in your hosting dashboard (Vercel, Netlify, etc.):

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

> **Important:** `VITE_*` env vars are embedded at build time. You must set them before running `npm run build`.

### Build

```bash
npm run build    # output in dist/
npm run preview  # preview production build locally
```

## Project Structure

```
src/
├── components/     # Reusable UI (layout, data-grid, charts, logo)
├── contexts/       # AuthContext (JWT auth state)
├── hooks/          # Custom hooks (useApi, usePermission, useMenu)
├── i18n/           # Translations (en, fr, es, de)
├── icons/          # Nexture icon library
├── lib/            # API client, utils, permissions
├── pages/
│   ├── app/        # Authenticated pages (dashboard, reports, flags, etc.)
│   └── auth/       # Sign-in, sign-up, password reset
├── style/          # CSS (MUI theme overrides, Tailwind)
├── theme/          # MUI theme provider
└── types/          # TypeScript types
```

## Seed Credentials (for testing)

| Email | Password | Role |
|---|---|---|
| `superadmin@radet.gov` | `Admin@123` | SUPER_ADMIN |
| `admin@radet.gov` | `Admin@123` | ADMIN |
| `me@radet.gov` | `Me@12345` | ME |
| `dec@radet.gov` | `Dec@12345` | DEC |
| `cm@radet.gov` | `Cm@12345` | CM |
| `pn@radet.gov` | `Pn@12345` | PN |
| `vlc@radet.gov` | `Vlc@12345` | VLC |
| `supervisor@radet.gov` | `Sup@12345` | SUPERVISOR |

## License

Private — RADET Project
