# CapyF Smart Farm

React + Vite dashboard for Smart Farm sensor monitoring, device registration,
Supabase authentication, and realtime sensor updates.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Install dependencies and start Vite:

```bash
npm install
npm run dev
```

## Supabase

The database schema is stored in `supabase/migrations`. It creates:

- `public.user_devices`
- `public.sensor_data`
- Row Level Security policies scoped to `auth.uid()`
- Realtime publication for `public.sensor_data`

The browser uses only a Supabase publishable key. Never put a secret or
service-role key in a `VITE_` environment variable.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run preview
```
