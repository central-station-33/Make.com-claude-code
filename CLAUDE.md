# CLAUDE.md — AI Assistant Guide

## Project Overview

This is a **real estate CRM web application** built with React, TypeScript, and Vite. It enables real estate agents to manage leads, track sales funnels, run marketing campaigns, handle communications, and view property listings. The backend is powered by Supabase (auth, database, edge functions).

The project was scaffolded via [Lovable](https://lovable.dev/projects/400f32cc-130c-444e-989c-7600cf6f6fb4).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 (SWC transpiler) |
| Routing | React Router DOM v6 |
| State / data fetching | TanStack React Query v5 |
| Auth + DB + Functions | Supabase |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v3 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 + typescript-eslint |
| Formatting | Prettier |

---

## Development Commands

```bash
# Start dev server (port 8080)
npm run dev

# Production build
npm run build

# Development build (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests (Vitest)
npx vitest

# Run tests with UI
npx vitest --ui
```

The dev server runs on **port 8080** (`strictPort: true`) with HMR on client port 443.

---

## Repository Layout

```
/
├── src/
│   ├── main.tsx              # App entry point
│   ├── App.tsx               # Root — providers (ErrorBoundary, QueryClient, Router, Auth)
│   ├── App.css
│   ├── components/           # Feature-grouped React components (21 areas)
│   ├── pages/                # Route-level page components
│   ├── routes/               # AppRoutes.tsx — route definitions
│   ├── hooks/                # Custom React hooks (63 files)
│   ├── contexts/             # React context providers
│   ├── services/             # Business logic (invitations, toasts, real estate)
│   ├── types/                # TypeScript type definitions
│   ├── integrations/
│   │   └── supabase/         # Auto-generated client + types (DO NOT edit manually)
│   ├── lib/                  # Utility helpers
│   ├── utils/                # Domain-specific utilities
│   ├── constants/            # App-wide constants (auth rules, etc.)
│   └── test/                 # Vitest setup files
├── supabase/
│   ├── config.toml           # Supabase project config (project_id: xidvccjjpyzqovgknsup)
│   └── functions/            # Edge functions (Deno/TypeScript)
├── public/                   # Static assets
├── .github/workflows/        # CI (webpack.yml — Node 18/20/22 matrix)
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── tsconfig.json             # Base TS config; path alias: @/* → ./src/*
├── components.json           # shadcn/ui config
├── eslint.config.js
└── .prettierrc
```

---

## Path Aliases

The `@/` alias maps to `./src/`. Always use it for imports:

```typescript
// Correct
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Avoid
import { supabase } from "../../integrations/supabase/client";
```

---

## Component Architecture

### Provider Hierarchy (`App.tsx`)

```
ErrorBoundary
  └── QueryClientProvider
        └── BrowserRouter
              └── AuthProvider
                    └── AuthFormProvider
                          └── AppRoutes + Toaster
```

### Routing (`src/routes/AppRoutes.tsx`)

All page-level components are **lazy-loaded** with `React.lazy()` and wrapped in `<Suspense>`. Protected routes use a `<PrivateRoute>` component that checks `session` from `useAuth()`.

| Route | Auth Required | Component |
|---|---|---|
| `/` | No | `Index.tsx` (redirects to `/dashboard` if authed) |
| `/auth` | No | `AuthPage` (redirects to `/dashboard` if authed) |
| `/dashboard` | Yes | `Dashboard.tsx` |
| `/settings` | Yes | `Settings.tsx` |
| `/profile` | Yes | `Profile.tsx` |
| `/leads/:id` | Yes | `LeadDetails.tsx` |
| `/sales-funnel` | Yes | `SalesFunnel.tsx` |
| `/marketing` | Yes | `Marketing.tsx` |
| `/communications` | Yes | `Communications.tsx` |

### Component Directory Structure

Components are organized by feature area under `src/components/`:

- `agents/` — Agent management
- `ai-agent/` — AI agent integration
- `auth/` — Auth forms, alerts, buttons, field components
- `campaigns/` — Campaign management
- `common/` — Shared/reusable primitives
- `crm/` — CRM activity, contacts, types
- `dashboard/` — Dashboard content, filters, stats, tabs
- `lead-magnets/` — Lead magnet templates
- `leads/` — Lead detail, forms, imports, messaging, timeline, follow-up
- `marketing/` — Marketing components, dialogs, uploads
- `messaging/` — Messaging/communications
- `owner/` — Owner-specific views and stats
- `profile/` — User profile
- `property/` — Property listings
- `sales/` — Sales pipeline components
- `sidebar/` — Navigation sidebar
- `stats/` — Statistics display
- `tools/` — Tooling components
- `ui/` — shadcn/ui base components (accordion, button, card, dialog, input, etc.)

---

## Supabase Integration

### Client

```typescript
import { supabase } from "@/integrations/supabase/client";
```

The client is initialized in `src/integrations/supabase/client.ts` with hardcoded (public anon) credentials — this is expected for Supabase's public key model.

**Do not edit `src/integrations/supabase/client.ts` or `src/integrations/supabase/types.ts` manually** — they are auto-generated by Lovable/Supabase tooling.

### Edge Functions

Located in `supabase/functions/`. Each function is a standalone Deno module:

| Function | Purpose |
|---|---|
| `send-auth-email` | Custom auth email sending |
| `send-invitation` | Invitation emails |
| `send-sms` | SMS notifications |
| `send-calculator` | Calculator/estimate emails |
| `fetch-properties` | Property data fetching |
| `process-data-feed` | External data feed processing |
| `process-inbound-email` | Inbound email handling |
| `handle-agent-interaction` | AI agent interaction |
| `upload-brand-logo` | Logo upload to storage |
| `upload-marketing-material` | Marketing asset upload |
| `delete-user` | User deletion |
| `db-to-storage` | DB to storage migration |
| `test-api-keys` | API key validation |

---

## Authentication

### Auth Flow

- `AuthContext` (`src/contexts/AuthContext.tsx`) initializes session on mount and subscribes to `supabase.auth.onAuthStateChange`
- `useAuthState` hook tracks session, user, and userRole
- `useAuthActions` hook exposes `signIn`, `signUp`, `signOut`
- The app renders `null` until auth is initialized (prevents flash)

### Password Requirements (`src/constants/auth.ts`)

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Max 5 login attempts before 15-minute lockout

### Auth Routes

| Action | Path |
|---|---|
| Sign in | `/auth` |
| Sign up | `/auth?type=signup` |
| Forgot password | `/auth?type=forgot` |
| Reset password | `/auth?type=recovery` |

---

## State Management

### React Query (`TanStack Query v5`)

Global client is configured in `App.tsx`:
- `staleTime`: 5 minutes
- `gcTime`: 10 minutes
- `retry`: 1
- `refetchOnWindowFocus`: false

Query hooks live in `src/hooks/queries/`. Use `useQuery` for reads and `useMutation` for writes.

### React Context

- `AuthContext` — session, user, userRole, auth actions
- `AuthFormContext` — form state for auth pages

---

## Data / Type Conventions

### Type Organization

```
src/types/
├── auth/           # Auth types
├── auth.types.ts   # AuthContextType and related
├── database/       # Database entity types
│   ├── agents/
│   ├── auth/
│   ├── crm/
│   ├── leads/
│   ├── misc/
│   └── properties/
├── supabase/       # Supabase-specific types
├── crm.types.ts
├── lead.ts
└── ...
```

Prefer using typed Supabase query results from `src/integrations/supabase/types.ts` rather than defining duplicate types.

### Utility Conventions

- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge) for className merging
- `src/utils/authErrors.ts` — auth error message mapping
- `src/utils/databaseRetry.ts` — retry logic for flaky DB calls
- `src/utils/rateLimiting.ts` — client-side rate limiting
- `src/utils/formValidation.ts` — shared Zod schemas

