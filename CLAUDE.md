# CLAUDE.md — JRA Automation Hub

AI assistant guide for the **JRA Automation Hub** — a React + TypeScript SaaS dashboard for Jet Realty Advisors, integrating Make.com automation pipelines with Anthropic Claude AI workflows and Supabase backend.

---

## Project Overview

This is a real estate operations platform providing:
- Lead management and CRM
- Property listing integration (MLS/RapidAPI)
- Marketing campaign management
- Communications hub (SMS, email)
- Sales funnel tracking
- Agent onboarding and team management (RBAC)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3.1 + TypeScript 5.5.3 |
| Build tool | Vite 5.4.1 (port 8080, SWC compiler) |
| Routing | React Router v6 (SPA, lazy-loaded pages) |
| Server state | TanStack React Query v5 |
| Styling | Tailwind CSS 3.4.11 + shadcn/ui + Radix UI |
| Forms | React Hook Form + Zod validation |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Testing | Vitest 3.0.4 + React Testing Library |
| Charts | Recharts |
| CSV/Excel | PapaParse + XLSX |

---

## Development Commands

```bash
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build → dist/
npm run build:dev    # Dev-mode build
npm run lint         # ESLint check
npm run preview      # Preview production build
```

No test runner script is defined yet. Run tests with:
```bash
npx vitest           # Run tests (Vitest)
npx vitest --ui      # Interactive test UI
```

---

## Repository Structure

```
/
├── src/
│   ├── App.tsx                    # Root: providers (QueryClient, Router, Auth)
│   ├── main.tsx                   # Entry point with SidebarProvider
│   ├── components/                # Feature UI components
│   │   ├── agents/                # Agent management UI
│   │   ├── ai-agent/              # AI features
│   │   ├── auth/                  # Auth forms, buttons, alerts, fields
│   │   ├── campaigns/             # Marketing campaigns
│   │   ├── crm/                   # CRM (contacts, activities)
│   │   ├── dashboard/             # Dashboard tabs, filters, stats
│   │   ├── lead-magnets/          # Lead capture templates
│   │   ├── leads/                 # Lead list, details, imports, messaging
│   │   ├── marketing/             # Marketing forms & uploads
│   │   ├── messaging/             # Communications features
│   │   ├── owner/                 # Owner dashboard & controls
│   │   ├── property/              # Property listing UI
│   │   ├── sales/                 # Sales pipeline
│   │   ├── sidebar/               # Navigation sidebar
│   │   ├── stats/                 # Analytics/metrics
│   │   ├── ui/                    # shadcn/ui base components (DO NOT modify)
│   │   └── common/                # Shared reusable components
│   ├── pages/                     # Lazy-loaded page components
│   │   ├── Dashboard.tsx
│   │   ├── Index.tsx              # Public landing/home
│   │   ├── Settings.tsx
│   │   ├── Profile.tsx
│   │   ├── LeadDetails.tsx        # /leads/:id
│   │   ├── SalesFunnel.tsx
│   │   ├── Marketing.tsx
│   │   └── Communications.tsx
│   ├── routes/
│   │   └── AppRoutes.tsx          # Route definitions (2 public, 7 protected)
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Global auth state (session, user, userRole)
│   │   └── auth/                  # Auth form context + hook
│   ├── hooks/                     # ~61 custom hooks
│   │   ├── auth/                  # 15 auth hooks
│   │   ├── crm/, leads/, imports/, messaging/, owner/, queries/, profile/
│   │   ├── useAuthState.ts        # Session/user state
│   │   ├── useAuthActions.ts      # signIn, signUp, signOut
│   │   ├── useToast.ts
│   │   └── use-mobile.tsx
│   ├── services/
│   │   ├── invitation/            # Invitation service (5 files, see its README)
│   │   └── realEstateService.ts   # Property data service
│   ├── integrations/supabase/
│   │   ├── client.ts              # Supabase client (auto-generated, do not edit)
│   │   └── types/                 # Auto-generated DB types (do not edit)
│   ├── types/                     # TypeScript type definitions
│   │   ├── auth.types.ts          # AuthContextType, AuthFormContextType
│   │   ├── crm.types.ts
│   │   ├── leads.types.ts
│   │   ├── marketing.types.ts
│   │   └── database/              # Supabase table types
│   ├── utils/                     # Pure utility functions
│   │   ├── authErrors.ts
│   │   ├── leadValidation.ts
│   │   ├── emailUtils.ts
│   │   ├── formValidation.ts
│   │   └── invitationValidation.ts
│   ├── constants/auth.ts          # Auth rules (8-char min, uppercase, number, symbol)
│   ├── lib/utils.ts               # cn() tailwind merge, formatCurrency()
│   └── test/
│       ├── setup.ts               # Vitest + testing-library config
│       └── test.d.ts
├── supabase/
│   ├── config.toml                # Supabase project config
│   └── functions/                 # Edge Functions (TypeScript/Deno)
│       ├── _shared/               # Shared CORS utility
│       ├── send-auth-email/       # Auth email delivery
│       ├── send-invitation/       # Agent invitation emails
│       ├── send-sms/              # SMS messaging
│       ├── process-inbound-email/ # Inbound email handler
│       ├── fetch-properties/      # MLS property data via RapidAPI
│       ├── handle-agent-interaction/
│       ├── process-data-feed/
│       ├── upload-brand-logo/
│       ├── upload-marketing-material/
│       ├── test-api-keys/
│       ├── delete-user/
│       ├── db-to-storage/
│       └── send-calculator/
├── public/                        # Static assets
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                # shadcn/ui config
└── .github/workflows/             # CI (note: uses outdated webpack runner)
```

