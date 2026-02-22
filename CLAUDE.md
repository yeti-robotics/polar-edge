# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Polar Edge is a scouting application for _FIRST_ Robotics Competition built by Team 3506, YETI Robotics. It uses a Turborepo monorepo structure with pnpm workspaces.

## Commands

### Development
```bash
# Install dependencies
pnpm install

# Start all apps in dev mode
turbo dev

# Start specific app
turbo dev --filter=scouting
turbo dev --filter=basecamp --filter=basecamp-fe

# Or use package.json shortcuts
pnpm dev:scouting
pnpm dev:basecamp
```

### Building & Testing
```bash
# Build all apps
turbo build

# Run all tests
turbo test

# Type checking
turbo typecheck

# Lint (Biome)
pnpm lint          # Check with errors on warnings
pnpm lint:fix      # Auto-fix issues
```

### Database (Scouting App)

Database operations run from `apps/scouting/`:

```bash
cd apps/scouting

# Start PostgreSQL (via Docker Compose)
pnpm db:start

# Generate migration files from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Seed database with test data
pnpm db:seed

# Reset database (drop, migrate, seed)
pnpm db:reset

# Clear database (drop, migrate only)
pnpm db:clear

# Open Drizzle Studio
pnpm db:studio
```

## Architecture

### Apps

#### `apps/scouting` (Next.js 16 + Turbopack)
Main scouting application for match data collection and analysis.

**Key Technologies:**
- **Framework**: Next.js 16 with React Server Components
- **Database**: Drizzle ORM with PostgreSQL
- **Auth**: Better Auth with Discord OAuth + Passkey support
- **Storage**: S3-compatible (DigitalOcean Spaces) for robot photos
- **AI**: Vercel AI SDK with OpenAI-compatible provider
- **Styling**: Tailwind CSS v4

**Structure:**
- `src/app/` - Next.js App Router pages and API routes (thin — delegates to features)
- `src/features/` - Feature modules: all business logic, server actions, queries, components, and hooks co-located by domain
- `src/components/` - Shared UI components used across multiple features (nav, layout, offline status)
- `src/lib/` - Library code and common utilities only (no feature logic)
  - `src/lib/database/` - Drizzle client and schema (tables, relations, views, types)
  - `src/lib/server/` - Server-side utilities: auth helpers, org/member helpers, storage, TBA, invite links, pit photo tokens
  - `src/lib/offline/` - Network status, queue count context, offline toast hooks
  - `src/lib/auth.ts` - Better Auth configuration with Discord provider
  - `src/lib/permissions.ts` - Super admin permission checks
  - `src/lib/utils.ts`, `src/lib/routes.ts`, `src/lib/cache.ts`, `src/lib/compress-image.ts`

**App Routes:**
- `/admin/` - Organization settings, members, invites, event management
- `/analysis/` - Team analysis, comparisons, event overview
- `/auto-path/` - Autonomous route creation and viewing
- `/forms/pit/` and `/forms/stand/` - Scouting forms
- `/leaderboard/` - Scout leaderboard
- `/picklist/` - Alliance picklist management
- `/profile/` - User profile and passkey management
- `/join/[token]/` and `/accept-invitation/[id]/` - Onboarding flows
- `/api/auth/` and `/api/teams/search/` - API routes

**Features Directory** (primary home for business logic):
```
src/features/
  analysis/       # queries, actions, components (TeamRadarChart, TeamKeyMetricsCard, etc.)
  auth/           # actions, SignInForm
  events/         # actions, components (ActiveEventForm, SyncFromTBAForm, EnrichTeamNamesForm)
  leaderboard/    # queries, utils, components
  org/
    settings/     # actions, actions.test.ts, OrganizationSettingsForm
    members/      # actions, actions.test.ts, RemoveMemberButton, RoleSelect
    invites/      # actions, InviteLinkManager, InviteLinkCopy, RevokeButton
  picklist/       # queries, types, actions, components
  scouting/
    stand/        # types, logic, actions, contexts/, components/, hooks/
    pit/          # types, logic, actions, photo-actions, components/, hooks/
    auto-path/    # logic, actions, components/
```

Each feature follows the pattern: `actions.ts` (server actions), `queries.ts` (DB reads), `types.ts`, `components/`, `hooks/`, with tests co-located as `*.test.ts`.

**Forms:**
- Stand form - Match scouting with state machine (auto/teleop phases, cycles, climb tracking)
- Pit form - Robot details and capabilities with photo upload
- Auto path - Autonomous route visualization and creation

#### `apps/basecamp` (NestJS)
Backend service providing Discord bot integration and Google Sheets automation.

**Structure:**
- `src/bot/` - Discord bot (Necord framework)
- `src/sheet/` - Google Sheets integration
- `src/attendance/`, `src/outreach/`, `src/handbook/` - Feature modules
- `src/ai/` - AI integration utilities

#### `apps/basecamp-fe` (Next.js)
Minimal frontend for Basecamp features (team displays, authentication).

### Packages

- `@repo/ui` - Shared UI components built on Radix UI primitives
- `@repo/tba-sdk` - TypeScript SDK for The Blue Alliance API (auto-generated from OpenAPI spec)
- `@repo/ai` - Shared AI/LLM utilities
- `@repo/twofa` - Two-factor authentication utilities
- `@repo/typescript-config` - Shared TypeScript configurations
- `@repo/vitest-config` - Shared Vitest test configurations

### Database Schema (Scouting)

**Core Tables:**
- `user`, `account`, `session`, `verification`, `passkey` - Better Auth tables
- `organization`, `member`, `invitation`, `organization_invite_link` - Multi-tenant organization system
- `event`, `organization_event`, `team`, `match`, `team_match` - Competition data
- `stand_form`, `cycle`, `climb` - Match scouting data
- `pit_form`, `pit_photo` - Robot documentation
- `auto_path` - Autonomous route tracking
- `picklist`, `picklist_team` - Alliance selection picklists

