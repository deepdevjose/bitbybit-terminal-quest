# BitByBit Terminal Quest

Gamified multi-OS terminal academy where users learn Linux, Windows PowerShell, and macOS command-line skills through interactive missions, XP, avatars, progress tracking, and real-world troubleshooting challenges.

## MVP Stack

- Astro, React, TypeScript, Tailwind CSS
- Dexie.js IndexedDB progress cache with an offline sync queue
- Supabase-ready client and SQL migration with RLS policies
- Static Cloudflare Pages compatible output
- Simulated terminal engine backed by a virtual JSON filesystem

## Local Development

```bash
npm install
npm run dev
```

Open the dashboard at `/dashboard` or start the onboarding flow at `/auth/register`.

## Build

```bash
npm run build
```

The build outputs static assets to `dist/`, suitable for Cloudflare Pages.

## Supabase

Copy `.env.example` to `.env` and set:

```bash
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

Apply `supabase/migrations/20260621120000_initial_schema.sql` to create the MVP tables, seed public path metadata, and enable RLS policies.