---

## Authentication

- **Magic link auth via Supabase** (no password login by default)
- Auth state: `useAuth()` hook from `@/contexts/AuthContext`
- Roles: `admin`, `agent`, `owner` — stored in `user_roles` table, available as `userRole` in context
- All protected routes use the `PrivateRoute` wrapper in `AppRoutes.tsx`
- Rate limiting enforced in `AuthFormContext` via `remainingAttempts` / `isRateLimited`
- Password requirements (when applicable): 8-char min, uppercase, number, symbol — see `src/constants/auth.ts`

**Auth flow:**
1. Unauthenticated users land on `/` (Index) or `/auth`
2. Magic link sent → Supabase redirects back with token
3. Session stored in browser; `AuthProvider` initializes on mount
4. Protected routes redirect to `/` if no session

---

## Data Fetching Patterns

Use **React Query** for all server data. Key config in `App.tsx`:
- `staleTime: 5min` — data cached for 5 minutes
- `gcTime: 10min` — unused data kept for 10 minutes
- `retry: 1` — single retry on failure
- `refetchOnWindowFocus: false` — no automatic refetch

**Convention:** Domain-specific query logic lives in custom hooks under `src/hooks/`. Do not inline Supabase calls in components.

```tsx
// Good — use existing domain hook
const { data: leads } = useLeads();

// Bad — don't call Supabase directly in a component
const { data } = await supabase.from('leads').select('*');
```

---

## Supabase Integration

- Client: `import { supabase } from "@/integrations/supabase/client"`
- The `client.ts` and `types/` files are **auto-generated** — do not edit manually
- Database types are in `src/integrations/supabase/types/`
- Edge Functions are Deno/TypeScript in `supabase/functions/`
- RLS (Row Level Security) is enabled — queries are tenant-scoped automatically

**Key tables:** `invitations`, `properties`, `profiles`, `user_roles`, `leads`, `contacts`, `activities`, `campaigns`, `templates`, `agents`, `candidates`, `interactions`, `properties_matches`, `marketing`, `system_config`

---

## Component Conventions

### shadcn/ui Components
- Base components live in `src/components/ui/` — **do not modify these**
- Use `cn()` from `@/lib/utils` for conditional class merging (wraps `clsx` + `tailwind-merge`)
- Add new components to the appropriate feature subdirectory under `src/components/`

