# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui

## Project: EarnHub

A full-stack earning platform with:
- Multi-level referral system (5 levels: $0.54 / $0.29 / $0.14 / $0.07 / $0.04)
- Ad watching earnings ($0.018 per ad, 20/day limit)
- Daily joining bonus (2/4/6 joins → $1/$1/$2)
- Milestone rewards (15 to 1000 referrals)
- Global pool (weekly distribution)
- Deposit system (JazzCash, EasyPaisa, Bank Transfer)
- Withdrawal system (min $1, first withdraw $0.43)
- Admin panel (approve deposits/withdrawals, block users, adjust balances)

## Demo Credentials
- **Admin**: admin@earnhub.com / password
- **User**: alice@example.com / password
- **User**: bob@example.com / password

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Artifacts
- `artifacts/api-server` — Express 5 backend (serves at `/api`)
- `artifacts/earn-platform` — React + Vite frontend (serves at `/`)

### Shared Libraries
- `lib/api-spec` — OpenAPI spec + Orval codegen config
- `lib/api-client-react` — Generated React Query hooks
- `lib/api-zod` — Generated Zod validation schemas
- `lib/db` — Drizzle ORM schema + db client

### Database Schema
- `users` — User accounts with balance, earnings, referral tracking
- `transactions` — All money movements (earnings, deposits, withdrawals)
- `referrals` — Referral relationship tree with level/commission tracking
- `ad_watches` — Daily ad watching records with abuse prevention
- `deposits` — Deposit requests with admin approval workflow
- `withdrawals` — Withdrawal requests with admin approval workflow
- `rewards` — Milestone reward claim records
- `global_pool` — Weekly pool balance and distribution tracking
- `joining_bonuses` — Daily joining bonus milestone tracking

### API Routes (all under /api)
- `/auth` — register, login, logout, me
- `/users/dashboard` — dashboard stats
- `/wallet/transactions` — transaction history
- `/ads/watch` + `/ads/status` — ad watching
- `/referrals/team` + `/referrals/earnings` — referral tree
- `/deposits` — CRUD + manual approval
- `/withdrawals` + `/withdrawals/live-feed` — withdrawal system
- `/rewards` — milestone rewards
- `/global-pool/status` — pool status
- `/admin/*` — admin panel (users, deposits, withdrawals, analytics)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
