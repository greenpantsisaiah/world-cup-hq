# World Cup HQ

Office fantasy World Cup game built with Next.js 16, Supabase, and Framer Motion.

## Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (Postgres, Auth, Realtime, RLS)
- **State**: Server Actions (`"use server"`) + Zod validation
- **Charts**: Recharts, custom SVG sparklines + radial charts

## Architecture
- Auth via Supabase magic links + password (dev mode)
- All mutations go through `src/lib/supabase-actions.ts` (Server Actions)
- Input validation in `src/lib/validations.ts` (Zod schemas)
- Middleware enforces auth on non-public routes
- RLS on all tables with `is_league_member()` security definer function

## Key Directories
- `src/app/` — Pages (each is a route)
- `src/components/` — Shared components (auth-provider, nav, charts, cards)
- `src/data/` — Static data (countries, players, simulation timelines)
- `src/lib/` — Supabase clients, server actions, scoring, validations
- `supabase/` — SQL schema, migrations, simulation seed data

## Dev Login
In development, the admin page shows a "Dev Login" panel with 16 test users.
Password for all test users: `worldcup2026`

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npx tsc --noEmit` — Type check
