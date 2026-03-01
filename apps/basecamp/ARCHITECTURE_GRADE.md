# Basecamp Architecture Grade Report

**Date:** 2026-03-01
**Scope:** `apps/basecamp` — NestJS Discord bot + REST service

---

## Overall Grade: **B+**

The basecamp application demonstrates strong fundamentals: clean module boundaries, functional error handling with `neverthrow`, thorough test coverage, and a well-structured configuration system. The areas preventing an A relate to missing NestJS infrastructure (global pipes, filters, health checks), some code duplication in command handlers, and a few security/observability gaps.

---

## Category Grades

### 1. Module Architecture & Separation of Concerns — **A**

**What's done well:**
- Clean feature-module boundaries: `attendance`, `outreach`, `handbook`, `lifecycle` each own their domain
- Shared infrastructure (`config/`, `lib/`) is properly separated from feature modules
- Repository pattern cleanly abstracts Google Sheets data access from business logic
- `SheetService` is injected via factory providers with per-module configuration (different spreadsheet IDs and cache TTLs)
- Global modules (`AppConfigModule`, `CacheModule`) are used correctly and sparingly

**No action needed.**

---

### 2. Error Handling — **A-**

**What's done well:**
- Consistent use of `neverthrow` (`Result<T, E>` / `ResultAsync<T, E>`) throughout services and repositories
- Errors are mapped and logged at appropriate layers
- Command handlers gracefully degrade with user-friendly Discord messages on failure
- `fromThrowable` is used to safely wrap operations that could throw (e.g., `Intl.DateTimeFormat`)

**What prevents an A:**
- `TwofaController` (`twofa.controller.ts:19`) uses `console.error` instead of the NestJS `Logger`
- No global exception filter to catch unhandled errors across the application — if a command handler throws unexpectedly, there's no safety net
- `HandbookCommands.onHandbook` (`handbook.commands.ts:51`) catches and re-throws errors (`throw error`), which does nothing useful since no global filter exists to catch it

**Steps to reach A:**
1. Replace `console.error` calls in `TwofaController` with `private readonly logger = new Logger(TwofaController.name)`
2. Add a global exception filter (either NestJS `APP_FILTER` or a Necord-aware filter) that logs unexpected errors and returns a safe response to users
3. In `HandbookCommands.onHandbook`, reply with an error message to the user instead of re-throwing, matching the pattern used in attendance commands

---

### 3. Testing — **A**

**What's done well:**
- 26 spec files co-located with implementations — every module, service, repository, guard, controller, and utility has tests
- Tests use `@nestjs/testing` with `Test.createTestingModule()` properly
- Excellent edge-case coverage: stale sessions, timezone boundaries, tie-breaking in rankings, malformed sheet rows, 2FA enable/disable permutations
- 1000+ lines of attendance service tests alone, covering the full state machine
- Proper use of `vi.useFakeTimers()` / `vi.setSystemTime()` for time-sensitive logic
- Module compilation tests verify DI wiring is correct
- Helper factories (`makeModule()`, `makeInteraction()`) keep tests DRY

**Minor note:** The E2E test (`test/app.e2e-spec.ts`) tests `GET /` returning `"Hello World!"`, but the app has no controller that serves this route — the test would fail if actually run against the real `AppModule`. This appears to be NestJS scaffold boilerplate that was never updated. Not enough to drop the grade, but worth cleaning up.

**No action needed for the grade.** Optionally remove or update the stale E2E test.

---

### 4. Configuration & Environment Management — **A**

**What's done well:**
- Zod schema validation at startup prevents the app from running with invalid config
- Typed `AppConfigService.get<T>(key)` with full inference — no stringly-typed `process.env` access anywhere in the codebase
- Camel-case mapping in `validateEnv` cleanly transforms `SCREAMING_SNAKE` env vars to TypeScript-friendly keys
- Base64 decoding and JSON parsing of Google credentials happens in the schema transform — validated once, correct everywhere
- Global module with proper exports means any service can inject `AppConfigService`
- Test coverage for validation edge cases (missing fields, malformed base64, etc.)

**No action needed.**

---

### 5. Security — **B**

**What's done well:**
- JWT authentication for 2FA endpoints
- TOTP verification with windowed tolerance
- Admin commands check Discord role membership
- Dockerfile runs as non-root user
- Rate limiting on the AI-powered `/handbook` command

**What prevents an A:**
- `main.ts` does not enable the `ValidationPipe` globally — the `class-validator` decorators on `TwofaSignInDto` and `TwofaValidateDto` are **not actually enforced**. A request with `{ password: 123 }` (number instead of string) would bypass `@IsString()` validation
- `TwofaController` uses `@Res()` to manually send responses, which bypasses NestJS interceptors and exception filters
- JWT tokens issued in `TwofaController.signIn` have no expiration set (`expiresIn` not configured in `JwtModule.registerAsync`)
- The `TwofaGuard` exists but is not applied to any route — there are no protected endpoints using it
- `TwofaController.signIn` reuses `attendance2faSecret` as both the password and the TOTP secret returned to the client — these should be separate secrets

