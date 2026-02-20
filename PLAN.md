# Security Fix Implementation Plan

Fixes all audit findings except M4 (Weak TOTP Parameters — intentionally 4 digits) and M7 (TOTP replay — sign-in then sign-out in the same 30s window is valid).

---

## Phase 1: Backend Core Security (basecamp)

### 1.1 Separate auth password from TOTP secret [H1]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Use `ATTENDANCE_2FA_PASSWORD` for password comparison (line 16–17)
- Keep `ATTENDANCE_2FA_SECRET` for TOTP code generation only (line 30)
- These are now two distinct env vars — knowing the login password no longer reveals the TOTP secret

### 1.2 Add JWT expiration + auto-refresh [C2]

**File:** `apps/basecamp/src/attendance/attendance.module.ts`

- Add `expiresIn: "7d"` to `signOptions` in JwtModule config (long-lived for kiosk use)

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Add `POST /2fa/refresh` endpoint: accepts a valid (non-expired) JWT, returns a new JWT with fresh 7-day expiry
- Verifies the existing token before issuing a new one

### 1.3 Timing-safe password comparison [M3]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Replace `password !== expectedPassword` with `crypto.timingSafeEqual()`
- Handle length mismatch separately (timingSafeEqual requires equal-length buffers)

### 1.4 Replace console.error with NestJS Logger [L7]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Add `private readonly logger = new Logger(TwofaController.name)`
- Replace `console.error` on lines 22 and 40

### 1.5 Stop leaking TOTP secret in auth response [C1]

**File:** `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Remove `secret: totpSecret` from the `/2fa/authenticate` JSON response
- Response becomes just `{ message: "Accepted", token }`

### 1.6 Add global ValidationPipe [H4]

**File:** `apps/basecamp/src/main.ts`

- Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`
- This activates the existing `@IsString()` / `@IsNotEmpty()` decorators on `TwofaSignInDto` and `TwofaValidateDto`

### 1.7 Add CORS configuration [H3]

**File:** `apps/basecamp/src/main.ts`

- Add `app.enableCors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" })`
- Deployments set `CORS_ORIGIN` to the basecamp-fe domain

### 1.8 Add rate limiting on auth endpoint [M2]

**Files:** `apps/basecamp/src/app.module.ts`, `apps/basecamp/src/attendance/twofa/twofa.controller.ts`

- Install `@nestjs/throttler`
- Register `ThrottlerModule` in AppModule with default limits (e.g. 10 requests per 60 seconds)
- Apply `@Throttle()` to the `POST /2fa/authenticate` endpoint with a stricter limit (5 per 60s)

---

## Phase 2: Frontend Changes (basecamp-fe)

### 2.1 Make JWT cookie httpOnly, remove secret cookie [C1 + H2]

**File:** `apps/basecamp-fe/src/lib/auth.ts`

- Set `httpOnly: true` on the `toofaToken` cookie
- Add `maxAge` matching 7-day JWT expiry
- Remove the entire `toofaSecret` cookie block — secret no longer sent by backend

### 2.2 Generate TOTP codes on the Next.js server [C1]

`basecamp-fe` already depends on `@repo/twofa`. Instead of fetching codes from the remote basecamp API (which had reliability issues on the Pi), generate them locally on the Next.js server using `getCurrentCode` from `@repo/twofa/server`.

**File:** `apps/basecamp-fe/src/app/@auth/action.ts`

- New `getCode()` server action:
  - Reads `toofaToken` from httpOnly cookie, validates it
  - Generates TOTP code using `getCurrentCode(process.env.ATTENDANCE_2FA_SECRET, { timeStep: 30, digits: 4 })`
  - Returns the code number (or null on auth failure)
  - No network call to basecamp backend — fully local, reliable on the Pi

- As a side-effect, checks JWT expiry. If expiring within 24 hours, calls `POST /2fa/refresh` on basecamp backend to refresh the token and update the cookie. If refresh fails (network blip), no problem — the token is still valid for days, and it'll retry in 30 seconds.

**New env var:** `ATTENDANCE_2FA_SECRET` added to basecamp-fe environment (same value as basecamp).

### 2.3 Rearchitect TOTPProvider — poll server action instead of generating client-side

**File:** `apps/basecamp-fe/src/app/@auth/totp-context.tsx`

- Remove `@repo/twofa/client` import and client-side `generateCode` callback
- Accept `initialCode: number | null` and `fetchCode: () => Promise<number | null>` props instead of `secret`
- On mount and at each 30-second boundary, call `fetchCode()` (the server action)
- Timer/progress bar remain computed locally from wall clock — **no change to UX**
- The secret never reaches the browser

### 2.4 Update @auth/page.tsx

**File:** `apps/basecamp-fe/src/app/@auth/page.tsx`

- Remove `toofaSecret` cookie read
- Fetch initial code server-side via `getCurrentCode` directly (server component has access)
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

**File:** delete `apps/scouting/src/proxy.ts`

- All server actions independently validate auth, so this is dead code creating a false sense of security
- Delete it

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

Better Auth default. Application-level encryption would require custom adapter logic and key management. Recommend accepting risk or deferring to a future PR.

### 4.8 L1 (Public /api/teams/search) — Defer

FRC team data is publicly available. Document as intentional.

### 4.9 L2 + L3 (Invite link limits and cleanup) — Defer

Low severity. Separate PR for scouting improvements.

---

## New Environment Variables

| Variable | App | Purpose |
|----------|-----|---------|
| `ATTENDANCE_2FA_PASSWORD` | basecamp | Login password (separate from TOTP secret) |
| `ATTENDANCE_2FA_SECRET` | basecamp-fe | TOTP secret for server-side code generation (same value as basecamp) |
| `CORS_ORIGIN` | basecamp | Allowed CORS origin for basecamp-fe |

`ATTENDANCE_2FA_SECRET` already exists in basecamp — now also needed in basecamp-fe's environment.

---

## Dependency Changes

| Package | App | Purpose |
|---------|-----|---------|
| `@nestjs/throttler` | basecamp | Rate limiting on auth endpoints |

---

## Execution Order

1. **Backend commit:** Steps 1.1–1.8 and 3.1 (all basecamp server changes)
2. **Frontend commit:** Steps 2.1–2.5 (basecamp-fe changes that depend on the backend changes)
3. **Cleanup commit:** Steps 4.1–4.6 (independent fixes across both apps)