**Enum Types** (`schema/types/`):
- `alliance` - Red/Blue alliance
- `phase` - Auto/Teleop match phase
- `climb_type` - Climb level variants
- `drivetrain` - Robot drivetrain type
- `match_type` - Qualification/Playoff/Practice

**Key Patterns:**
- Snake case column names (via Drizzle `casing: "snake_case"`)
- Relations defined separately in `schema/relations/`
- Database views for common queries in `schema/views/`
- Custom types in `schema/types/`

**Example Query:**
```typescript
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import { user } from "@/lib/database/schema/tables/user";

const userData = await db.query.user.findFirst({
  where: eq(user.id, userId),
});
```

### Authentication & Authorization

**Better Auth** with Discord OAuth:
- Configuration in `apps/scouting/src/lib/auth.ts`
- Client utilities in `apps/scouting/src/lib/auth-client.ts`
- Organization-based multi-tenancy with roles (owner, admin, member, scout)
- Super admin system via `ADMIN_EMAILS` environment variable
- Invite link system for onboarding users

**Permission Checks:**
```typescript
import { isSuperAdmin } from "@/lib/permissions";

if (!isSuperAdmin(user.email)) {
  return { error: "Unauthorized" };
}
```

### Server Actions Pattern

Server actions live in `src/features/<feature>/actions.ts` and follow this pattern:

```typescript
"use server";

export async function exampleAction(input: unknown) {
  // 1. Authenticate
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  const member = await auth.api.getActiveMember({ headers: await headers() });
  if (!member) return { error: "No active organization" };

  // 2. Get active event
  const event = await getActiveEventForOrganization(member.organizationId);
  if (!event) return { error: "No active event" };

  // 3. Validate input with Zod
  const validated = schema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };

  // 4. Database transaction for multi-table operations
  const result = await db.transaction(async (tx) => {
    // ... perform operations
    return data;
  });

  // 5. Return success or error
  return { success: true, data: result };
}
```

## Versioning & Releases

This project uses **Release Please** for automated versioning. See `RELEASING.md` for full details.

### Conventional Commits

PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/) format (enforced by CI):

```
<type>(<scope>): <description>
```

**Common types:**
- `feat` - New feature (minor version bump)
- `fix` - Bug fix (patch version bump)
- `chore` - Maintenance (no version bump)
- `docs` - Documentation (no version bump)

**Scopes:**
- `scouting`, `basecamp`, `basecamp-fe` - Apps
- `ui`, `tba-sdk`, `ai`, `twofa` - Packages
- `deps` - Dependency updates

**Examples:**
```
feat(scouting): add climb tracking UI
fix(basecamp): correct JWT expiration handling
chore(deps): update dependencies
```

### Version Strategy

- **Scouting**: Year-based versioning `2026.minor.patch` (supports prereleases like `2026.1.0-alpha.1`)
- **Basecamp/Basecamp-FE**: Semantic versioning `major.minor.patch`

## Environment Setup

### Required `.env.local` Files

#### `apps/scouting/.env.local`
Copy from `apps/scouting/.env.example`:
- `DATABASE_URL` - PostgreSQL connection string
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` - Discord OAuth
- `BETTER_AUTH_URL` - Auth callback URL
- `ADMIN_EMAILS` - Comma-separated super admin emails
- `SPACES_*` - DigitalOcean Spaces credentials for image uploads

### Local Database

Option 1: Docker (recommended)
```bash
# Start PostgreSQL container
docker compose up -d

# Or use the db:start script
cd apps/scouting && pnpm db:start
```

Option 2: Local PostgreSQL
- Install PostgreSQL
- Update `DATABASE_URL` in `.env.local` to point to local instance
- Default: `postgresql://postgres:postgres@localhost:5432/polar_edge`

## Development Workflows

### Adding Database Schema Changes

1. Modify schema files in `apps/scouting/src/lib/database/schema/tables/`
2. Generate migration: `cd apps/scouting && pnpm db:generate`
3. Review generated migration in `src/lib/database/drizzle/`
4. Apply migration: `pnpm db:migrate`

### Working with Forms

Forms use TanStack Form (Next.js integration) or native React state machines. See memory notes for Stand Form state machine patterns (context splitting, mutually exclusive actions).

### Using The Blue Alliance SDK

```typescript
import { createTBAClient } from "@repo/tba-sdk";

const tba = createTBAClient(process.env.TBA_API_KEY);
const event = await tba.getEvent("2026nytr");
```

### UI Components

Import from `@repo/ui`:
```typescript
import { Button } from "@repo/ui/components/button";
import { Dialog } from "@repo/ui/components/dialog";
```

Components built on Radix UI with Tailwind v4 styling.

## Dependency Management

- **Package Manager**: pnpm (version specified in `package.json` `packageManager` field)
- **Version Catalog**: Shared dependency versions in `pnpm-workspace.yaml` `catalog:` section
- **Node Version**: See `.nvmrc` (use nvm or fnm)

## CI/CD

GitHub Actions workflows:
- `status-checks.yml` - Lint, test, typecheck, build on PRs
- `pr-title-lint.yml` - Validate conventional commit format
- `release-please.yml` - Automated releases on main
- `release-docker-images.yml` - Build Docker images on tag push
- `publish-basecamp.yml` - CI builds with `main` tag

Docker images hosted at `ghcr.io/yeti3506/polar-edge/{app}:{tag}`.

## External Documentation

Full project documentation: https://wiki.yetirobotics.org/books/polar-edge-analytics
