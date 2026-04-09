# CLAUDE.md — JRA Automation Hub

## Project Overview

This is the **JRA Automation Hub**, a React + TypeScript web application for Jet Realty Advisors (JRA). It serves as the frontend for a real estate brokerage CRM powered by Supabase (auth, database, edge functions) and integrates with Make.com automation workflows and an OpenAI-backed AI agent.

**Core purpose**: Lead management, agent assignment, marketing materials, SMS/email communications, and AI-assisted operations for a real estate brokerage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix UI) |
| Data fetching | TanStack Query (react-query v5) |
| Routing | React Router DOM v6 |
| Backend / DB | Supabase (PostgreSQL + Edge Functions) |
| Edge functions runtime | Deno TypeScript |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 + typescript-eslint |
| Formatting | Prettier |
| CI | GitHub Actions (Node 18/20/22 matrix) |

---

## Directory Structure

```
/
├── src/
│   ├── App.tsx                 # Root: providers (QueryClient, Router, Auth, ErrorBoundary)
│   ├── main.tsx                # Entry point
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives — DO NOT modify manually
│   │   ├── auth/               # Auth forms (sign-in, sign-up, forgot password, reset)
│   │   ├── ai-agent/           # AI chat interface (AIAgent, MessageList, MessageInput)
│   │   ├── crm/                # CRM contacts, activities, tasks
│   │   ├── dashboard/          # Main dashboard, stats, charts, tabs
│   │   ├── leads/              # Lead list, table, details, follow-ups, import/export
│   │   ├── marketing/          # Marketing materials, templates, uploads
│   │   ├── messaging/          # SMS messaging components
│   │   ├── owner/              # Owner-role views (performance, lead control)
│   │   ├── profile/            # User profile components
│   │   ├── property/           # Property search and details
│   │   ├── sidebar/            # Navigation sidebar
│   │   ├── campaigns/          # Campaign management
│   │   ├── sales/              # Sales funnel
│   │   ├── lead-magnets/       # Lead magnet templates
│   │   ├── common/             # Shared loading boundaries
│   │   └── agents/             # Agent invitation dialog
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Auth state (session, user, userRole, signIn/Out)
│   │   ├── SidebarContext.tsx
│   │   └── auth/               # Auth form context
│   ├── hooks/
│   │   ├── auth/               # Auth hooks (sign-in, sign-up, rate limiting, validation)
│   │   ├── crm/                # CRM data hooks
│   │   ├── csv/                # CSV import/export hooks
│   │   └── imports/            # Chunked import hooks
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Auto-generated Supabase client — DO NOT edit
│   │       └── types/          # Auto-generated DB types — DO NOT edit
│   ├── pages/                  # Page-level components (lazy-loaded)
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Index.tsx           # Public landing/home page
│   │   ├── LeadDetails.tsx
│   │   ├── Marketing.tsx
│   │   ├── Communications.tsx
│   │   ├── SalesFunnel.tsx
│   │   ├── Profile.tsx
│   │   └── Settings.tsx
│   ├── routes/
│   │   └── AppRoutes.tsx       # All route definitions with lazy loading
│   ├── services/
│   │   ├── invitation/         # Agent invitation logic
│   │   ├── realEstateService.ts
│   │   └── toast/
│   ├── types/                  # TypeScript types organized by domain
│   │   ├── auth.types.ts
│   │   ├── ai-agent.types.ts
│   │   ├── crm.types.ts
│   │   ├── database/           # Database schema types (leads, crm, properties, misc)
│   │   └── supabase/           # Supabase table/view/function types
│   ├── utils/                  # Pure utility functions
│   │   ├── authErrors.ts
│   │   ├── databaseRetry.ts
│   │   ├── rateLimiting.ts
│   │   └── formValidation.ts
│   ├── constants/auth.ts
│   ├── lib/utils.ts            # cn() helper from shadcn/ui
│   └── test/setup.ts           # Vitest + Testing Library setup
├── supabase/
│   ├── config.toml             # Project ID: xidvccjjpyzqovgknsup
│   └── functions/              # Supabase Edge Functions (Deno TypeScript)
│       ├── _shared/cors.ts     # Shared CORS headers
│       ├── handle-agent-interaction/   # OpenAI GPT-4o-mini AI agent
│       ├── send-auth-email/            # Auth email templates
│       ├── send-invitation/            # Agent invite emails
│       ├── send-sms/                   # SMS via external provider
│       ├── fetch-properties/           # Property data fetching
│       ├── process-inbound-email/      # Inbound email processing
│       ├── process-data-feed/          # Data feed ingestion
│       ├── upload-brand-logo/          # Brand logo upload to storage
│       ├── upload-marketing-material/  # Marketing material uploads
│       ├── db-to-storage/              # DB to storage migration
│       ├── delete-user/                # User deletion
│       ├── send-calculator/            # Calculator tool
│       └── test-api-keys/              # API key validation
├── .github/workflows/webpack.yml       # CI: build on push/PR to main
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── eslint.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── components.json             # shadcn/ui configuration
```

---

