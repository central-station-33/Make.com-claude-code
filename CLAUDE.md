# CLAUDE.md

This file provides guidance to Claude when working with this repository.

## Project Overview

This is a React + TypeScript + Vite application — a CRM/lead management dashboard with AI agent capabilities. It uses Supabase for the backend and shadcn/ui components styled with Tailwind CSS.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Radix UI, Tailwind CSS, Lucide icons
- **Backend**: Supabase (auth, database, realtime)
- **State/Data**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM v6
- **Charts**: Recharts
- **Testing**: Vitest, Testing Library

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (Vite)
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Project Structure

```
src/
  components/        # All UI components
    auth/            # Authentication components
    ai-agent/        # AI agent chat interface
    crm/             # CRM contact/activity components
    dashboard/       # Dashboard metrics and tables
    campaigns/       # Campaign management
    common/          # Shared utility components
  pages/             # Route-level page components
  hooks/             # Custom React hooks
  integrations/      # External service integrations (Supabase)
  lib/               # Utility functions
```

## Architecture Notes

- Supabase client is initialized in `src/integrations/supabase/`
- Auth is handled via Supabase Auth with protected routes
- All data fetching uses TanStack Query for caching/synchronization
- Components follow shadcn/ui patterns — prefer composing existing UI primitives

## Code Style

- TypeScript strict mode; always type props and return values
- Prefer named exports over default exports for components
- Keep components focused; extract logic into custom hooks
- Use Zod schemas for form validation
- Tailwind for all styling — no inline styles, no CSS modules
