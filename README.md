# Real Estate CRM

A real estate CRM application built with React, TypeScript, and Supabase. Supports multi-tenant agent onboarding, lead management, CRM contacts/activities, marketing campaigns, sales funnel tracking, and property listings.

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn-ui
- **State/Data:** TanStack React Query
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Automation:** Make.com (webhook integrations)
- **Internal tooling:** Retool dashboards

## Local Development

Requirements: Node.js ≥ 18 and npm (or [Bun](https://bun.sh))

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
bun install   # or: npm install

# Start the dev server (localhost:8080)
bun run dev   # or: npm run dev
```

## Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run lint` | Run ESLint |
| `bun run test` | Run Vitest tests |
| `bun run preview` | Preview production build |

## Environment Variables

No `.env` file is needed for the frontend — Supabase credentials are embedded in `src/integrations/supabase/client.ts` (standard for public Supabase projects).

Supabase Edge Functions require:
```
RESEND_API_KEY=<your_resend_key>
```
Set via the Supabase dashboard: Project Settings → Edge Functions → Secrets.

## Deployment

Deploy via your preferred hosting provider (Netlify, Vercel, etc.) by running `bun run build` and serving the `dist/` directory.

For custom domains, configure DNS through your hosting provider.