### Styling
- Tailwind CSS utility classes only — no plain CSS files (except `App.css`)
- Dark mode via `class` strategy (`.dark` class on `<html>`)
- Custom semantic colors defined in `tailwind.config.ts` as CSS variables:
  - `primary` (blue), `secondary`, `accent` (teal), `success` (green), `warning` (orange)
- Use `text-muted-foreground`, `bg-background`, `border` etc. for semantic theming

### Forms
- Always use **React Hook Form + Zod** for forms
- Define Zod schema → infer type → pass to `useForm<T>`
- Resolvers: `@hookform/resolvers/zod`

---

## TypeScript Conventions

- Path alias `@/` maps to `./src/` — always use this, never relative paths like `../../`
- `tsconfig.json` has `skipLibCheck: true` and does not enforce `strict` mode globally
- `no-unused-vars` rule is **disabled** in ESLint
- New types go in `src/types/` — name files as `<domain>.types.ts`
- Supabase DB types are imported from `@/integrations/supabase/types`

---

## Code Organization Rules

1. **Hooks** — business logic and data fetching belong in `src/hooks/`; group by domain
2. **Services** — complex multi-step operations (e.g., invitation flow) go in `src/services/`
3. **Utils** — pure functions with no side effects go in `src/utils/`
4. **Constants** — static config/enums go in `src/constants/`
5. **Types** — shared interfaces/types go in `src/types/`; component-local types stay in the component file

---

## Routing

Routes are defined in `src/routes/AppRoutes.tsx`. All page components are **lazy-loaded**.

| Path | Component | Access |
|---|---|---|
| `/` | `Index` | Public (redirects to `/dashboard` if authenticated) |
| `/auth` | `AuthPage` | Public (redirects to `/dashboard` if authenticated) |
| `/dashboard` | `Dashboard` | Protected |
| `/settings` | `Settings` | Protected |
| `/profile` | `Profile` | Protected |
| `/leads/:id` | `LeadDetails` | Protected |
| `/sales-funnel` | `SalesFunnel` | Protected |
| `/marketing` | `Marketing` | Protected |
| `/communications` | `Communications` | Protected |

To add a new route: add a lazy import + `<Route>` wrapped in `<PrivateRoute>` in `AppRoutes.tsx`.

---

## Testing

- Framework: **Vitest** with jsdom environment
- Utilities: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- Setup file: `src/test/setup.ts` (extends Vitest matchers, auto-cleanup)
- Test files: place alongside source as `*.test.tsx` or in `src/test/`
- No existing test files — the testing infrastructure is in place but tests have not been written yet

---

## Supabase Edge Functions

Functions are Deno/TypeScript and live in `supabase/functions/<name>/index.ts`. All functions import CORS headers from `_shared/cors.ts`.

To invoke a function from the frontend:
```ts
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' }
});
```

---

## Environment & Secrets

- **No `.env` file is used.** The Supabase anon key and URL are hardcoded in `src/integrations/supabase/client.ts` (this is the public anon key — safe by design, protected by RLS)
- Secret keys (service role, external APIs like RapidAPI, Twilio) are stored as Supabase Edge Function secrets, not in this repo
- Do not commit actual secrets to this repo

---

## Linting & Formatting

- **ESLint** config in `eslint.config.js` — TypeScript + React Hooks + React Refresh rules
- **Prettier** — `printWidth: 100`, 2-space indent, single quotes, trailing commas
- Run `npm run lint` before committing

---

## Key Patterns to Follow

- **Do not call Supabase directly from components** — use hooks
- **Do not modify `src/components/ui/`** — these are shadcn/ui primitives
- **Do not edit `src/integrations/supabase/client.ts` or its `types/` directory** — auto-generated
- **Use `@/` path alias** — never relative `../../` imports
- **Use React Query** for all async data — no raw `useEffect` + fetch patterns
- **Lazy-load all new pages** in `AppRoutes.tsx`
- **Wrap new pages in `<PrivateRoute>`** unless intentionally public

---

## Git & Branching

- Main branch: `main`
- Feature development branch: `claude/add-claude-documentation-GuyRL`
- Commit messages should be descriptive and reference the area of change
- CI is defined in `.github/workflows/` (note: currently references webpack; this is outdated for the Vite setup)