## Development Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:8080 or default)
npm run build        # Production build
npm run build:dev    # Dev-mode build (preserves source maps)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npx vitest           # Run tests in watch mode
npx vitest run       # Run tests once (CI mode)
```

---

## Key Conventions

### Path Aliases
- `@/` maps to `src/`. Always use this alias — never use relative paths like `../../`.

### Component Organization
- Components are **feature-scoped**: each domain (`leads/`, `crm/`, `marketing/`, etc.) contains its own sub-components, hooks, types, and utilities.
- `src/components/ui/` is the **shadcn/ui component library** — never modify these files directly. Add new shadcn components via the CLI.
- Large features are broken into sub-folders with dedicated files for: main component, sub-components, hooks, types, and utils.

### Auto-generated Files — Never Edit Manually
- `src/integrations/supabase/client.ts` — Supabase client with hardcoded project URL and anon key
- `src/integrations/supabase/types/` — Database type definitions generated from Supabase

### TypeScript
- Strict TypeScript throughout. All components, hooks, and utilities are fully typed.
- Types live in `src/types/` organized by domain. Database types are further split into `src/types/database/` and `src/types/supabase/`.
- Use Zod for runtime validation at form boundaries.

### State Management
- **Server state**: TanStack Query (react-query). QueryClient config: 5-minute stale time, 10-minute gc time, 1 retry, no refetch on window focus.
- **Auth state**: `AuthContext` — access via `useAuth()` hook.
- **UI/local state**: React `useState`/`useReducer`.
- No global client-side state library (no Redux/Zustand).

### Routing
- All pages are **lazy-loaded** via `React.lazy()` in `AppRoutes.tsx`.
- Protected routes use the inline `PrivateRoute` component which checks `session` from `useAuth()`.
- Public routes: `/` (Index), `/auth`
- Protected routes: `/dashboard`, `/leads/:id`, `/sales-funnel`, `/marketing`, `/communications`, `/settings`, `/profile`

### Supabase Integration
- Import the client as: `import { supabase } from "@/integrations/supabase/client";`
- Edge functions are invoked via: `supabase.functions.invoke('function-name', { body: {...} })`
- Supabase project ID: `xidvccjjpyzqovgknsup`

### Styling
- **Tailwind CSS** utility classes only — no custom CSS files except `App.css` for global resets.
- Use `cn()` from `@/lib/utils` to merge conditional class names.
- Dark/light theming via `next-themes`.
- Component variants via `class-variance-authority` (cva).

### Forms
- Use `react-hook-form` with Zod resolvers (`@hookform/resolvers/zod`) for all user-facing forms.
- Validate at form submission boundaries — don't re-validate server-guaranteed data.

---

## Authentication Flow

1. App loads → `AuthProvider` calls `supabase.auth.getSession()` to hydrate session
2. `onAuthStateChange` listener keeps session in sync
3. `useAuth()` exposes: `session`, `user`, `userRole`, `signIn`, `signUp`, `signOut`, `loading`
4. `AppRoutes` reads `session`/`loading` to render public vs protected routes
5. User roles tracked via `userRole` (owner vs agent access levels)
6. Rate limiting implemented in `src/utils/rateLimiting.ts` and `src/hooks/auth/useRateLimiting.ts`

---

## AI Agent Integration

The AI agent uses **OpenAI GPT-4o-mini** via a Supabase Edge Function:

- **Edge function**: `supabase/functions/handle-agent-interaction/index.ts`
- **Frontend**: `src/components/ai-agent/AIAgent.tsx`
- Agent configurations stored in `ai_agents` Supabase table
- Interactions logged to `system_logs` table
- Environment secrets required in Supabase: `OPENAI_API_KEY`

---

## Supabase Edge Functions

Edge functions run on Deno. Key patterns:
- Always include CORS headers from `_shared/cors.ts`
- Handle `OPTIONS` preflight requests first
- Read secrets via `Deno.env.get('SECRET_NAME')`
- Create Supabase client per-request with `{ auth: { persistSession: false } }`
- Required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, plus function-specific secrets (e.g., `OPENAI_API_KEY`)

---

## Testing

- Framework: **Vitest** with jsdom environment
- Testing Library: `@testing-library/react` + `@testing-library/user-event`
- Setup file: `src/test/setup.ts` (extends Vitest `expect` with jest-dom matchers, cleans up after each test)
- `@/` alias works in tests (configured in `vitest.config.ts`)
- No test files currently exist beyond setup — tests should be colocated with components or in `src/test/`

---

## CI/CD

GitHub Actions workflow (`.github/workflows/webpack.yml`):
- Triggers on push and PR to `main`
- Tests Node.js 18.x, 20.x, 22.x
- Runs `npm install && npx webpack`

---

## Domain Concepts

| Concept | Description |
|---|---|
| **Lead** | A prospective real estate client (buyer/seller) |
| **Agent** | A real estate agent who is assigned leads |
| **Owner** | Brokerage owner with elevated access (sees all agents/leads) |
| **Lead Magnet** | Downloadable content templates to attract leads |
| **Campaign** | Marketing outreach campaigns |
| **Follow-up** | Scheduled communication with a lead |
| **AI Agent** | Configurable OpenAI-backed assistant for lead management |
| **Marketing Material** | Uploaded assets (flyers, brand logos) stored in Supabase Storage |

---

## Important Notes for AI Assistants

1. **Never edit** `src/integrations/supabase/client.ts` or `src/integrations/supabase/types/` — these are auto-generated.
2. **Never edit** `src/components/ui/` files — these are shadcn/ui managed components.
3. Always use `@/` imports, never relative `../../` paths.
4. When adding new shadcn/ui components, add them to `src/components/ui/` following the existing pattern.
5. New pages go in `src/pages/` and must be lazy-loaded in `AppRoutes.tsx`.
6. New protected routes must be wrapped in `<PrivateRoute>`.
7. Edge functions are Deno (not Node.js) — import from `https://deno.land/` and `https://esm.sh/` URLs.
8. The Supabase anon key in `client.ts` is a public key — it's safe to have in source code.
9. Feature branches follow the pattern `claude/<feature-name>` based on the current branch naming convention.
10. The `components.json` file configures shadcn/ui — do not modify it unless changing the design system settings.
