# TBA SDK

TypeScript SDK for [The Blue Alliance API v3](https://www.thebluealliance.com/apidocs/v3).

## Features

- Type-safe with auto-generated OpenAPI types
- Zero dependencies (native `fetch` + `lru-cache`)
- ETag-based caching
- Functional API with query builders
- Comprehensive error handling

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

// Get team info
const team = await tba.teams.get(3506);

// Get event matches
const matches = await tba.matches.getEventMatches("2024ncwak");

// Query builder for filtering
const qualMatches = await tba
  .event("2024ncwak")
  .matches()
  .where({ compLevel: "qm" })
  .fetch();
```

## API Reference

### Creating a Client

```typescript
import { createTBAClient } from "@repo/tba-sdk";

const tba = createTBAClient({
  apiKey: "your-api-key",
  cache: true, // optional: true, false, or MemoryCacheOptions
});
```

### Resources

```typescript
// Teams
await tba.teams.get(3506)                    // Full team info
await tba.teams.getSimple(3506)               // Simple team info
await tba.teams.getEvents(3506)               // Team events
await tba.teams.getEventMatches(3506, "2024ncwak") // Team matches at event

// Events
await tba.events.get("2024ncwak")             // Event info
await tba.events.getByYear(2024)              // All events for year
await tba.events.getTeams("2024ncwak")        // Event teams
await tba.events.getMatches("2024ncwak")      // Event matches
await tba.events.getRankings("2024ncwak")     // Event rankings

// Matches
await tba.matches.getByKey("2024ncwak_qm1")   // Match by key
await tba.matches.getEventMatches("2024ncwak") // Event matches

// Rankings & Media
await tba.rankings.getEventRankings("2024ncwak")
await tba.media.getTeamMediaForYear(3506, 2024)
```

### Query Builders

Fluent API for complex queries:

```typescript
// Event queries
const event = tba.event("2024ncwak");
await event.get()                          // Event info
await event.getTeams()                     // Event teams
await event.getRankings()                  // Event rankings

// Match filtering
await event.matches().where({ compLevel: "qm" }).fetch()
await event.matches().getByKey("2024ncwak_qm1")

// Team queries
const team = tba.team(3506);
await team.get()                           // Team info
await team.getEvents(2024)                 // Team events for year
await team.getMatches("2024ncwak")         // Team matches at event
```

### Caching

ETag-based caching with configurable backends:

```typescript
const tba = createTBAClient({
  apiKey: "key",
  cache: { max: 1000, defaultTTL: 120000 } // Custom options
});

// Disable caching
const tbaNoCache = createTBAClient({ apiKey: "key", cache: false });

// Skip cache for specific request
await tba.teams.get(3506, { skipCache: true });
```

### Error Handling

```typescript
import { TBANotFoundError, TBARateLimitError } from "@repo/tba-sdk";

try {
  const team = await tba.teams.get(3506);
} catch (error) {
  if (error instanceof TBANotFoundError) {
    // Handle 404
  } else if (error instanceof TBARateLimitError) {
    // Handle rate limit
  }
}
```

## Migration from YETIBlueClient

```typescript
// Old
import { YETIBlueClient } from "@repo/tba-sdk";
const client = new YETIBlueClient({ apiKey: "key" });

// New
import { createTBAClient } from "@repo/tba-sdk";
const tba = createTBAClient({ apiKey: "key" });
```

Key changes:

- Factory function instead of class constructor
- Functional API with query builders
- Native `fetch` instead of axios
- Enhanced caching and error handling

## Development

```bash
pnpm install    # Install dependencies
pnpm build      # Build package
pnpm test       # Run tests
pnpm generate:types  # Generate types from OpenAPI spec
```

## License

ISC

Powered by [The Blue Alliance](https://www.thebluealliance.com/api/v3)