---

## Styling Conventions

- **Tailwind CSS** for all styling; avoid inline styles
- **shadcn/ui** components from `src/components/ui/` for base UI elements
- **Dark mode** is class-based (`next-themes`)
- Use the `cn()` utility for conditional/merged class names:
  ```typescript
  import { cn } from "@/lib/utils";
  className={cn("base-class", condition && "conditional-class")}
  ```
- Custom theme tokens defined in `tailwind.config.ts`
- Prettier line width: 100, single quotes, trailing commas

---

## Testing

- **Framework**: Vitest 3 with jsdom environment
- **Setup**: `src/test/setup.ts` — imports `@testing-library/jest-dom` matchers and calls `cleanup` after each test
- **Globals enabled** — no need to import `describe`, `it`, `expect`, etc.
- Path alias `@/` works in tests (configured in `vitest.config.ts`)

```typescript
// Example test structure
import { render, screen } from "@testing-library/react";
import { MyComponent } from "@/components/MyComponent";

it("renders correctly", () => {
  render(<MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/webpack.yml`):
- Triggers on push/PR to `main`
- Matrix: Node.js 18.x, 20.x, 22.x
- Steps: `npm install` → `npx webpack`

Note: The actual build tool is Vite, not webpack — the CI workflow may be outdated and should be updated to use `npm run build` instead.

---

## Key Patterns to Follow

1. **Lazy-load all page components** in `AppRoutes.tsx` using `React.lazy()`
2. **Wrap new pages** in `PrivateRoute` unless they are intentionally public
3. **Use `useAuth()`** to access session/user; never read Supabase auth directly in components
4. **Organize new hooks** into the appropriate subdirectory under `src/hooks/`
5. **Keep component files focused** — split large components into sub-components within the feature directory
6. **Use `cn()` for class merging** — never concatenate Tailwind class strings manually
7. **Do not edit auto-generated files**: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`
8. **Form handling**: React Hook Form + Zod resolver + validation schemas from `src/utils/formValidation.ts`
9. **Toasts**: Use `sonner` (via `src/services/toast/`) or `useToast` hook — not browser `alert()`
10. **Error handling**: Wrap page-level content in `<ErrorBoundary>` for resilience

---

## Environment / Secrets

The Supabase URL and anon key are committed directly in `src/integrations/supabase/client.ts` — this is intentional for the public anon key (safe to expose). Service role keys and other secrets should **never** be committed.

For local Supabase development, use the Supabase CLI with the project linked to `xidvccjjpyzqovgknsup`.
