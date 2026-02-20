# Security Fix Implementation Plan

Fixes all audit findings except M4 (Weak TOTP Parameters — intentionally 4 digits).

---

## Phase 1: Backend Core Security (basecamp)

### 1.1 Separate auth password from TOTP secret [H1]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Use `ATTENDANCE_2FA_PASSWORD` for password comparison (line 16–17)
- Keep `ATTENDANCE_2FA_SECRET` for TOTP code generation only (line 30)
- These are now two distinct env vars — knowing the login password no longer reveals the TOTP secret

### 1.2 Add JWT expiration [C2]

**File:** `apps/basecamp/src/attendance/attendance.module.ts`

- Add `expiresIn: "8h"` to `signOptions` in JwtModule config

### 1.3 Timing-safe password comparison [M3]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Replace `password !== expectedPassword` with `crypto.timingSafeEqual()`
- Handle length mismatch separately (timingSafeEqual requires equal-length buffers)

### 1.4 Replace console.error with NestJS Logger [L7]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Add `private readonly logger = new Logger(TwofaController.name)`
- Replace `console.error` on lines 22 and 40

### 1.5 Add `/2fa/code` endpoint — server-side TOTP generation [C1]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- New `GET /2fa/code` endpoint
- Manually verify JWT from `Authorization: Bearer <token>` header
- Call `TwofaService.getCurrentCode()` to generate the current TOTP code server-side
- Return `{ code }` — the secret never leaves the server

**File:** `apps/basecamp/src/attendance/twofa/twofa.service.ts`

- Add `getCurrentCode(): number` method using `getCurrentCode` from `@repo/twofa/server`

### 1.6 Stop leaking TOTP secret in auth response [C1]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Remove `secret: totpSecret` from the `/2fa/authenticate` JSON response
- Response becomes just `{ message: "Accepted", token }`

### 1.7 Add global ValidationPipe [H4]

**File:** `apps/basecamp/src/main.ts`

- Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`
- This activates the existing `@IsString()` / `@IsNotEmpty()` decorators on `TwofaSignInDto` and `TwofaValidateDto`

### 1.8 Add CORS configuration [H3]

**File:** `apps/basecamp/src/main.ts`

- Add `app.enableCors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" })`
- Deployments set `CORS_ORIGIN` to the basecamp-fe domain

### 1.9 Add rate limiting on auth endpoint [M2]

**Files:** `apps/basecamp/src/app.module.ts`, `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Install `@nestjs/throttler`
- Register `ThrottlerModule` in AppModule with default limits (e.g. 10 requests per 60 seconds)
- Apply `@Throttle()` to the `POST /2fa/authenticate` endpoint with a stricter limit (5 per 60s)

### 1.10 TOTP replay protection [M7]

**File:** `apps/basecamp/src/attendance/twofa/twofa.service.ts`

- Add an in-memory `Set<string>` of recently used codes (keyed by `${code}-${timeWindow}`)
- In `verifyCode`, after a successful verification, check if the code was already used in this window
- If already used, return `false`; otherwise add to set and return `true`
- Clean up stale entries every 60 seconds

---

## Phase 2: Frontend Changes (basecamp-fe)

### 2.1 Make JWT cookie httpOnly, remove secret cookie [C1 + H2]

**File:** `apps/basecamp-fe/src/lib/auth.ts`

- Set `httpOnly: true` on the `toofaToken` cookie
- Add `maxAge: 28800` (8 hours, matching JWT expiry) to the cookie
- Remove the entire `toofaSecret` cookie block — secret no longer sent by backend

### 2.2 Add server action to fetch TOTP code from backend

**File:** `apps/basecamp-fe/src/app/@auth/action.ts`

- New `getCode()` server action that:
  - Reads `toofaToken` from httpOnly cookie
  - Calls `GET /2fa/code` on basecamp backend with `Authorization: Bearer <token>`
  - Returns the code number (or null on failure)

### 2.3 Rearchitect TOTPProvider — poll server instead of generating client-side

**File:** `apps/basecamp-fe/src/app/@auth/totp-context.tsx`

- Remove `@repo/twofa/client` import and `generateCode` callback
- Accept `initialCode: number | null` and `fetchCode: () => Promise<number | null>` props instead of `secret`
- On mount and at each 30-second boundary, call `fetchCode()` to get the current code from the server
- Timer/progress bar remain computed locally from wall clock (no change to UX)

### 2.4 Update @auth/page.tsx

**File:** `apps/basecamp-fe/src/app/@auth/page.tsx`

- Remove `toofaSecret` cookie read
- Fetch initial code server-side by calling the backend `/2fa/code` endpoint
- Pass `initialCode` and the `getCode` server action to `TOTPProvider`
- Remove the `secret` prop entirely

### 2.5 Update sign-out action

**File:** `apps/basecamp-fe/src/app/@auth/action.ts`

- Remove `cookieStore.delete("toofaSecret")` from `signOut()` — cookie no longer exists

---

## Phase 3: Sheets Formula Injection [M6]

### 3.1 Sanitize user-controlled fields before writing to Sheets

**File:** `apps/basecamp/src/attendance/attendance.service.ts`

Add a sanitizer for the `discordName` field (the only user-controlled value written to Sheets):

```typescript
function sanitizeForSheets(value: string): string {
  if (/^[=+\-@\t\r\n]/.test(value)) {
    return "'" + value;
  }
  return value;
}
```

In `USER_ENTERED` mode, a leading `'` is Sheets' native text-prefix — it tells Sheets to treat the cell as literal text. The `'` is hidden in the Sheets UI, so display is unaffected. Critically, this preserves `USER_ENTERED` mode so the Boolean column (`isSigningIn: "true"` → Boolean `TRUE`) continues to work exactly as before.

