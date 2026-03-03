# Basecamp Architecture Grade Report

**Date:** 2026-03-03
**Scope:** `apps/basecamp` — NestJS Discord bot + REST service
**Revision:** 2 (re-evaluated after security hardening merged to `main`)

---

## Overall Grade: **A-**

The basecamp application has undergone significant improvements since the initial review. All six highest-priority issues have been addressed: global `ValidationPipe`, JWT expiration with auto-refresh, separated 2FA secrets, `@Res()` removal, health check endpoint, and graceful shutdown hooks. The remaining gaps are code duplication in command handlers, a re-throw pattern in the handbook command, and the absence of structured logging.

---

## Category Grades

### 1. Module Architecture & Separation of Concerns — **A**

**What's done well:**
- Clean feature-module boundaries: `attendance`, `outreach`, `handbook`, `lifecycle`, `health` each own their domain
- Shared infrastructure (`config/`, `lib/`) is properly separated from feature modules
- Repository pattern cleanly abstracts Google Sheets data access from business logic
- `SheetService` is injected via factory providers with per-module configuration (different spreadsheet IDs and cache TTLs)
- Global modules (`AppConfigModule`, `CacheModule`, `JwtModule`) are registered at the root level in `AppModule`
- `HealthModule` is self-contained with its own controller and tests

**No action needed.**

---

### 2. Error Handling — **A**

**What's done well:**
- Consistent use of `neverthrow` (`Result<T, E>` / `ResultAsync<T, E>`) throughout services and repositories
- Errors are mapped and logged at appropriate layers using NestJS `Logger` — no `console.error` anywhere
- Command handlers gracefully degrade with user-friendly Discord messages on failure
- `fromThrowable` is used to safely wrap operations that could throw (e.g., `Intl.DateTimeFormat`)
- `TwofaController` now uses `@HttpCode()` decorators and returns objects directly, allowing NestJS exception filters to process `UnauthorizedException` properly
- `SheetService` mutex prevents concurrent append race conditions

**Minor note:** `HandbookCommands.onHandbook` (`handbook.commands.ts:53`) still catches and re-throws errors (`throw error`). While NestJS can now process this through its exception pipeline (since `@Res()` is gone from the controller layer), the handbook command is a Discord slash command — Necord does not have a built-in exception filter, so the re-throw would surface as an unhandled rejection. This is a minor edge case that doesn't drop the grade since the `try/catch` logs the error before re-throwing.

**No action needed for the grade.** Optionally replace `throw error` with a user-facing reply for robustness.

---

### 3. Testing — **A**

**What's done well:**
- 29 spec files co-located with implementations — every module, service, repository, guard, controller, and utility has tests
- New `health.controller.spec.ts` and `health.module.spec.ts` added for the health check feature
- Tests use `@nestjs/testing` with `Test.createTestingModule()` properly
- Excellent edge-case coverage: stale sessions, timezone boundaries, tie-breaking in rankings, malformed sheet rows, 2FA enable/disable permutations
- 1000+ lines of attendance service tests alone, covering the full state machine
- Proper use of `vi.useFakeTimers()` / `vi.setSystemTime()` for time-sensitive logic
- Module compilation tests verify DI wiring is correct
- Helper factories (`makeModule()`, `makeInteraction()`) keep tests DRY
- `TwofaController` tests updated to assert on direct return values (no more `makeRes()` mock) and verify separated `attendance2faPassword` vs `totpSecret`

**No action needed.**

---

### 4. Configuration & Environment Management — **A**

**What's done well:**
- Zod schema validation at startup prevents the app from running with invalid config
- Typed `AppConfigService.get<T>(key)` with full inference — no stringly-typed `process.env` access anywhere
- Secrets properly separated: `totpSecret` (TOTP seed), `attendance2faPassword` (login credential), and `jwtSecret` (token signing) are three distinct env vars
- Camel-case mapping in `validateEnv` cleanly transforms `SCREAMING_SNAKE` env vars to TypeScript-friendly keys
- Base64 decoding and JSON parsing of Google credentials happens in the schema transform — validated once, correct everywhere
- Test coverage for validation edge cases including the new `attendance2faPassword` and `totpSecret` fields

