# TBA SDK

A modern, type-safe TypeScript SDK for [The Blue Alliance API v3](https://www.thebluealliance.com/apidocs/v3).

## Features

- ✅ **Type-safe** - Full TypeScript support with Zod runtime validation
- ✅ **Zero dependencies** - Uses native `fetch` (no axios)
- ✅ **Smart caching** - ETag-based caching with configurable cache backends
- ✅ **Functional API** - Clean, composable resource methods
- ✅ **Query builders** - Fluent API for complex queries
- ✅ **OpenAPI integration** - Auto-generated types from TBA's OpenAPI spec
- ✅ **Error handling** - Comprehensive error types with proper error messages

## Installation

```bash
pnpm add @repo/tba-sdk
```

## Quick Start

```typescript
import { createTBAClient } from "@repo/tba-sdk";

const tba = createTBAClient({
  apiKey: process.env.TBA_API_KEY!,
});

// Get team information
const team = await tba.teams.get(3506);
console.log(team.nickname); // "Yeti"

// Get event matches
const matches = await tba.matches.getEventMatches("2024ncwak");

// Use query builders for complex queries
const qualMatches = await tba
  .event("2024ncwak")
  .matches()
  .where({ compLevel: "qm" })
  .fetch();
```

## API Reference

### Creating a Client

```typescript
import { createTBAClient, MemoryCache } from "@repo/tba-sdk";

const tba = createTBAClient({
  apiKey: "your-api-key",
  baseUrl: "https://www.thebluealliance.com/api/v3", // optional
  cache: new MemoryCache(), // optional, defaults to MemoryCache
  defaultCache: true, // optional, defaults to true
});
```

### Resources

#### Teams

```typescript
// Get full team info
const team = await tba.teams.get(3506);

// Get simple team info
const simple = await tba.teams.getSimple(3506);

// Get years participated
const years = await tba.teams.getYearsParticipated(3506);

// Get team events
const events = await tba.teams.getEvents(3506, 2024);

// Get team matches for an event
const matches = await tba.teams.getMatches(3506, "2024ncwak");
```

#### Events

```typescript
// Get event info
const event = await tba.events.get("2024ncwak");

// Get all events for a year
const events = await tba.events.getByYear(2024);

// Get event teams
const teams = await tba.events.getTeams("2024ncwak");

// Get event rankings
const rankings = await tba.rankings.getEventRanking("2024ncwak");
```

#### Matches

```typescript
// Get match by key
const match = await tba.matches.getByKey("2024ncwak_qm1");

// Get all matches for an event
const matches = await tba.matches.getEventMatches("2024ncwak");

// Get simple matches
const simpleMatches = await tba.matches.getEventMatchesSimple("2024ncwak");
```

#### Rankings

```typescript
// Get event rankings
const rankings = await tba.rankings.getEventRanking("2024ncwak");

// Get district rankings
const district = await tba.rankings.getDistrictRanking("2024fim");

// Get regional pool rankings
const regional = await tba.rankings.getRegionalPoolRanking(2024);
```

#### Media

```typescript
// Get team media for a year
const media = await tba.media.getTeamMediaForYear(3506, 2024);

// Get all team media
const allMedia = await tba.media.getTeamMedia(3506);
```

### Query Builders

Query builders provide a fluent API for building complex queries:

```typescript
// Event query builder
const event = tba.event("2024ncwak");

// Get matches with filters
const qualMatches = await event
  .matches()
  .where({ compLevel: "qm" })
  .includeBreakdowns()
  .fetch();

// Get event info
const eventInfo = await event.get();

// Get teams
const teams = await event.getTeams();

// Team query builder
const team = tba.team(3506);

// Get team info
const teamInfo = await team.get();

// Get team events
const events = await team.getEvents(2024);

// Get team matches for an event
const matches = await team.getMatches("2024ncwak");
```

### Caching

The SDK includes built-in ETag-based caching. Responses are automatically cached and validated using HTTP ETags:

```typescript
import { createTBAClient, MemoryCache } from "@repo/tba-sdk";

// Use default memory cache
const tba = createTBAClient({ apiKey: "key" });

// Or provide a custom cache
const customCache = new MemoryCache({ maxSizeBytes: 10 * 1024 * 1024 }); // 10MB
const tba = createTBAClient({ apiKey: "key", cache: customCache });

// Disable caching for a specific request
const team = await tba.teams.get(3506, { cache: false });
```

### Error Handling

The SDK provides specific error types for different failure scenarios:

```typescript
import {
  TBAError,
  TBANotFoundError,
  TBARateLimitError,
  TBANetworkError,
  TBAValidationError,
} from "@repo/tba-sdk";

try {
  const team = await tba.teams.get(9999);
} catch (error) {
  if (error instanceof TBANotFoundError) {
    console.log("Team not found");
  } else if (error instanceof TBARateLimitError) {
    console.log("Rate limited - slow down");
  } else if (error instanceof TBANetworkError) {
    console.log("Network error:", error.cause);
  } else if (error instanceof TBAValidationError) {
    console.log("Invalid response:", error.zodError);
  }
}
```

## Migration Guide

### From YETIBlueClient (Class-based API)

**Old API:**
```typescript
import { YETIBlueClient } from "@repo/tba-sdk";

const client = new YETIBlueClient({
  apiKey: "key",
  baseUrl: "https://www.thebluealliance.com/api/v3",
});

const team = await client.teams.get(3506);
```

**New API:**
```typescript
import { createTBAClient } from "@repo/tba-sdk";

const tba = createTBAClient({
  apiKey: "key",
  // baseUrl is optional, defaults to v3 API
});

const team = await tba.teams.get(3506);
```

### Key Changes

1. **Factory function instead of class**: Use `createTBAClient()` instead of `new YETIBlueClient()`
2. **Functional resources**: Resources are now functions, not class instances
3. **Query builders**: New fluent API for complex queries
4. **Better error types**: More specific error classes
5. **Native fetch**: No axios dependency

The old `YETIBlueClient` is still available but deprecated. It will be removed in a future version.

## Type Generation

The SDK can generate TypeScript types from TBA's OpenAPI specification:

```bash
pnpm generate:types
```

This generates types in `src/generated/tba-api.ts` that provide complete API coverage.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Generate types from OpenAPI
pnpm generate:types
```

## License

ISC

---

Powered by [The Blue Alliance](https://www.thebluealliance.com/api/v3)