**Steps to reach A:**
1. Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` in `main.ts` to enforce DTO validation
2. Add `expiresIn: '1h'` (or appropriate TTL) to the JWT sign options in `attendance.module.ts`
3. Separate the 2FA login password from the TOTP secret — they currently share `attendance2faSecret`
4. Apply `TwofaGuard` to routes that should be protected, or remove it if it's dead code
5. Avoid `@Res()` in controllers — use standard return values so NestJS can apply interceptors and filters

---

### 6. Code Duplication & DRY Principles — **B+**

**What's done well:**
- Constants extracted to dedicated files (`attendance.constants.ts`, `outreach.constants.ts`)
- Shared utilities in `lib/utils/`
- `SheetService` is a generic reusable abstraction instantiated per module

**What prevents an A:**
- The leaderboard formatting logic is nearly identical between `AttendanceCommands.onAttendanceLeaderboard` and `OutreachCommands.onOutreachLeaderboard` — same medal emoji switch statement, same string building pattern
- `onSignIn` and `onSignOut` in `AttendanceCommands` share ~80% of their structure (defer reply → get nickname → call service → handle result → announce to channel). Same for `onAdminSignIn`/`onAdminSignOut`
- `OutreachRepository.parseRow` returns `OutreachRecord | null` while `AttendanceRepository.parseRow` returns `Result<AttendanceRecord, ZodError>` — inconsistent patterns for the same conceptual operation

**Steps to reach A:**
1. Extract a shared `formatLeaderboard(title: string, entries: {userName: string, totalHours: number}[])` utility used by both attendance and outreach commands
2. Consider extracting a command response helper that handles the common defer → nickname → service call → announce pattern
3. Standardize repository `parseRow` to use the same return type (either both `Result` or both nullable)

---

### 7. NestJS Best Practices & Idiomatic Patterns — **B**

**What's done well:**
- Proper use of `@Global()` for config module
- Factory providers for `SheetService` injection with different config per module
- `NecordModule.forRootAsync()` with dependency injection
- Guards implemented correctly (`CanActivate`, custom `ThrottlerGuard`)
- `@Injectable()` decorators on all providers

**What prevents an A:**
- No global `ValidationPipe` — DTOs with `class-validator` decorators are decoration-only
- No global exception filter
- No health check endpoint (important for container orchestration / Docker / Kubernetes readiness probes)
- `main.ts` is minimal to a fault — no CORS configuration, no helmet, no shutdown hooks (`app.enableShutdownHooks()`)
- `TwofaController` uses `@Res()` which opts out of NestJS's response handling pipeline
- `JwtModule` is registered as `global: true` inside `AttendanceModule` — this is a side effect that leaks module scope; it should be in `AppModule` or its own global module if intended to be global

**Steps to reach A:**
1. Add global `ValidationPipe` in `main.ts`
2. Add `app.enableShutdownHooks()` for graceful shutdown (important for the Discord bot connection)
3. Add a health check endpoint (`@nestjs/terminus`) or at minimum a `GET /health` route for container probes
4. Move `JwtModule.registerAsync({ global: true })` to `AppModule` or a dedicated `AuthModule` — global registration should be explicit at the root level
5. Add a global exception filter (at minimum, one that logs and returns a generic error)
6. Remove `@Res()` usage in `TwofaController` — return objects directly and let NestJS handle serialization

---

### 8. Observability & Logging — **B+**

**What's done well:**
- NestJS `Logger` is used consistently across services and commands with class-name context
- Errors are logged at appropriate severity levels (`logger.error`, `logger.warn`)
- Malformed sheet rows are logged as warnings rather than silently dropped
- AI token usage is logged for cost tracking

**What prevents an A:**
- `console.error` in `TwofaController` instead of `Logger`
- No structured logging (e.g., JSON format for production log aggregation)
- No request logging middleware for HTTP endpoints
- No metrics or telemetry (request counts, latency, error rates)

**Steps to reach A:**
1. Replace all `console.error` / `console.log` with NestJS `Logger`
2. Add a logging middleware or interceptor for HTTP request/response tracking
3. Consider adding structured logging for production (e.g., `nestjs-pino` or custom `LoggerService`)

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

### 10. Deployment & Infrastructure — **A-**

**What's done well:**
- Multi-stage Docker build with proper pruning via `turbo prune --docker`
- Non-root user in production container
- Production deploy with `--prod` flag strips dev dependencies
- Alpine base for minimal image size
- Build scripts properly configured for NestJS CLI

**What prevents an A:**
- No health check in `main.ts` for Docker `HEALTHCHECK` or Kubernetes probes
- No graceful shutdown hooks (`enableShutdownHooks`) for clean Discord bot disconnection

**Steps to reach A:**
1. Add a health check endpoint
2. Add `app.enableShutdownHooks()` in `main.ts`

---

## Summary Table

| Category | Grade | Key Issue |
|---|---|---|
| Module Architecture | **A** | — |
| Error Handling | **A-** | Missing global exception filter, `console.error` usage |
| Testing | **A** | — |
| Configuration | **A** | — |
| Security | **B** | `ValidationPipe` not enabled, JWT has no expiry, shared secrets |
| Code Duplication | **B+** | Duplicate leaderboard formatting and command patterns |
| NestJS Best Practices | **B** | Missing global pipe/filter, `@Res()` usage, leaked global JWT |
| Observability | **B+** | `console.error`, no structured logging |
| Type Safety | **A** | — |
| Deployment | **A-** | No health check, no graceful shutdown |

---

## Highest-Impact Improvements (Priority Order)

1. **Enable `ValidationPipe` globally** — Currently DTO validation is not enforced. This is both a security and correctness issue.
2. **Add `app.enableShutdownHooks()`** — Required for clean Discord bot disconnection on container stop.
3. **Add a health check endpoint** — Required for production container orchestration.
4. **Configure JWT expiration** — Tokens currently never expire.
5. **Add a global exception filter** — Prevents unhandled errors from crashing the process silently.
6. **Separate the 2FA password from the TOTP secret** — Currently the same env var serves both roles.