**No action needed.**

---

### 5. Security — **A-**

**What's done well:**
- `ValidationPipe` enabled globally with `whitelist: true` — DTOs are now enforced, extra properties are stripped
- JWT tokens expire after 24 hours (`expiresIn: "24h"` in `AppModule`)
- Auto-refresh in basecamp-fe: password stored in httpOnly cookie, `refreshToken()` transparently re-authenticates when tokens expire (critical for the lobby monitor use case)
- 2FA secrets fully separated: `attendance2faPassword` for login, `totpSecret` for TOTP seed — no shared secrets
- `@Res()` removed from `TwofaController` — NestJS interceptors and exception filters are no longer bypassed
- `TwofaController` uses NestJS `Logger` instead of `console.error`
- Admin commands check Discord role membership before execution
- Throttle guard on AI-powered `/handbook` command (2 req / 60s per user)
- Dockerfile runs as non-root user (uid 1001)
- `TwofaGuard` correctly extracts Bearer token and uses `verifyAsync()`

**What prevents an A:**
- `HandbookCommands.onHandbook` re-throws errors after logging — no Necord-level exception filter catches this, so an AI provider outage could surface as an unhandled promise rejection
- No rate limiting on `/signin` and `/signout` Discord commands beyond Discord's own built-in rate limits

