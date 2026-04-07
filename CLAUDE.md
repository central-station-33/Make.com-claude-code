# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Project Overview

A real estate CRM application built with React/TypeScript and Supabase. It supports multi-tenant agent onboarding, lead management, CRM contacts/activities, marketing campaigns, sales funnel tracking, and property listings. Automation is handled via Make.com webhooks and internal tooling is built on [Retool](https://jrapaid.retool.com).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + React Router 6 |
| Language | TypeScript 5.5 (strict mode OFF) |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn-ui (Radix UI) |
| State/Data | TanStack React Query 5 |
| Forms | React Hook Form 7 + Zod |
| Backend | Supabase (Auth, PostgreSQL, Storage, Edge Functions) |
| Email | Resend (via Supabase Edge Functions) |
| Testing | Vitest 3 + Testing Library |
| Package manager | Bun (preferred), npm fallback |

---

## Repository Structure

```
src/
├── App.tsx                  # Root providers: QueryClient, Router, Auth, Toaster
├── main.tsx                 # DOM entry point with SidebarProvider
├── components/              # Feature-organized UI components
│   ├── auth/                # Login, signup, password reset, 2FA
│   ├── ui/                  # shadcn-ui base components (do not hand-edit)
│   ├── dashboard/           # Agent performance metrics, KPI cards
│   ├── crm/                 # Contacts, activities
│   ├── leads/               # Lead cards, lead detail, acquisition
│   ├── marketing/           # Campaigns, lead magnets
│   ├── properties/          # Property listings
│   ├── sales/               # Sales funnel
│   ├── common/              # Shared layouts, nav, sidebar
│   └── ...                  # Other feature directories
├── pages/                   # Lazy-loaded page components (route targets)
├── hooks/                   # 35+ custom hooks, one per feature/concern
├── contexts/                # React Context providers (Auth, AuthForm)
├── services/                # Business logic outside React (invitation, realEstate, etc.)
├── types/                   # Shared TypeScript interfaces
├── constants/               # App-wide constants (auth rules, config)
├── utils/                   # Pure utility functions
├── routes/                  # AppRoutes.tsx — centralized route definitions
├── integrations/
│   └── supabase/
│       ├── client.ts        # Supabase client (anon key embedded — expected for frontend)
│       └── types.ts         # Auto-generated DB types (4 400+ lines, DO NOT edit manually)
└── test/
    └── setup.ts             # Vitest + jsdom + Testing Library setup
supabase/
└── functions/               # Deno Edge Functions (send-auth-email, send-sms, etc.)
.github/workflows/
└── webpack.yml              # CI: Node 18/20/22 matrix, npm install + webpack
```

---

## Development Commands

```bash
# Install dependencies (prefer bun)
bun install          # or: npm install

# Start dev server (localhost:8080)
bun run dev          # or: npm run dev

# Production build
bun run build        # or: npm run build

# Lint
bun run lint         # ESLint with TypeScript + React hooks rules

# Run tests
bun run test         # or: npx vitest

# Preview production build
bun run preview
```

---

## Code Conventions

### TypeScript
- Strict mode is **disabled** (`noImplicitAny: false`, `strictNullChecks: false`). Do not assume null-safety everywhere.
- Path alias `@/*` resolves to `./src/*` — always use this for imports.
- Prefer `interface` over `type` for object shapes; use `type` for unions/intersections.
- Component props: name as `ComponentNameProps`.
- Context value types: name as `ComponentNameContextType`.
- Never edit `src/integrations/supabase/types.ts` manually — regenerate via Supabase CLI.

### Components
- Functional components only, with hooks.
- PascalCase filenames for `.tsx` components.
- Feature-based directory grouping under `src/components/<feature>/`.
- Extract business logic into custom hooks in `src/hooks/`.
- Pages in `src/pages/` are lazy-loaded via `React.lazy` — keep them thin wrappers.
- Use `React.memo` only when profiling shows a measurable benefit.

### Hooks
- All custom hooks live in `src/hooks/` with a `use` prefix.
- One hook per concern (e.g., `useLeadFilters`, `useAuthActions`).

### Styling
- Tailwind utility classes first; avoid inline styles.
- Use `clsx`/`cn` (shadcn helper) for conditional class merging.
- `src/components/ui/` contains auto-generated shadcn-ui primitives — avoid modifying them directly; instead wrap them.
- Print width: 100 chars, 2-space indent, single quotes, trailing commas (ES5), semicolons — enforced by Prettier.

### Naming
| Item | Convention |
|---|---|
| React components / files | PascalCase |
| Hooks | camelCase with `use` prefix |
| Services, utils | camelCase |
| Constants | UPPER_SNAKE_CASE |
| Database tables/columns | snake_case |

---

## Supabase Integration

### Client
`src/integrations/supabase/client.ts` exports the singleton `supabase` client. Import from there — never create a second client.

### Database Schema (key tables)
| Table | Purpose |
|---|---|
| `profiles` | User profile data, linked to `auth.users` |
| `user_roles` | RBAC — `app_role`: `admin` \| `user` |
| `leads` | Inbound lead records |
| `crm_contacts` | CRM contact entries |
| `crm_activities` | Activity log for contacts |
| `campaigns` | Marketing campaigns |
| `lead_magnet_interactions` | Tracking lead magnet conversions |
| `properties` | Real estate listings |
| `agent_onboarding` | Onboarding state per agent |
| `agent_credentials` | Agent API/integration keys |

Auto-generated types are in `src/integrations/supabase/types.ts` — use `Database["public"]["Tables"]["table_name"]["Row"]` pattern.

### Edge Functions
Located in `supabase/functions/`. Written in Deno TypeScript. Key functions:
- `send-auth-email` — transactional auth emails via Resend (`RESEND_API_KEY` env var required)
- `send-invitation` — agent invitation emails
- `send-sms` — SMS notifications
- `upload-brand-logo` / `upload-marketing-material` — Storage uploads
- `handle-agent-interaction` — webhook handler for agent events
- `process-data-feed` — bulk data ingestion
- `fetch-properties` — property listing queries
- `delete-user` — admin user deletion

### Auth Rules
Defined in `src/constants/`:
- Min password length: 8
- Requires uppercase, lowercase, number, special character
- Max login attempts: 5
- Lockout duration: 15 minutes
- Session inactivity timeout: 30 minutes

---

## Testing

Vitest with jsdom + Testing Library is configured but **no test files exist yet**. When adding tests:
- Place test files co-located as `ComponentName.test.tsx` or in `__tests__/`.
- Setup file: `src/test/setup.ts` (runs `@testing-library/jest-dom` matchers + auto-cleanup).
- Mock Supabase client for unit tests.

---

## CI/CD

GitHub Actions (`.github/workflows/webpack.yml`):
- Triggers on push to `main` and pull requests.
- Matrix: Node 18, 20, 22.
- Steps: `npm install` → `npx webpack`.

> Note: The CI workflow references webpack but the build tool is Vite. If CI is updated, switch to `npm run build` / `vite build`.

---

## Environment Variables

No `.env` file is required for the frontend — the Supabase URL and anon key are embedded in `src/integrations/supabase/client.ts` (this is standard for public Supabase projects).

Supabase Edge Functions require:
```
RESEND_API_KEY=<your_resend_key>    # For email functions
```
Set these in the Supabase dashboard under Project Settings → Edge Functions → Secrets.

---

## Key Architectural Patterns

1. **Data fetching** — Use TanStack React Query hooks. Wrap Supabase queries in custom hooks (`src/hooks/`). Prefer `useQuery` for reads, `useMutation` for writes.

2. **Authentication** — `AuthContext` manages session state. Use `useAuthState()` to read and `useAuthActions()` to act. Never access `supabase.auth` directly in components.

3. **Forms** — React Hook Form + Zod schema validation. Define schemas in the same file as the form component, or in `src/types/` if reused.

4. **Error handling** — `ErrorBoundary` wraps the app at root. For async errors, use React Query's `onError` callbacks or `isError` / `error` states.

5. **Role-based access** — Check via `has_role` DB function or `user_roles` table. The `app_role` enum is `admin | user`.

6. **Component library** — shadcn-ui components live in `src/components/ui/`. Add new components with `npx shadcn-ui@latest add <component>` — do not hand-write them.

---

## Things to Avoid

- Do **not** edit `src/integrations/supabase/types.ts` manually.
- Do **not** add a second Supabase client instance.
- Do **not** enable TypeScript strict mode without a full audit — many existing types rely on implicit `any`.
- Do **not** put business logic directly in page components — extract to hooks or services.
- Do **not** bypass React Query cache by calling Supabase directly in render — always go through a hook.