Apply in `recordAttendance` before building the row array — sanitize only `discordName`.

---

## Phase 4: Additional Fixes

### 4.1 Refactor skipTwofa to explicit admin methods [L8]

**File:** `apps/basecamp/src/attendance/attendance.service.ts`

- Create `adminSignIn(discordId, guildId, discordName)` and `adminSignOut(discordId, guildId, discordName)` that skip 2FA and expired-session checks
- Update `bot.commands.ts` admin commands to call the new methods
- Remove the `skipTwofa` parameter from `signIn` and `signOut`

### 4.2 Add null check for admin role assertion [L9]

**File:** `apps/basecamp/src/bot/bot.commands.ts`

- Add `if (!interaction.member)` guard before the `as GuildMember` cast on lines 200 and 248

### 4.3 Scouting: Fix dead middleware [M1]

**File:** `apps/scouting/src/middleware.ts` (new) or delete `apps/scouting/src/proxy.ts`

- Since all server actions independently validate auth, the simplest fix is to delete the dead `proxy.ts` to avoid a false sense of security
- If defense-in-depth is preferred: create `middleware.ts` that imports and uses the proxy function with the correct Next.js middleware export pattern

### 4.4 Fix .gitignore to cover bare .env files [L6]

**File:** `.gitignore`

- Add `.env` and `**/.env` patterns

### 4.5 Scouting: Make allowed origins configurable via env var [L5]

**File:** `apps/scouting/next.config.ts`

- Read origins from `ALLOWED_ORIGINS` env var (comma-separated), falling back to the current hardcoded list

### 4.6 Scouting: Add startup env var validation [L4]

**File:** `apps/scouting/src/instrumentation.ts` (new or existing)

- Validate required env vars (`PIT_PHOTO_TOKEN_SECRET`, `AUTH_SECRET`, `TBA_API_KEY`, `ADMIN_EMAILS`) at startup
- Throw a descriptive error if any are missing

### 4.7 M5 (OAuth tokens plaintext) — Defer

This is a Better Auth default. Application-level encryption would require custom adapter logic and key management. Recommend accepting this risk with database-level encryption, or deferring to a future PR.

### 4.8 L1 (Public /api/teams/search) — Defer

FRC team data is publicly available. Recommend documenting this as intentional rather than adding auth.

### 4.9 L2 + L3 (Invite link limits and cleanup) — Defer

Low severity. Recommend as a separate PR for scouting app improvements.

---

## New Environment Variables

| Variable | App | Purpose |
|----------|-----|---------|
| `ATTENDANCE_2FA_PASSWORD` | basecamp | Login password (separate from TOTP secret) |
| `CORS_ORIGIN` | basecamp | Allowed CORS origin for basecamp-fe |

`ATTENDANCE_2FA_SECRET` continues to exist but is now used solely for TOTP code generation.

---

## Dependency Changes

| Package | App | Purpose |
|---------|-----|---------|
| `@nestjs/throttler` | basecamp | Rate limiting on auth endpoints |

---

## Execution Order

Steps 1.1–1.10 and 3.1 can be done in one commit (backend changes).
Steps 2.1–2.5 in a second commit (frontend changes that depend on the new backend endpoint).
Steps 4.1–4.6 can be done independently in parallel or as a third commit.