**Steps to reach A:**
1. In `HandbookCommands.onHandbook`, replace `throw error` with `return interaction.reply("...")` to match the graceful pattern used in attendance commands
2. Consider adding the `NecordThrottlerGuard` to attendance sign-in/sign-out commands (low priority since Discord's own rate limits provide baseline protection)

---

### 6. Code Duplication & DRY Principles — **B+**

**What's done well:**
- Constants extracted to dedicated files (`attendance.constants.ts`, `outreach.constants.ts`)
- Shared utilities in `lib/utils/` (`discord.utils.ts`, `math.utils.ts`)
- `SheetService` is a generic reusable abstraction instantiated per module via factory providers
- Column index mapping via `COLUMN_INDICES` constant object in attendance

**What prevents an A:**
- The leaderboard formatting logic is nearly identical between `AttendanceCommands.onAttendanceLeaderboard` and `OutreachCommands.onOutreachLeaderboard` — same medal emoji switch statement, same string building pattern, same footer text structure
- `onSignIn` and `onSignOut` in `AttendanceCommands` share ~80% of their structure (defer reply → get nickname → call service → handle result → announce to channel). Same for `onAdminSignIn`/`onAdminSignOut`
- `OutreachRepository.parseRow` returns `OutreachRecord | null` while `AttendanceRepository.parseRow` returns `Result<AttendanceRecord, ZodError>` — inconsistent patterns for the same conceptual operation

**Steps to reach A:**
1. Extract a shared `formatLeaderboard(title: string, entries: {userName: string, totalHours: number}[], footer: string)` utility in `lib/utils/` used by both attendance and outreach commands
2. Extract a helper that handles the common attendance command flow: defer reply → fetch nickname → call service → handle success/failure → announce to channel. This would reduce ~200 lines of near-identical code across the four sign-in/sign-out handlers
3. Standardize repository `parseRow` to use the same return type (recommend both using `Result<T, ZodError>` since it's more informative)

---

### 7. NestJS Best Practices & Idiomatic Patterns — **A**

**What's done well:**
- Global `ValidationPipe` with `whitelist: true` in `main.ts` — DTOs are enforced
- `app.enableShutdownHooks()` for graceful shutdown of Discord bot and in-flight operations
- `JwtModule.registerAsync({ global: true })` registered in `AppModule` where it belongs — no side effects from feature modules
- `@HttpCode()` decorators on controller methods — no `@Res()` usage anywhere
- Factory providers for `SheetService` injection with different config per module
- `NecordModule.forRootAsync()` with dependency injection for Discord bot configuration
- Guards implemented correctly (`CanActivate` for `TwofaGuard`, `ThrottlerGuard` extension for `NecordThrottlerGuard`)
- `@Injectable()` decorators on all providers
- Health check endpoint following the controller pattern (no unnecessary `@nestjs/terminus` dependency)
- `HealthModule` properly encapsulates the health controller

**No action needed.**

---

### 8. Observability & Logging — **A-**

**What's done well:**
- NestJS `Logger` is used consistently across every service, command handler, repository, and controller with class-name context
- No `console.error` or `console.log` anywhere in the codebase
- Errors are logged at appropriate severity levels (`logger.error`, `logger.warn`, `logger.debug`)
- Malformed sheet rows are logged as warnings/debug rather than silently dropped
- AI token usage is logged for cost tracking (input/output/total tokens)
- Failed attendance operations include the Discord user ID in log messages

**What prevents an A:**
- No structured logging (JSON format for production log aggregation tools like Datadog, CloudWatch, etc.)
- No request logging middleware for the HTTP endpoints (`/2fa/authenticate`, `/2fa/validate`, `/health`)

**Steps to reach A:**
1. Add a simple logging interceptor or middleware for HTTP request/response tracking (method, path, status code, duration)
2. Consider a structured JSON logger for production if log aggregation is needed in the future (e.g., `nestjs-pino`)

---

### 9. Type Safety — **A**

**What's done well:**
- Zod schema inference (`z.infer<typeof Schema>`) generates types from validation schemas — single source of truth
- `AppConfigService.get<T extends keyof Env>()` provides compile-time key validation
- `neverthrow` types enforce explicit error handling at the type level — callers must handle both `Ok` and `Err`
- Discord command DTOs use Necord's typed option decorators
- No `any` types visible in the codebase; `as` casts are limited to Discord API boundaries (`interaction.member as GuildMember`)

**No action needed.**

---

### 10. Deployment & Infrastructure — **A**

**What's done well:**
- Multi-stage Docker build with proper pruning via `turbo prune --docker`
- Non-root user in production container (nodejs:1001)
- Production deploy with `--prod` flag strips dev dependencies
- Alpine base for minimal image size
- `HEALTHCHECK` instruction in Dockerfile (30s interval, 5s timeout, 3 retries) hitting `GET /health`
- `app.enableShutdownHooks()` ensures clean Discord bot disconnection on SIGTERM
- Port configurable via `PORT` env var with sensible default (8080)

**No action needed.**

---

## Summary Table

| Category | Previous Grade | Current Grade | Change |
|---|---|---|---|
| Module Architecture | **A** | **A** | — |
| Error Handling | **A-** | **A** | `console.error` eliminated, `@Res()` removed |
| Testing | **A** | **A** | Health module tests added |
| Configuration | **A** | **A** | Secrets properly separated |
| Security | **B** | **A-** | ValidationPipe, JWT expiry, separated secrets |
| Code Duplication | **B+** | **B+** | — |
| NestJS Best Practices | **B** | **A** | All major issues fixed |
| Observability | **B+** | **A-** | Logger used everywhere |
| Type Safety | **A** | **A** | — |
| Deployment | **A-** | **A** | Health check + shutdown hooks |

---

## Remaining Improvements (Priority Order)

1. **Extract shared leaderboard formatting utility** — Eliminates the most visible code duplication between attendance and outreach commands.
2. **Extract attendance command flow helper** — Reduces ~200 lines of near-identical defer → nickname → service → announce boilerplate across 4 handlers.
3. **Fix handbook error re-throw** — Replace `throw error` with `interaction.reply(...)` to prevent unhandled rejections.
4. **Standardize repository `parseRow` return types** — Both should return `Result<T, ZodError>` for consistency.
5. **Add HTTP request logging** — Simple middleware or interceptor for the 3 HTTP endpoints.
